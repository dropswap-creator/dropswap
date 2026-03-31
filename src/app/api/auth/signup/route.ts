import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client bypasses email confirmation entirely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, password, country, username } = await req.json()

  if (!email || !password || !country || !username) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Check username is unique
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
  }

  // Create user with email_confirm: true — no confirmation email sent
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create profile
  await supabaseAdmin.from('profiles').upsert({ id: data.user.id, country, username })

  return NextResponse.json({ ok: true })
}
