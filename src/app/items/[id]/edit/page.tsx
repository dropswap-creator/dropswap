'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/types'
import type { Item } from '@/lib/types'
import { Upload, X, Video } from 'lucide-react'

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [item, setItem] = useState<Item | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null)
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null)
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const [{ data: itemData }, { data: { user } }] = await Promise.all([
        supabase.from('items').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
      ])
      if (!itemData || !user || itemData.user_id !== user.id) {
        router.push('/')
        return
      }
      setItem(itemData as Item)
      setTitle(itemData.title)
      setDescription(itemData.description)
      setCategory(itemData.category)
      setEstimatedValue(itemData.estimated_value?.toString() || '')
      setExistingImages(itemData.images || [])
      setExistingVideoUrl((itemData as any).video_url || null)
      setLoading(false)
    }
    load()
  }, [id])

  const totalImages = existingImages.length + newImageFiles.length

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 4 - totalImages)
    setNewImageFiles((prev) => [...prev, ...newFiles])
    const urls = newFiles.map((f) => URL.createObjectURL(f))
    setNewImagePreviews((prev) => [...prev, ...urls])
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function handleVideo(files: FileList | null) {
    if (!files || !files[0]) return
    const file = files[0]
    if (file.size > 50 * 1024 * 1024) { setError('Video must be under 50MB'); return }
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview)
    setNewVideoFile(file)
    setNewVideoPreview(URL.createObjectURL(file))
    setRemoveVideo(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Session expired. Please log in again.'); setSaving(false); return }

    // Upload new images
    const uploadedUrls: string[] = []
    for (const file of newImageFiles) {
      const ext = file.name.split('.').pop()
      const path = `items/${item.user_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, file)
      if (uploadError) { setError('Image upload failed: ' + uploadError.message); setSaving(false); return }
      uploadedUrls.push(supabase.storage.from('images').getPublicUrl(path).data.publicUrl)
    }

    // Upload new video
    let videoUrl: string | null = existingVideoUrl
    if (newVideoFile) {
      const ext = newVideoFile.name.split('.').pop()
      const path = `items/${item.user_id}/video-${Date.now()}.${ext}`
      const { error: videoError } = await supabase.storage.from('images').upload(path, newVideoFile)
      if (videoError) {
        setError('Video upload failed: ' + videoError.message)
        setSaving(false)
        return
      }
      videoUrl = supabase.storage.from('images').getPublicUrl(path).data.publicUrl
    }
    if (removeVideo) videoUrl = null

    const res = await fetch('/api/items/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        itemId: item.id,
        title,
        description,
        category,
        estimatedValue,
        images: [...existingImages, ...uploadedUrls],
        videoUrl,
      }),
    })
    const body = await res.json()
    if (!res.ok) { setError(body.error || 'Failed to save'); setSaving(false); return }
    router.push(`/items/${item.id}`)
  }

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-64" />
  if (!item) return null

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit item</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos (up to 4)</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {existingImages.map((src, i) => (
              <div key={`ex-${i}`} style={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeExistingImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {newImagePreviews.map((src, i) => (
              <div key={`new-${i}`} style={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {totalImages < 4 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors">
                <Upload size={18} />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video <span className="text-gray-400 font-normal">(optional, max 50MB)</span>
          </label>
          {(newVideoPreview || (existingVideoUrl && !removeVideo)) ? (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video src={newVideoPreview || existingVideoUrl!} controls className="w-full max-h-48 object-contain" />
              <button type="button" onClick={() => { setNewVideoFile(null); setNewVideoPreview(null); setRemoveVideo(true) }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => videoRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors gap-1">
              <Video size={20} />
              <span className="text-sm">Add a video</span>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleVideo(e.target.files)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={500}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none text-gray-900" />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select required value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated value</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
            <input type="number" min="0" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900" placeholder="0.00" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push(`/items/${item.id}`)}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
