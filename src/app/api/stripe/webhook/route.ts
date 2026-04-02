import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role key to bypass RLS for webhook updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { type, swapId, userId, itemId } = session.metadata || {}

    if (type === 'swap_fee' && swapId && userId) {
      const { data: swap } = await supabase
        .from('swaps')
        .select('status, receiver_id, requester_id, requester_paid, receiver_item_id')
        .eq('id', swapId)
        .single()

      if (swap) {
        if (swap.status === 'pending' && swap.receiver_id === userId) {
          // Receiver paid — accept the swap and lock their item
          await supabase
            .from('swaps')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', swapId)
          await supabase
            .from('items')
            .update({ status: 'in_swap' })
            .eq('id', swap.receiver_item_id)
        } else if (swap.requester_id === userId) {
          // Requester paid — mark requester_paid = true
          await supabase
            .from('swaps')
            .update({ requester_paid: true, updated_at: new Date().toISOString() })
            .eq('id', swapId)
        }
      }
    }

    if (type === 'giveaway' && itemId) {
      // Mark giveaway item as swapped so it can't be claimed again
      await supabase
        .from('items')
        .update({ status: 'swapped' })
        .eq('id', itemId)
    }
  }

  return NextResponse.json({ received: true })
}
