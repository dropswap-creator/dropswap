import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE = 'https://www.dropswap.co.uk'
const LOGO = `${BASE}/logo-full.png`
const FOOTER = `<p style="color:#9ca3af;font-size:12px;margin-top:32px;">DropSwap · Back to Barter. Swap More. Spend Less.</p>`

function wrap(body: string) {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${LOGO}" alt="DropSwap" style="height:60px;" />
    </div>
    ${body}
    ${FOOTER}
  </div>`
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;background:#4f46e5;color:white;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:15px;">${label}</a>`
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const { type, to, data } = await req.json()

  try {
    switch (type) {
      case 'welcome':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: 'Welcome to DropSwap 🔄',
          html: wrap(`
            <h1 style="font-size:24px;font-weight:700;color:#111827;margin-bottom:8px;">Welcome to DropSwap!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">You're in. Start browsing items in your country and make your first swap.</p>
            ${btn(BASE, 'Start Swapping')}
          `),
        })
        break

      case 'swap_request':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: `New swap request for "${data.itemTitle}"`,
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">You have a swap request!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              <strong>${data.requesterName}</strong> wants to swap <strong>"${data.requesterItem}"</strong> for your <strong>"${data.itemTitle}"</strong>.
            </p>
            ${btn(`${BASE}/swaps/${data.swapId}`, 'View Swap Request')}
          `),
        })
        break

      case 'swap_accepted':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: 'Your swap offer was accepted! 🎉',
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Offer accepted!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              <strong>${data.receiverName}</strong> has accepted your offer to swap <strong>"${data.requesterItem}"</strong> for <strong>"${data.receiverItem}"</strong>. Time to arrange shipping!
            </p>
            ${btn(`${BASE}/swaps/${data.swapId}`, 'View Swap')}
          `),
        })
        break

      case 'swap_declined':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: 'Your swap offer was declined',
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Offer declined</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              Unfortunately <strong>${data.receiverName}</strong> declined your swap offer for <strong>"${data.receiverItem}"</strong>. Your item has been unlocked — keep browsing!
            </p>
            ${btn(BASE, 'Browse Items')}
          `),
        })
        break

      case 'swap_cancelled':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: 'A swap offer was cancelled',
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Swap offer cancelled</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              <strong>${data.requesterName}</strong> cancelled their swap offer for your <strong>"${data.receiverItem}"</strong>. Your item is available again.
            </p>
            ${btn(BASE, 'Browse Items')}
          `),
        })
        break

      case 'swap_shipped':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: `${data.senderName} has shipped their item`,
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Item shipped!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              <strong>${data.senderName}</strong> has marked their item as shipped. Keep an eye out for <strong>"${data.senderItem}"</strong> in the post. Once you receive it, mark it as received.
            </p>
            ${btn(`${BASE}/swaps/${data.swapId}`, 'View Swap')}
          `),
        })
        break

      case 'swap_completed':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: 'Swap complete — don\'t forget to leave a rating! ⭐',
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Swap complete!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              Your swap is all done. Help build the community by leaving a rating for your swap partner.
            </p>
            ${btn(`${BASE}/swaps/${data.swapId}`, 'Leave a Rating')}
          `),
        })
        break

      case 'swap_disputed':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: 'A dispute has been raised on your swap',
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Dispute raised</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              <strong>${data.raisorName}</strong> has raised a dispute on your swap. Please communicate via the swap messages to try to resolve it. Our team will review if needed.
            </p>
            ${btn(`${BASE}/swaps/${data.swapId}`, 'View Swap')}
          `),
        })
        break

      case 'wanted_match':
        await resend.emails.send({
          from: 'DropSwap <noreply@dropswap.co.uk>', to,
          subject: `Someone just listed "${data.itemTitle}" — matches your wanted post!`,
          html: wrap(`
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:8px;">Match found!</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">
              A new item matching your wanted post <strong>"${data.wantedTitle}"</strong> was just listed: <strong>"${data.itemTitle}"</strong>.
            </p>
            ${btn(`${BASE}/items/${data.itemId}`, 'View Item')}
          `),
        })
        break
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
