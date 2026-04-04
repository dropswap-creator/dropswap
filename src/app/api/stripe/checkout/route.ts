import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { type, swapId, userId, itemId, escrowAmount, role } = await req.json()

    const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dropswap.co.uk'

    if (type === 'giveaway') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { name: 'DropSwap — Giveaway claim fee' },
            unit_amount: 99,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${BASE}/giveaways/${itemId}/claimed`,
        cancel_url: `${BASE}/giveaways/${itemId}/claim`,
        metadata: { type, itemId, userId },
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'swap_fee') {
      const escrowPence = Math.round((escrowAmount || 0) * 100)
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: 'DropSwap — Platform fee' },
            unit_amount: 99,
          },
          quantity: 1,
        },
      ]

      if (escrowPence > 0) {
        lineItems.push({
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'DropSwap — Escrow deposit (refunded automatically on swap completion)',
            },
            unit_amount: escrowPence,
          },
          quantity: 1,
        })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${BASE}/payment/success?swapId=${swapId}`,
        cancel_url: `${BASE}/swaps/${swapId}?payment=cancelled`,
        metadata: {
          type,
          swapId,
          userId,
          role: role || '',
          escrowPence: escrowPence.toString(),
        },
      })
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
