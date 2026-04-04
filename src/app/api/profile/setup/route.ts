import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bio, country, avatarUrl, username } = await req.json()
  if (!country) return NextResponse.json({ error: 'Country is required' }, { status: 400 })

  if (username) {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    bio: bio || null,
    avatar_url: avatarUrl || null,
    country,
    ...(username ? { username } : {}),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
