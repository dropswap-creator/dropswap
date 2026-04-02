'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { COUNTRIES } from '@/lib/types'
import Image from 'next/image'
import { Camera, ArrowRight } from 'lucide-react'

function WelcomeContent() {
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('profiles').select('username, avatar_url, bio, country').eq('id', user.id).single().then(({ data }) => {
        if (data?.username) setUsername(data.username)
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
        if (data?.bio) setBio(data.bio)
        if (data?.country) setCountry(data.country)
      })
    })
  }, [])

  async function uploadAvatar(file: File) {
    if (!userId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    await supabase.storage.from('images').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  async function handleFinish() {
    if (!userId) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: userId,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      country: country || null,
    })
    const next = searchParams.get('next')
    router.push(next || '/')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {username}!</h1>
          <p className="text-gray-500 text-sm mt-1">Add a photo and bio so people know who they&apos;re swapping with.</p>
        </div>

        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-3">
            <div className="w-24 h-24 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-3xl text-indigo-400 font-bold">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill className="object-cover" />
              ) : (
                (username || 'U')[0].toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
          </div>
          <p className="text-xs text-gray-400">{uploading ? 'Uploading...' : 'Tap to add a profile photo'}</p>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="e.g. Based in London, love vintage clothes and books..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Country */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your country <span className="text-red-400">*</span>
          </label>
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
          >
            <option value="">Select your country...</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Used to show you local listings — you can change this in your profile.</p>
        </div>

        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : <>Start Swapping <ArrowRight size={16} /></>}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-pulse bg-white rounded-2xl w-full max-w-sm h-96" /></div>}>
      <WelcomeContent />
    </Suspense>
  )
}
