'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Gift, MapPin, Tag } from 'lucide-react'
import type { Item } from '@/lib/types'

export default function GiveawaysPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchGiveaways() {
      const { data } = await supabase
        .from('items')
        .select('*, profiles(id, username, trust_score, total_ratings, completed_swaps)')
        .eq('status', 'available')
        .eq('category', 'Other')
        .ilike('title', '%giveaway%')
        .order('created_at', { ascending: false })
      setItems((data as Item[]) || [])
      setLoading(false)
    }
    fetchGiveaways()
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-3xl p-8 mb-8 text-center">
        <div className="flex justify-center mb-3">
          <Gift size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Giveaways</h1>
        <p className="text-pink-100 text-lg mb-4">
          Free items from the community — just pay a £0.99 claim fee to cover admin costs.
        </p>
        <Link
          href="/giveaways/new"
          className="inline-block bg-white text-pink-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-pink-50 transition-colors"
        >
          + Post a Giveaway
        </Link>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { step: '1', text: 'Browse free items posted by the community' },
          { step: '2', text: 'Claim an item by paying £0.99 admin fee' },
          { step: '3', text: 'Arrange collection or postage with the giver' },
        ].map((s) => (
          <div key={s.step} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">
              {s.step}
            </div>
            <p className="text-gray-600 text-sm">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Gift size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-medium">No giveaways yet</p>
          <p className="text-sm mt-1 mb-4">Be the first to give something away!</p>
          <Link href="/giveaways/new" className="bg-pink-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-pink-600 transition-colors">
            Post a Giveaway
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-100">
                {item.images && item.images.length > 0 ? (
                  <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl text-gray-300">🎁</div>
                )}
                <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                  <Gift size={10} /> FREE
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{item.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={10} /> {item.country}
                  </span>
                </div>
                <Link
                  href={`/giveaways/${item.id}/claim`}
                  className="w-full block text-center bg-pink-500 text-white font-semibold py-2 rounded-xl hover:bg-pink-600 transition-colors text-sm"
                >
                  Claim for £0.99
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
