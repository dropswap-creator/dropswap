import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { type, itemValue, swapId, userId, itemId } = await req.json()

    let amount: number
    let description: string

    if (type === 'giveaway' || type === 'swap_fee') {
      amount = 99 // £0.99 in pence
      description = type === 'giveaway' ? 'DropSwap — Giveaway claim fee' : 'DropSwap — Swap fee'
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: type === 'giveaway'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/giveaways/${itemId}/claimed`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/swaps/${swapId}?payment=success`,
      cancel_url: type === 'giveaway'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/giveaways/${itemId}/claim`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/swaps/${swapId}?payment=cancelled`,
      metadata: {
        type,
        swapId,
        userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
