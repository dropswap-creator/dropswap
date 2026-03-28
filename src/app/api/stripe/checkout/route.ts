import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { type, itemValue, swapId, userId } = await req.json()

    let amount: number
    let description: string

    if (type === 'giveaway') {
      amount = 99 // £0.99 in pence
      description = 'DropSwap — Giveaway claim fee'
    } else if (type === 'completion') {
      amount = 100 // £1.00 in pence
      description = 'DropSwap — Swap completion fee'
    } else if (type === 'bond') {
      const bondPercent = itemValue * 0.1
      const bondAmount = Math.min(Math.max(bondPercent, 2), 20)
      amount = Math.round(bondAmount * 100) // convert to pence
      description = `DropSwap — Swap bond (refundable on completion)`
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/swaps/${swapId}?payment=success&type=${type}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/swaps/${swapId}?payment=cancelled`,
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
