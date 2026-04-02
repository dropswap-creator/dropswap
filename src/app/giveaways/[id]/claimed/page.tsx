'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Gift } from 'lucide-react'

export default function ClaimedPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/login')
    })
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-sm shadow-sm">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift size={32} className="text-pink-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You claimed it!</h1>
        <p className="text-gray-500 text-sm mb-2">
          Payment confirmed. Contact the giver through the listing to arrange collection or postage.
        </p>
        <p className="text-gray-400 text-xs mb-6">Check your email for your receipt.</p>
        <Link
          href="/giveaways"
          className="inline-block bg-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-pink-600 transition-colors text-sm"
        >
          Browse more giveaways
        </Link>
      </div>
    </div>
  )
}
