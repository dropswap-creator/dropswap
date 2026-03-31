'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Plus, MapPin, Clock } from 'lucide-react'
import { CATEGORIES } from '@/lib/types'
import type { Category } from '@/lib/types'
import { timeAgo } from '@/lib/timeAgo'

interface WantedPost {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  country: string
  created_at: string
  profiles?: { id: string; username: string | null; avatar_url: string | null }
}

export default function WantedPage() {
  const [posts, setPosts] = useState<WantedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      fetchPosts()
    }
    init()
  }, [category])

  async function fetchPosts() {
    setLoading(true)
    let query = supabase
      .from('wanted_posts')
      .select('*, profiles(id, username, avatar_url)')
      .order('created_at', { ascending: false })
    if (category) query = query.eq('category', category)
    const { data } = await query
    setPosts((data as WantedPost[]) || [])
    setLoading(false)
  }

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wanted</h1>
          <p className="text-gray-500 text-sm mt-1">People looking for items to swap — got what they need?</p>
        </div>
        {isLoggedIn && (
          <Link href="/wanted/new" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus size={16} /> Post Wanted
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search wanted posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | '')}
          className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No wanted posts yet</h3>
          <p className="text-gray-500 text-sm mb-6">Be the first to post what you&apos;re looking for.</p>
          {isLoggedIn ? (
            <Link href="/wanted/new" className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm">
              Post Wanted
            </Link>
          ) : (
            <Link href="/auth/signup" className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm">
              Sign up to post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={10} />{post.country}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={10} />{timeAgo(post.created_at)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{post.description}</p>
                </div>
                <Link
                  href={`/profile/${post.profiles?.id}`}
                  className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm overflow-hidden"
                >
                  {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                </Link>
              </div>
              {isLoggedIn && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <Link
                    href={`/items/new?for=${post.user_id}`}
                    className="text-xs text-indigo-600 font-medium hover:underline"
                  >
                    I have this → Post an item for them
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
