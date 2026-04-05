import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId, title, description, category, estimatedValue, images, videoUrl } = await req.json()

  // Verify ownership
  const { data: item } = await supabaseAdmin.from('items').select('user_id').eq('id', itemId).single()
  if (!item || item.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updateData: Record<string, any> = {
    title,
    description,
    category,
    estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
  }
  if (images !== undefined) updateData.images = images
  if (videoUrl !== undefined) updateData.video_url = videoUrl

  const { error } = await supabaseAdmin.from('items').update(updateData).eq('id', itemId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
