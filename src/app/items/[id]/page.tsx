'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import TrustScore from '@/components/TrustScore'
import ItemCard from '@/components/ItemCard'
import type { Item, Profile } from '@/lib/types'
import { MapPin, Tag, ArrowLeftRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ItemPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [item, setItem] = useState<Item | null>(null)
  const [owner, setOwner] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [myItems, setMyItems] = useState<Item[]>([])
  const [selectedMyItem, setSelectedMyItem] = useState('')
  const [offering, setOffering] = useState(false)
  const [offerSent, setOfferSent] = useState(false)
  const [alreadyOffered, setAlreadyOffered] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: itemData }, { data: { user } }] = await Promise.all([
        supabase.from('items').select('*, profiles(*)').eq('id', id).single(),
        supabase.auth.getUser(),
      ])

      if (!itemData) { router.push('/'); return }
      setItem(itemData as Item)
      setOwner(itemData.profiles as Profile)
      setCurrentUser(user?.id ?? null)

      if (user && user.id !== itemData.user_id) {
        const { data: myItemsData } = await supabase
          .from('items')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'available')
          .eq('country', itemData.country)

        setMyItems((myItemsData as Item[]) || [])

        const { data: existingSwap } = await supabase
          .from('swaps')
          .select('id')
          .eq('requester_id', user.id)
          .eq('receiver_item_id', id)
          .in('status', ['pending', 'accepted'])
          .maybeSingle()

        if (existingSwap) setAlreadyOffered(true)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function sendOffer() {
    if (!selectedMyItem || !currentUser || !item) return
    setOffering(true)
    const { error } = await supabase.from('swaps').insert({
      requester_id: currentUser,
      receiver_id: item.user_id,
      requester_item_id: selectedMyItem,
      receiver_item_id: item.id,
    })
    if (!error) {
      await supabase.from('items').update({ status: 'in_swap' }).eq('id', selectedMyItem)
      setOfferSent(true)
    }
    setOffering(false)
  }

  async function deleteItem() {
    if (!item || !confirm('Delete this item?')) return
    await supabase.from('items').delete().eq('id', item.id)
    router.push('/')
  }

  if (loading) {
    return <div className="animate-pulse bg-white rounded-2xl h-96" />
  }
  if (!item || !owner) return null

  const isOwner = currentUser === item.user_id
  const images = item.images || []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {images.length > 0 ? (
              <>
                <Image src={images[imgIndex]} alt={item.title} fill className="object-cover" />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300 text-6xl">📦</div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                <Tag size={12} />
                {item.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={12} />
                {item.country}
              </span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">{item.description}</p>

          {/* Owner */}
          <Link
            href={`/profile/${owner.id}`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm overflow-hidden">
              {owner.avatar_url ? (
                <Image src={owner.avatar_url} alt="" width={40} height={40} className="object-cover" />
              ) : (
                (owner.username || 'U')[0].toUpperCase()
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">{owner.username || 'Anonymous'}</p>
              <TrustScore
                score={owner.trust_score}
                totalRatings={owner.total_ratings}
                completedSwaps={owner.completed_swaps}
                size="sm"
              />
            </div>
          </Link>

          {/* Actions */}
          {isOwner ? (
            <button
              onClick={deleteItem}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm"
            >
              <Trash2 size={16} />
              Delete item
            </button>
          ) : currentUser && item.status === 'available' ? (
            <div className="space-y-3">
              {alreadyOffered ? (
                <p className="text-green-600 font-medium text-sm bg-green-50 px-4 py-3 rounded-xl">
                  You already have an active offer on this item.{' '}
                  <Link href="/swaps" className="underline">View in My Swaps</Link>
                </p>
              ) : offerSent ? (
                <p className="text-green-600 font-medium text-sm bg-green-50 px-4 py-3 rounded-xl">
                  Offer sent! The owner will be in touch.{' '}
                  <Link href="/swaps" className="underline">View in My Swaps</Link>
                </p>
              ) : myItems.length === 0 ? (
                <p className="text-gray-500 text-sm bg-gray-50 px-4 py-3 rounded-xl">
                  You need an available item in {item.country} to make an offer.{' '}
                  <Link href="/items/new" className="text-indigo-600 underline">Post one</Link>
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer one of your items in exchange:
                    </label>
                    <select
                      value={selectedMyItem}
                      onChange={(e) => setSelectedMyItem(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="">Select your item...</option>
                      {myItems.map((i) => (
                        <option key={i.id} value={i.id}>{i.title}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={sendOffer}
                    disabled={!selectedMyItem || offering}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <ArrowLeftRight size={18} />
                    {offering ? 'Sending offer...' : 'Send swap offer'}
                  </button>
                </>
              )}
            </div>
          ) : !currentUser ? (
            <Link
              href="/auth/signup"
              className="block text-center bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Sign up to make an offer
            </Link>
          ) : (
            <div className="text-sm text-gray-400 bg-gray-50 px-4 py-3 rounded-xl">
              This item is currently {item.status === 'in_swap' ? 'in a swap' : 'already swapped'}.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
