'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ItemCard from '@/components/ItemCard'
import { CATEGORIES } from '@/lib/types'
import type { Item, Category } from '@/lib/types'
import {
  Search, SlidersHorizontal, ShieldCheck, Star, PackageCheck,
  Users, Leaf, Coins, ArrowRight, Recycle, Wind, BadgeCheck
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, string> = {
  'Clothing & Accessories': '👗',
  'Books & Media': '📚',
  'Toys & Games': '🎮',
  'Sports & Outdoors': '⚽',
  'Home & Garden': '🏡',
  'Art & Crafts': '🎨',
  'Music & Instruments': '🎸',
  'Food & Drinks': '🍎',
  'Collectibles': '🏆',
  'Furniture': '🛋️',
  'Tools': '🔧',
  'Baby & Kids': '👶',
  'Plants & Garden': '🌱',
  'Experiences & Services': '✨',
  'Vehicles & Transport': '🚲',
  'Pet Supplies': '🐾',
  'Spiritual & Esoteric': '🔮',
  'Other': '📦',
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [userCountry, setUserCountry] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single()
        if (profile?.country) setUserCountry(profile.country)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (isLoggedIn) fetchItems()
  }, [category, userCountry, isLoggedIn])

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
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-3xl mb-12">
        <div className="px-8 py-16 text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Everything&apos;s gone up.<br />Your swaps don&apos;t have to.
          </h1>
          <p className="text-indigo-200 text-lg mb-2">
            Trade what you have for what you need — no money, no middlemen.
          </p>
          <p className="text-indigo-300 text-sm mb-1">One person&apos;s junk is another person&apos;s treasure. Everything has value to someone.</p>
          <p className="text-indigo-400 text-xs mb-8">Back to Barter. Swap More. Spend Less. Forward Together.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
              Start Swapping Free <ArrowRight size={16} />
            </Link>
            <Link href="/how-it-works" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              How It Works
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { icon: <BadgeCheck size={22} className="text-indigo-600" />, label: 'Verified Users', sub: 'Email verified accounts' },
          { icon: <ShieldCheck size={22} className="text-indigo-600" />, label: 'Escrow Protected', sub: 'Secure swap flow' },
          { icon: <Star size={22} className="text-indigo-600" />, label: 'Ratings & Reviews', sub: 'Community feedback' },
          { icon: <PackageCheck size={22} className="text-indigo-600" />, label: 'Quality Listings', sub: 'Photos required' },
        ].map((b) => (
          <div key={b.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <div className="flex justify-center mb-2">{b.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{b.sub}</p>
          </div>
        ))}
      </div>

      {/* Why DropSwap */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Why DropSwap?</h2>
        <p className="text-gray-500 text-center mb-8">Because the old way of living actually worked</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <Coins size={28} className="text-yellow-500" />,
              bg: 'bg-yellow-50',
              title: 'Beat the Cost of Living',
              desc: "Prices are rising. Wages aren't keeping up. Trade what you have, get what you need — keep every penny in your pocket.",
            },
            {
              icon: <PackageCheck size={28} className="text-blue-500" />,
              bg: 'bg-blue-50',
              title: 'Declutter & Gain',
              desc: "One person's clutter is another's treasure. Clear your home and get something you actually want in return.",
            },
            {
              icon: <ShieldCheck size={28} className="text-green-500" />,
              bg: 'bg-green-50',
              title: 'No Middlemen',
              desc: 'No corporations, no taxes on trades, no algorithms deciding your worth. Just two people making a fair deal.',
            },
            {
              icon: <Users size={28} className="text-purple-500" />,
              bg: 'bg-purple-50',
              title: 'Keep It Local',
              desc: 'Build real connections in your community. Trade with your neighbours. Keep value circulating where you live.',
            },
          ].map((w) => (
            <div key={w.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className={`${w.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                {w.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{w.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">If it has value, you can DropSwap it</h2>
        <p className="text-gray-500 text-center mb-8">From clothes to experiences — trade anything, keep the money in your community</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORIES.filter(c => c !== 'Other').map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat)
                if (isLoggedIn) {
                  document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-2">{CATEGORY_ICONS[cat]}</div>
              <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 leading-tight">{cat}</p>
            </button>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-3xl p-8 mb-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How It Works</h2>
        <p className="text-gray-500 text-center mb-10">Four simple steps to start swapping</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', emoji: '📸', title: 'List', desc: 'Post what you have with photos and details. Set your swap preferences.' },
            { step: '2', emoji: '🔍', title: 'Discover', desc: 'Browse items in your country. Filter by category to find what you want.' },
            { step: '3', emoji: '💬', title: 'Propose', desc: 'Send swap offers and negotiate. Chat safely within the app.' },
            { step: '4', emoji: '🤝', title: 'Swap', desc: 'Ship your items and confirm receipt. Leave reviews to build trust.' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {s.step}
              </div>
              <div className="text-3xl mb-2">{s.emoji}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/how-it-works" className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 justify-center">
            Learn More <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Good for your wallet. Good for the planet.</h2>
        <p className="text-gray-500 text-center mb-8">Trade like the old days — circular, local, human</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: <Recycle size={28} className="text-green-600" />,
              bg: 'bg-green-50',
              title: 'Keep items in circulation',
              desc: 'Every swap keeps items in use and out of landfill, extending their lifecycle indefinitely.',
            },
            {
              icon: <Wind size={28} className="text-blue-600" />,
              bg: 'bg-blue-50',
              title: 'Reduce carbon footprint',
              desc: 'Less packaging, fewer new purchases, and reduced manufacturing demand for a cleaner planet.',
            },
            {
              icon: <Leaf size={28} className="text-emerald-600" />,
              bg: 'bg-emerald-50',
              title: 'Save money, get value',
              desc: 'Get what you need without spending cash while giving your unused items new purpose.',
            },
          ].map((e) => (
            <div key={e.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className={`${e.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                {e.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{e.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Browse / Items Section */}
      <div id="browse">
        {!isLoggedIn ? (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 text-center text-white">
            <h2 className="text-3xl font-bold mb-3">Ready to start swapping?</h2>
            <p className="text-indigo-100 text-lg mb-6">Join thousands of people trading items they love — for free.</p>
            <Link href="/auth/signup" className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors inline-flex items-center gap-2">
              Create Free Account <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Browse Items {userCountry && <span className="text-indigo-600">in {userCountry}</span>}
              </h2>
              <Link href="/items/new" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                + Post Item
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
                <Link href="/items/new" className="mt-4 inline-block bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                  Post the First Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
