'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import { Gift, MapPin } from 'lucide-react'
import type { Item } from '@/lib/types'

export default function ClaimGiveawayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('items')
        .select('*, profiles(id, username, trust_score, total_ratings, completed_swaps)')
        .eq('id', id)
        .single()

      if (data) setItem(data as Item)
      setLoading(false)
    }
    load()
  }, [])

  async function handleClaim() {
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'giveaway', itemId: id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Payment failed. Please try again.')
        setPaying(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-64 max-w-lg mx-auto" />
  if (!item) return <div className="text-center py-20 text-gray-400">Item not found.</div>

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {item.images && item.images.length > 0 && (
          <div className="relative h-64 bg-gray-100">
            <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
            <div className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <Gift size={12} /> FREE
            </div>
          </div>
        )}

        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h1>
          <p className="text-gray-500 text-sm mb-4">{item.description}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <MapPin size={12} /> {item.country}
          </div>

          <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-5 text-sm text-pink-800">
            <strong>How it works:</strong> This item is being given away free. You pay a one-time £0.99 admin fee to claim it — then arrange collection or postage directly with the giver.
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

          <button
            onClick={handleClaim}
            disabled={paying || item.status !== 'available'}
            className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 text-sm"
          >
            {paying ? 'Redirecting...' : item.status !== 'available' ? 'Already claimed' : 'Claim for £0.99'}
          </button>
        </div>
      </div>
    </div>
  )
}
