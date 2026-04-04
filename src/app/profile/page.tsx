'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import TrustScore from '@/components/TrustScore'
import ItemCard from '@/components/ItemCard'
import { COUNTRIES } from '@/lib/types'
import type { Profile, Item, Rating } from '@/lib/types'
import { Camera, Save } from 'lucide-react'

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [bio, setBio] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as Profile)
        setBio(p.bio || '')
        setUsername(p.username || '')
        setCountry(p.country || '')
      }

      const { data: i } = await supabase.from('items').select('*, profiles(*)').eq('user_id', user.id).order('created_at', { ascending: false })
      setItems((i as Item[]) || [])

      const { data: r } = await supabase.from('ratings').select('*').eq('rated_id', user.id).order('created_at', { ascending: false }).limit(10)
      setRatings((r as Rating[]) || [])

      setLoading(false)
    }
    load()
  }, [])

  async function deleteAccount() {
    if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return
    if (!confirm('Last chance — this will delete all your data immediately.')) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/account/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    await supabase.auth.signOut()
    router.push('/')
  }

  async function saveProfile() {
    if (!userId) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ bio, country, username: username || null, avatarUrl: profile?.avatar_url || null }),
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function uploadAvatar(file: File) {
    if (!userId) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p)
    }
    setUploadingAvatar(false)
  }

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-64" />
  if (!profile) return null

  const incomplete = !profile.avatar_url || !profile.bio
  const completeness = [!!profile.username, !!profile.avatar_url, !!profile.bio, items.length > 0].filter(Boolean).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile completeness banner */}
      {incomplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="text-2xl">⚡</div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Complete your profile ({completeness}/4 done)</p>
            <p className="text-amber-700 text-xs mt-0.5">Buyers trust completed profiles more. Add your
              {!profile.avatar_url && ' photo'}
              {!profile.avatar_url && !profile.bio && ' and'}
              {!profile.bio && ' bio'}
              {items.length === 0 && ' and post your first item'}
              {' '}to get your first swap.
            </p>
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-2xl text-indigo-500 font-bold">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
              ) : (
                (profile.username || 'U')[0].toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Camera size={14} className={uploadingAvatar ? 'text-indigo-400 animate-pulse' : 'text-gray-600'} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }}
            />
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.username || 'Set your display name'}</h1>
            {!profile.username && (
              <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg inline-block mt-1 mb-1">Fill in your name below so others can find you</p>
            )}
            <TrustScore
              score={profile.trust_score}
              totalRatings={profile.total_ratings}
              completedSwaps={profile.completed_swaps}
            />

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400"
                  placeholder="How others see your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell others a bit about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving || saved}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-1 text-sm">Danger zone</h2>
        <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button
          onClick={deleteAccount}
          className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
        >
          Delete my account
        </button>
      </div>

      {/* My items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My items ({items.length})</h2>
          <a href="/items/new" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">+ Post item</a>
        </div>
        {items.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-gray-400 text-sm mb-3">You haven&apos;t posted any items yet.</p>
            <a href="/items/new" className="inline-block bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">Post your first item</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {/* Ratings received */}
      {ratings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent ratings</h2>
          <div className="space-y-2">
            {ratings.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
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
