import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

async function verifyAdmin(authHeader: string | null) {
  if (!authHeader || !ADMIN_EMAIL) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req.headers.get('Authorization'))
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, targetId, extra } = await req.json()

  switch (action) {
    case 'ban_user':
      await supabaseAdmin.from('profiles').update({ banned: true }).eq('id', targetId)
      break

    case 'unban_user':
      await supabaseAdmin.from('profiles').update({ banned: false }).eq('id', targetId)
      break

    case 'delete_item':
      await supabaseAdmin.from('items').delete().eq('id', targetId)
      break

    case 'dismiss_report':
      await supabaseAdmin.from('reports').delete().eq('id', targetId)
      break

    case 'resolve_dispute': {
      const resolution = extra?.resolution // 'completed' | 'cancelled'
      if (!resolution) return NextResponse.json({ error: 'Missing resolution' }, { status: 400 })
      await supabaseAdmin.from('swaps').update({
        status: resolution,
        updated_at: new Date().toISOString(),
      }).eq('id', targetId)
      if (resolution === 'cancelled') {
        const { data: swap } = await supabaseAdmin
          .from('swaps')
          .select('requester_item_id, receiver_item_id')
          .eq('id', targetId)
          .single()
        if (swap) {
          await supabaseAdmin.from('items').update({ status: 'available' })
            .in('id', [swap.requester_item_id, swap.receiver_item_id])
        }
      }
      break
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
