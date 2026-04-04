import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { swapId } = await req.json()

  const { data: swap } = await supabaseAdmin
    .from('swaps')
    .select('requester_id, receiver_id, requester_escrow_pi, receiver_escrow_pi, requester_escrow_amount, receiver_escrow_amount')
    .eq('id', swapId)
    .single()

  if (!swap) return NextResponse.json({ error: 'Swap not found' }, { status: 404 })

  // Only participants can trigger this
  if (user.id !== swap.requester_id && user.id !== swap.receiver_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const refunds: Promise<any>[] = []

  if (swap.requester_escrow_pi && swap.requester_escrow_amount > 0) {
    refunds.push(
      stripe.refunds.create({
        payment_intent: swap.requester_escrow_pi,
        amount: swap.requester_escrow_amount,
      }).catch(() => null) // Don't fail if already refunded
    )
  }

  if (swap.receiver_escrow_pi && swap.receiver_escrow_amount > 0) {
    refunds.push(
      stripe.refunds.create({
        payment_intent: swap.receiver_escrow_pi,
        amount: swap.receiver_escrow_amount,
      }).catch(() => null)
    )
  }

  await Promise.all(refunds)

  return NextResponse.json({ ok: true })
}
