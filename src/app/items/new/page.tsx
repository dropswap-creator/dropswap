'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/types'
import { Upload, X } from 'lucide-react'

export default function NewItemPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const coversDelivery = true
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userCountry, setUserCountry] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
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
      if (!profile) {
        router.push('/welcome?next=/items/new')
        return
      }
      setUserCountry(profile.country)
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
    URL.revokeObjectURL(previews[index])
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function handleVideo(files: FileList | null) {
    if (!files || !files[0]) return
    const file = files[0]
    if (file.size > 50 * 1024 * 1024) { setError('Video must be under 50MB'); return }
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideo(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setError('')

    const uploadedUrls: string[] = []

    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `items/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file)
      if (uploadError) {
        setError('Image upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }

    let videoUrl: string | null = null
    if (video) {
      const ext = video.name.split('.').pop()
      const path = `items/${userId}/video-${Date.now()}.${ext}`
      const { error: videoError } = await supabase.storage.from('images').upload(path, video)
      if (videoError) { setError('Video upload failed: ' + videoError.message); setLoading(false); return }
      videoUrl = supabase.storage.from('images').getPublicUrl(path).data.publicUrl
    }

    const finalCategory = category === 'Other' && customCategory.trim()
      ? customCategory.trim()
      : category

    const { data: newItem, error: insertError } = await supabase.from('items').insert({
      user_id: userId,
      title,
      description,
      category: finalCategory,
      images: uploadedUrls,
      country: userCountry,
      covers_delivery: coversDelivery,
      estimated_value: parseFloat(estimatedValue) || 0,
      ...(condition ? { condition } : {}),
      ...(videoUrl ? { video_url: videoUrl } : {}),
    }).select('id').single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Notify users with matching wanted posts (fire and forget)
    if (newItem?.id) {
      fetch('/api/notify/wanted-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: newItem.id,
          itemTitle: title.trim(),
          category: finalCategory,
          country: userCountry,
          postedByUserId: userId,
        }),
      })
    }

    router.push('/')
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post an item for swap</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (up to 4)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
              >
                <Upload size={18} />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Video upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video <span className="text-gray-400 font-normal">(optional, max 50MB)</span>
          </label>
          {videoPreview ? (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video src={videoPreview} controls className="w-full max-h-48 object-contain" />
              <button
                type="button"
                onClick={() => { setVideo(null); setVideoPreview(null) }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors gap-1"
            >
              <Upload size={20} />
              <span className="text-sm">Add a video to show your item in action</span>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleVideo(e.target.files)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            placeholder="e.g. Vintage leather jacket"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            placeholder="Describe the item, its condition, and what you'd like in return..."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
          <div className="grid grid-cols-4 gap-2">
            {(['New', 'Good', 'Fair', 'Poor'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  condition === c
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {!condition && <p className="text-xs text-gray-400 mt-1">Select the condition of your item</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {category === 'Other' && (
            <input
              required
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              maxLength={50}
              className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
              placeholder="Describe your category (e.g. Vintage cameras)"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated value <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Required for escrow protection. This is the amount the other party deposits as a guarantee — refunded automatically when the swap completes.</p>
        </div>

        <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
          <span className="text-indigo-500 mt-0.5">📦</span>
          <span className="text-sm text-indigo-800">
            <strong>Delivery is required</strong> — you must pay postage to send your item to the person you swap with. Both parties are responsible for shipping their own item.
          </span>
        </div>

        {category === 'Food & Drinks' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 font-semibold text-sm mb-2">⚠️ Food & Drink Rules</p>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>• All food and drink items <strong>must be factory sealed or vacuum packed</strong> — no homemade, opened, or loose food</li>
              <li>• Seeds (plant/garden seeds) are allowed and exempt from this rule</li>
              <li>• Alcohol is not permitted</li>
              <li>• You must include the expiry date in your description</li>
              <li>• Listings not meeting these requirements will be removed</li>
            </ul>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post item'}
        </button>
      </form>
    </div>
  )
}
