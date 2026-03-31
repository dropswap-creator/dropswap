import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { swapId } = await req.json()
  if (!swapId) return NextResponse.json({ ok: true })

  try {
    // Get swap with all related data
    const { data: swap } = await supabaseAdmin
      .from('swaps')
      .select(`
        *,
        requester:profiles!swaps_requester_id_fkey(username),
        requester_item:items!swaps_requester_item_id_fkey(title),
        receiver_item:items!swaps_receiver_item_id_fkey(title)
      `)
      .eq('id', swapId)
      .single()

    if (!swap) return NextResponse.json({ ok: true })

    // Get receiver's email from auth.users
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(swap.receiver_id)
    if (!user?.email) return NextResponse.json({ ok: true })

    await resend.emails.send({
      from: 'DropSwap <noreply@dropswap.co.uk>',
      to: user.email,
      subject: `New swap offer for "${swap.receiver_item?.title}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://www.dropswap.co.uk/logo-full.png" alt="DropSwap" style="height: 60px;" />
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 8px;">You have a swap offer!</h1>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6;">
            <strong>${swap.requester?.username || 'Someone'}</strong> wants to swap their
            <strong>"${swap.requester_item?.title}"</strong> for your
            <strong>"${swap.receiver_item?.title}"</strong>.
          </p>
          <a href="https://www.dropswap.co.uk/swaps/${swapId}" style="display: inline-block; margin-top: 24px; background: #4f46e5; color: white; font-weight: 600; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 15px;">
            View Offer
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">DropSwap · Back to Barter. Swap More. Spend Less.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
