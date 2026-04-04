import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { type, swapId, userId, itemId, role, escrowPence } = session.metadata || {}
    const paymentIntentId = session.payment_intent as string
    const escrowAmount = parseInt(escrowPence || '0', 10)

    if (type === 'swap_fee' && swapId && userId) {
      const { data: swap } = await supabase
        .from('swaps')
        .select('status, receiver_id, requester_id, requester_paid, receiver_item_id, requester_item_id')
        .eq('id', swapId)
        .single()

      if (!swap) return NextResponse.json({ received: true })

      const isReceiver = swap.receiver_id === userId

      if (isReceiver && swap.status === 'pending') {
        // Receiver paid → accept swap, lock their item, store escrow PI
        await supabase.from('swaps').update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
          receiver_escrow_pi: paymentIntentId,
          receiver_escrow_amount: escrowAmount,
        }).eq('id', swapId)
        await supabase.from('items').update({ status: 'in_swap' }).eq('id', swap.receiver_item_id)
      } else if (swap.requester_id === userId) {
        // Requester paid → mark paid, store escrow PI
        await supabase.from('swaps').update({
          requester_paid: true,
          updated_at: new Date().toISOString(),
          requester_escrow_pi: paymentIntentId,
          requester_escrow_amount: escrowAmount,
        }).eq('id', swapId)
      }
    }

    if (type === 'giveaway' && itemId) {
      await supabase.from('items').update({ status: 'swapped' }).eq('id', itemId)
    }
  }

  return NextResponse.json({ received: true })
}
