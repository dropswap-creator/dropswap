'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import ItemCard from '@/components/ItemCard'
import { CATEGORIES } from '@/lib/types'
import type { Item, Category } from '@/lib/types'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [userCountry, setUserCountry] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single()
        if (profile?.country) setUserCountry(profile.country)
      }
    }
    init()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [category, userCountry])

  async function fetchItems() {
    setLoading(true)
    let query = supabase
      .from('items')
      .select('*, profiles(id, username, trust_score, total_ratings, completed_swaps)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (userCountry) query = query.eq('country', userCountry)
    if (category) query = query.eq('category', category)

    const { data } = await query
    setItems((data as Item[]) || [])
    setLoading(false)
  }

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Back to Barter.
        </h1>
        <p className="text-indigo-600 font-semibold text-xl mb-2">
          Swap More. Spend Less. Forward Together.
        </p>
        <p className="text-gray-500 text-lg">
          Trade what you have for what you want — no money needed.
        </p>
        {userCountry && (
          <p className="text-indigo-600 font-medium mt-2">
            Showing items in {userCountry}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | '')}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm appearance-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm mt-1">
            {userCountry
              ? `No items available in ${userCountry} yet. Be the first to post!`
              : 'Sign up to see items in your country.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
