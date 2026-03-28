'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import TrustScore from '@/components/TrustScore'
import ItemCard from '@/components/ItemCard'
import type { Profile, Item, Rating } from '@/lib/types'
import { MapPin } from 'lucide-react'

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: i }, { data: r }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('items').select('*, profiles(*)').eq('user_id', id).eq('status', 'available').order('created_at', { ascending: false }),
        supabase.from('ratings').select('*').eq('rated_id', id).order('created_at', { ascending: false }).limit(10),
      ])
      if (p) setProfile(p as Profile)
      setItems((i as Item[]) || [])
      setRatings((r as Rating[]) || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-64" />
  if (!profile) return <p className="text-gray-500 text-center py-16">User not found.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-2xl text-indigo-500 font-bold shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={80} height={80} className="object-cover" />
            ) : (
              (profile.username || 'U')[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.username || 'Anonymous'}</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5 mb-2">
              <MapPin size={12} />
              {profile.country}
            </div>
            <TrustScore
              score={profile.trust_score}
              totalRatings={profile.total_ratings}
              completedSwaps={profile.completed_swaps}
            />
            {profile.bio && (
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Available items ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">No items available for swap.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {ratings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ratings ({ratings.length})</h2>
          <div className="space-y-2">
            {ratings.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={s <= r.score ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                  ))}
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
