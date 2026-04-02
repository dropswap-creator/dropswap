'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/types'
import type { Item } from '@/lib/types'

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [item, setItem] = useState<Item | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [coversDelivery, setCoversDelivery] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      setCoversDelivery(itemData.covers_delivery || false)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase.from('items').update({
      title,
      description,
      category,
      covers_delivery: coversDelivery,
      ...(estimatedValue ? { estimated_value: parseFloat(estimatedValue) } : { estimated_value: null }),
    }).eq('id', item.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    router.push(`/items/${item.id}`)
  }

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-64" />
  if (!item) return null

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit item</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
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
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none text-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white text-gray-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated value <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900"
              placeholder="0.00"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={coversDelivery}
            onChange={(e) => setCoversDelivery(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0"
          />
          <span className="text-sm text-gray-700">
            <strong>I'll cover delivery</strong> — I will pay postage to send my item to the person I swap with
          </span>
        </label>

        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/items/${item.id}`)}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
