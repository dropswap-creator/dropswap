import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { itemId, itemTitle, category, country, postedByUserId } = await req.json()
  if (!category || !country || !itemId) return NextResponse.json({ ok: true })

  // Find wanted posts matching category + country, posted by someone else
  const { data: matches } = await supabaseAdmin
    .from('wanted_posts')
    .select('id, title, user_id')
    .eq('category', category)
    .eq('country', country)
    .neq('user_id', postedByUserId)
    .limit(10)

  if (!matches || matches.length === 0) return NextResponse.json({ ok: true })

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dropswap.co.uk'

  await Promise.all(
    matches.map(async (match) => {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(match.user_id)
      if (!user?.email) return
      await fetch(`${BASE}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wanted_match',
          to: user.email,
          data: { itemId, itemTitle, wantedTitle: match.title },
        }),
      })
    })
  )

  return NextResponse.json({ ok: true })
}
