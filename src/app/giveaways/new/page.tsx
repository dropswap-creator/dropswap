'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Upload, X, Gift } from 'lucide-react'
import Image from 'next/image'

export default function NewGiveawayPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userCountry, setUserCountry] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single()
      if (profile) setUserCountry(profile.country)
    }
    getUser()
  }, [])

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 4 - images.length)
    setImages((prev) => [...prev, ...newFiles])
    const urls = newFiles.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...urls])
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (images.length < 1) { setError('Please add at least 1 photo'); return }
    setLoading(true)
    setError('')

    const uploadedUrls: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `items/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, file)
      if (uploadError) { setError('Image upload failed'); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }

    const { error: insertError } = await supabase.from('items').insert({
      user_id: userId,
      title: `[GIVEAWAY] ${title}`,
      description,
      category: 'Other',
      images: uploadedUrls,
      country: userCountry,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/giveaways')
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
          <Gift size={20} className="text-pink-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Post a Giveaway</h1>
          <p className="text-sm text-gray-500">Give something away free — receiver pays £0.99 admin fee</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos (up to 4)</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={src} alt="" fill className="object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-pink-400 hover:text-pink-400 transition-colors">
                <Upload size={18} />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item name</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
            placeholder="e.g. Box of children's books" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={500}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm resize-none"
            placeholder="Describe the item and collection/postage details..." />
        </div>

        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-sm text-pink-800">
          <strong>Note:</strong> Giveaways are free to post. The person who claims your item will pay a £0.99 admin fee to DropSwap. You receive nothing — this is a pure giveaway.
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-pink-500 text-white py-2.5 rounded-xl font-medium hover:bg-pink-600 transition-colors disabled:opacity-50">
          {loading ? 'Posting...' : 'Post Giveaway'}
        </button>
      </form>
    </div>
  )
}
