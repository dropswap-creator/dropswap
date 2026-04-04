import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { swapId, newStatus } = await req.json()
  if (!swapId || !newStatus) return NextResponse.json({ ok: true })

  const { data: swap } = await supabaseAdmin
    .from('swaps')
    .select(`
      *,
      requester:profiles!swaps_requester_id_fkey(id, username),
      receiver:profiles!swaps_receiver_id_fkey(id, username),
      requester_item:items!swaps_requester_item_id_fkey(title),
      receiver_item:items!swaps_receiver_item_id_fkey(title)
    `)
    .eq('id', swapId)
    .single()

  if (!swap) return NextResponse.json({ ok: true })

  // Look up emails via admin auth API
  const [{ data: { user: requesterUser } }, { data: { user: receiverUser } }] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(swap.requester_id),
    supabaseAdmin.auth.admin.getUserById(swap.receiver_id),
  ])

  const requesterEmail = requesterUser?.email
  const receiverEmail = receiverUser?.email
  const requesterName = (swap.requester as any)?.username || 'Someone'
  const receiverName = (swap.receiver as any)?.username || 'Someone'
  const requesterItem = (swap.requester_item as any)?.title || 'their item'
  const receiverItem = (swap.receiver_item as any)?.title || 'your item'

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dropswap.co.uk'

  async function sendEmail(to: string, type: string, data: object) {
    await fetch(`${BASE}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data: { swapId, ...data } }),
    })
  }

  switch (newStatus) {
    case 'accepted':
      if (requesterEmail) await sendEmail(requesterEmail, 'swap_accepted', { receiverName, requesterItem, receiverItem })
      break
    case 'declined':
      if (requesterEmail) await sendEmail(requesterEmail, 'swap_declined', { receiverName, receiverItem })
      break
    case 'cancelled':
      if (receiverEmail) await sendEmail(receiverEmail, 'swap_cancelled', { requesterName, receiverItem })
      break
    case 'a_shipped':
      if (receiverEmail) await sendEmail(receiverEmail, 'swap_shipped', { senderName: requesterName, senderItem: requesterItem })
      break
    case 'b_shipped':
      if (requesterEmail) await sendEmail(requesterEmail, 'swap_shipped', { senderName: receiverName, senderItem: receiverItem })
      break
    case 'completed':
      if (requesterEmail) await sendEmail(requesterEmail, 'swap_completed', {})
      if (receiverEmail) await sendEmail(receiverEmail, 'swap_completed', {})
      break
    case 'disputed':
      // Notify the other party (whoever didn't raise it — we send to both and let them sort it)
      if (requesterEmail) await sendEmail(requesterEmail, 'swap_disputed', { raisorName: receiverName })
      if (receiverEmail) await sendEmail(receiverEmail, 'swap_disputed', { raisorName: requesterName })
      break
  }

  return NextResponse.json({ ok: true })
}
