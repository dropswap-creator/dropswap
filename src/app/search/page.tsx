'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ItemCard from '@/components/ItemCard'
import { CATEGORIES, COUNTRIES } from '@/lib/types'
import type { Item, Category } from '@/lib/types'
import { Search, SlidersHorizontal } from 'lucide-react'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState<Category | ''>(searchParams.get('cat') as Category || '')
  const [country, setCountry] = useState(searchParams.get('country') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  useEffect(() => {
    fetchItems()
  }, [category, country, sortBy])

  async function fetchItems() {
    setLoading(true)
    let q = supabase
      .from('items')
      .select('*, profiles(id, username, trust_score, total_ratings, completed_swaps)')
      .eq('status', 'available')

    if (category) q = q.eq('category', category)
    if (country) q = q.eq('country', country)
    if (sortBy === 'newest') q = q.order('created_at', { ascending: false })
    if (sortBy === 'oldest') q = q.order('created_at', { ascending: true })

    const { data } = await q
    setItems((data as Item[]) || [])
    setLoading(false)
  }

  const filtered = items.filter((i) =>
    !query ||
    i.title.toLowerCase().includes(query.toLowerCase()) ||
    i.description.toLowerCase().includes(query.toLowerCase())
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('cat', category)
    if (country) params.set('country', country)
    if (sortBy) params.set('sort', sortBy)
    router.push(`/search?${params.toString()}`)
    fetchItems()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Items</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | '')}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900 appearance-none"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
          >
            <option value="">All countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? 'Searching...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm mt-1">Try different keywords or filters</p>
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-white rounded-2xl h-64" />}>
      <SearchContent />
    </Suspense>
  )
}
