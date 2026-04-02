'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TrustScore from '@/components/TrustScore'
import type { Swap, Message, Rating, SwapStatus } from '@/lib/types'
import {
  Send, AlertTriangle, CheckCircle, Package, Star, ArrowLeftRight
} from 'lucide-react'
import StripePayButton from '@/components/StripePayButton'

const SWAP_STEPS = [
  { statuses: ['pending'], label: 'Offer sent' },
  { statuses: ['accepted'], label: 'Accepted' },
  { statuses: ['a_shipped', 'b_shipped', 'both_shipped'], label: 'Shipping' },
  { statuses: ['a_received', 'b_received'], label: 'Received' },
  { statuses: ['completed'], label: 'Complete' },
]

function getStepIndex(status: SwapStatus): number {
  for (let i = 0; i < SWAP_STEPS.length; i++) {
    if (SWAP_STEPS[i].statuses.includes(status)) return i
  }
  return 0
}

export default function SwapDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const paymentSuccess = searchParams?.get('payment') === 'success'

  const [swap, setSwap] = useState<Swap | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [myRating, setMyRating] = useState<Rating | null>(null)
  const [loading, setLoading] = useState(true)
  const [paidFee, setPaidFee] = useState(false)

  async function loadSwap() {
    const { data } = await supabase
      .from('swaps')
      .select(`
        *,
        requester:profiles!swaps_requester_id_fkey(*),
        receiver:profiles!swaps_receiver_id_fkey(*),
        requester_item:items!swaps_requester_item_id_fkey(*),
        receiver_item:items!swaps_receiver_item_id_fkey(*)
      `)
      .eq('id', id)
      .single()
    if (data) setSwap(data as Swap)
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      await loadSwap()

      // Auto-accept if receiver returning from successful payment
      if (paymentSuccess) {
        const { data: swapData } = await supabase.from('swaps').select('status, receiver_id').eq('id', id).single()
        if (swapData?.status === 'pending' && swapData?.receiver_id === user.id) {
          await supabase.from('swaps').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id)
        }
        setPaidFee(true)
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(id, username, avatar_url)')
        .eq('swap_id', id)
        .order('created_at', { ascending: true })
      setMessages((msgs as Message[]) || [])

      const { data: existingRating } = await supabase
        .from('ratings')
        .select('*')
        .eq('swap_id', id)
        .eq('rater_id', user.id)
        .maybeSingle()
      if (existingRating) setMyRating(existingRating as Rating)

      setLoading(false)
    }
    init()

    // Realtime messages
    const channel = supabase
      .channel(`swap-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `swap_id=eq.${id}`,
      }, async (payload) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', payload.new.sender_id)
          .single()
        setMessages((prev) => [...prev, { ...payload.new, sender } as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId) return
    setSending(true)
    await supabase.from('messages').insert({ swap_id: id, sender_id: userId, content: text.trim() })
    setText('')
    setSending(false)
  }

  async function updateSwapStatus(newStatus: SwapStatus) {
    await supabase.from('swaps').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    await loadSwap()
  }

  async function handleAccept() { await updateSwapStatus('accepted') }
  async function handleDecline() {
    await updateSwapStatus('declined')
    // Free up items
    if (swap) {
      await supabase.from('items').update({ status: 'available' }).in('id', [
        swap.requester_item_id, swap.receiver_item_id
      ])
    }
  }
  async function handleDispute() { await updateSwapStatus('disputed') }

  async function handleShipped() {
    if (!swap || !userId) return
    const isRequester = userId === swap.requester_id
    let next: SwapStatus = isRequester ? 'a_shipped' : 'b_shipped'
    if ((swap.status === 'a_shipped' && !isRequester) || (swap.status === 'b_shipped' && isRequester)) {
      next = 'both_shipped'
    }
    await updateSwapStatus(next)
  }

  async function handleReceived() {
    if (!swap || !userId) return
    const isRequester = userId === swap.requester_id
    let next: SwapStatus = isRequester ? 'a_received' : 'b_received'
    if ((swap.status === 'a_received' && !isRequester) || (swap.status === 'b_received' && isRequester)) {
      next = 'completed'
      // Mark both items as swapped
      await supabase.from('items').update({ status: 'swapped' }).in('id', [
        swap.requester_item_id, swap.receiver_item_id
      ])
    }
    await updateSwapStatus(next)
  }

  async function submitRating() {
    if (!userId || !swap || rating === 0) return
    const ratedId = userId === swap.requester_id ? swap.receiver_id : swap.requester_id
    const { data } = await supabase.from('ratings').insert({
      swap_id: id,
      rater_id: userId,
      rated_id: ratedId,
      score: rating,
      comment: ratingComment || null,
    }).select().single()
    if (data) setMyRating(data as Rating)
  }

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-96" />
  if (!swap) return null

  const isRequester = userId === swap.requester_id
  const isReceiver = userId === swap.receiver_id
  const otherParty = isRequester ? swap.receiver : swap.requester
  const myItem = isRequester ? swap.requester_item : swap.receiver_item
  const theirItem = isRequester ? swap.receiver_item : swap.requester_item
  const currentStep = getStepIndex(swap.status)
  const isActive = !['completed', 'declined', 'cancelled', 'disputed'].includes(swap.status)

  const requesterPaid = swap.requester_paid === true

  // Determine which action buttons to show
  const canAccept = false // acceptance happens via payment
  const canDecline = isReceiver && swap.status === 'pending'
  const canMarkShipped = isActive && ['accepted', 'a_shipped', 'b_shipped'].includes(swap.status) && (
    (isRequester && !['a_shipped', 'both_shipped'].includes(swap.status)) ||
    (isReceiver && !['b_shipped', 'both_shipped'].includes(swap.status))
  )
  const canMarkReceived = isActive && ['both_shipped', 'a_received', 'b_received'].includes(swap.status) && (
    (isRequester && swap.status !== 'a_received') ||
    (isReceiver && swap.status !== 'b_received')
  )
  const canDispute = isActive && !['pending', 'declined'].includes(swap.status)
  const canRate = swap.status === 'completed' && !myRating

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Swap with {otherParty?.username || 'user'}</h1>
          <Link
            href={`/profile/${otherParty?.id}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            View profile
          </Link>
        </div>

        {otherParty && (
          <TrustScore
            score={otherParty.trust_score}
            totalRatings={otherParty.total_ratings}
            completedSwaps={otherParty.completed_swaps}
            size="sm"
          />
        )}

        {/* Progress bar */}
        {!['declined', 'cancelled', 'disputed'].includes(swap.status) && (
          <div className="mt-5">
            <div className="flex justify-between mb-1">
              {SWAP_STEPS.map((step, i) => (
                <span
                  key={i}
                  className={`text-xs font-medium ${i <= currentStep ? 'text-indigo-600' : 'text-gray-300'}`}
                >
                  {step.label}
                </span>
              ))}
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(currentStep / (SWAP_STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {swap.status === 'disputed' && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle size={16} />
            This swap is under dispute. Please resolve via messages.
          </div>
        )}

        {/* Items being swapped */}
        <div className="flex items-center gap-4 mt-5">
          <div className="flex-1 p-3 bg-indigo-50 rounded-xl text-center">
            <p className="text-xs text-indigo-400 mb-1">Your item</p>
            <p className="font-medium text-sm text-gray-900 truncate">{myItem?.title}</p>
          </div>
          <ArrowLeftRight size={20} className="text-gray-300 shrink-0" />
          <div className="flex-1 p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-400 mb-1">Their item</p>
            <p className="font-medium text-sm text-gray-900 truncate">{theirItem?.title}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canAccept || canDecline || canMarkShipped || canMarkReceived || canDispute) && (
        <div className="flex flex-wrap gap-2">
          {canAccept && (
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={16} />
              Accept offer
            </button>
          )}
          {canDecline && (
            <button
              onClick={handleDecline}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Decline
            </button>
          )}
          {canMarkShipped && (
            <button
              onClick={handleShipped}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Package size={16} />
              I have shipped my item
            </button>
          )}
          {canMarkReceived && (
            <button
              onClick={handleReceived}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <CheckCircle size={16} />
              I have received the item
            </button>
          )}
          {canDispute && (
            <button
              onClick={handleDispute}
              className="flex items-center gap-2 text-red-500 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <AlertTriangle size={16} />
              Raise a dispute
            </button>
          )}
        </div>
      )}

      {/* Requester fee — pay £0.99 to send offer */}
      {swap.status === 'pending' && isRequester && !requesterPaid && userId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Pay £0.99 to send your offer</h2>
          <p className="text-sm text-gray-600 mb-4">
            A small £0.99 fee is charged to each party to confirm a swap. This keeps DropSwap running and filters out time-wasters.
          </p>
          <StripePayButton
            type="swap_fee"
            swapId={id}
            userId={userId}
            label="Pay £0.99 & Send Offer"
          />
        </div>
      )}

      {swap.status === 'pending' && isRequester && requesterPaid && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700">
          ✅ You&apos;ve paid your £0.99 fee. Waiting for the receiver to accept.
        </div>
      )}

      {/* Receiver fee — pay £0.99 to accept */}
      {swap.status === 'pending' && isReceiver && !paidFee && userId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Pay £0.99 to accept this swap</h2>
          <p className="text-sm text-gray-600 mb-4">
            A small £0.99 fee is charged to each party. This keeps DropSwap running and filters out time-wasters.
          </p>
          <StripePayButton
            type="swap_fee"
            swapId={id}
            userId={userId}
            label="Pay £0.99 & Accept Swap"
          />
        </div>
      )}

      {/* Rating */}
      {canRate && (
        <div className="bg-white rounded-2xl border border-yellow-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Rate your swap with {otherParty?.username}</h2>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star
                  size={28}
                  className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-300 transition-colors'}
                />
              </button>
            ))}
          </div>
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            rows={2}
            placeholder="Leave a comment (optional)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
          />
          <button
            onClick={submitRating}
            disabled={rating === 0}
            className="bg-yellow-400 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-500 transition-colors disabled:opacity-40"
          >
            Submit rating
          </button>
        </div>
      )}

      {myRating && (
        <div className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">
          You left a {myRating.score}-star rating for this swap.
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ height: '400px' }}>
        <div className="p-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello!</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  {!isMe && (
                    <p className={`text-xs mb-1 font-medium ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {msg.sender?.username || 'User'}
                    </p>
                  )}
                  {msg.content}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} className="p-3 border-t border-gray-50 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
