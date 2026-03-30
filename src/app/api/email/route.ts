import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { type, to, data } = await req.json()

  try {
    if (type === 'welcome') {
      await resend.emails.send({
        from: 'DropSwap <noreply@dropswap.co.uk>',
        to,
        subject: 'Welcome to DropSwap 🔄',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://www.dropswap.co.uk/logo-full.png" alt="DropSwap" style="height: 60px;" />
            </div>
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">Welcome to DropSwap!</h1>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">You're in. Start browsing items in your country and make your first swap.</p>
            <a href="https://www.dropswap.co.uk" style="display: inline-block; margin-top: 24px; background: #4f46e5; color: white; font-weight: 600; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 15px;">
              Start Swapping
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">DropSwap · Back to Barter. Swap More. Spend Less.</p>
          </div>
        `,
      })
    }

    if (type === 'swap_request') {
      await resend.emails.send({
        from: 'DropSwap <noreply@dropswap.co.uk>',
        to,
        subject: `New swap request for "${data.itemTitle}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://www.dropswap.co.uk/logo-full.png" alt="DropSwap" style="height: 60px;" />
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 8px;">You have a swap request!</h1>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
              <strong>${data.requesterName}</strong> wants to swap <strong>"${data.requesterItem}"</strong> for your <strong>"${data.itemTitle}"</strong>.
            </p>
            <a href="https://www.dropswap.co.uk/swaps/${data.swapId}" style="display: inline-block; margin-top: 24px; background: #4f46e5; color: white; font-weight: 600; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 15px;">
              View Swap Request
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">DropSwap · Back to Barter. Swap More. Spend Less.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
