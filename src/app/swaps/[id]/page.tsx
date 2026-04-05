'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TrustScore from '@/components/TrustScore'
import type { Swap, Message, Rating, SwapStatus } from '@/lib/types'
import {
  Send, AlertTriangle, CheckCircle, Package, Star, ArrowLeftRight, Video, X
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
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
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
    if ((!text.trim() && !videoFile) || !userId) return
    setSending(true)

    let videoUrl: string | null = null
    if (videoFile) {
      const ext = videoFile.name.split('.').pop()
      const path = `messages/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('images').upload(path, videoFile)
      if (!uploadError) {
        videoUrl = supabase.storage.from('images').getPublicUrl(path).data.publicUrl
      }
    }

    const { error } = await supabase.from('messages').insert({
      swap_id: id,
      sender_id: userId,
      content: text.trim() || '',
      ...(videoUrl ? { video_url: videoUrl } : {}),
    })
    if (!error) {
      setText('')
      setVideoFile(null)
      setVideoPreview(null)
    }
    setSending(false)
  }

  async function handleVideoSelect(files: FileList | null) {
    if (!files || !files[0]) return
    const file = files[0]
    if (file.size > 50 * 1024 * 1024) return
    setVideoFile(file)
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    setVideoPreview(dataUrl)
  }

  async function updateSwapStatus(newStatus: SwapStatus) {
    await supabase.from('swaps').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    fetch('/api/notify/swap-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapId: id, newStatus }),
    })
    await loadSwap()
  }

  async function handleAccept() { await updateSwapStatus('accepted') }
  async function handleDecline() {
    await updateSwapStatus('declined')
    if (swap) {
      await supabase.from('items').update({ status: 'available' }).in('id', [
        swap.requester_item_id, swap.receiver_item_id
      ])
    }
  }
  async function handleCancel() {
    if (!swap || !confirm('Cancel this swap offer?')) return
    await updateSwapStatus('cancelled')
    await supabase.from('items').update({ status: 'available' }).eq('id', swap.requester_item_id)
  }
  async function handleDispute() { await updateSwapStatus('disputed') }

  async function handleShipped() {
    if (!swap || !userId) return
    const myItem = userId === swap.requester_id ? swap.requester_item : swap.receiver_item
    const escrowAmount = userId === swap.requester_id
      ? (swap as any).requester_escrow_amount
      : (swap as any).receiver_escrow_amount
    const escrowGbp = escrowAmount > 0 ? `£${(escrowAmount / 100).toFixed(2)}` : null

    const notice = escrowGbp
      ? `By marking your item as shipped you confirm "${myItem?.title}" is on its way.\n\nYour £${(escrowAmount / 100).toFixed(2)} escrow deposit is at risk if the item is not delivered. Only proceed if you have posted it.`
      : `By marking your item as shipped you confirm "${myItem?.title}" is on its way.\n\nOnly proceed if you have posted it.`

    if (!confirm(notice)) return

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
    const willComplete = (swap.status === 'a_received' && !isRequester) || (swap.status === 'b_received' && isRequester)
    if (willComplete) {
      next = 'completed'
      await supabase.from('items').update({ status: 'swapped' }).in('id', [
        swap.requester_item_id, swap.receiver_item_id
      ])
    }
    await updateSwapStatus(next)
    // Trigger escrow refunds once both have confirmed receipt
    if (willComplete) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        fetch('/api/stripe/escrow-refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ swapId: id }),
        })
      }
    }
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

  const requesterEscrowAmount: number | null = swap.receiver_item?.estimated_value ?? null
  const receiverEscrowAmount: number | null = swap.requester_item?.estimated_value ?? null
  const requesterMissingValue = !requesterEscrowAmount
  const receiverMissingValue = !receiverEscrowAmount
  const myEscrowPence = isRequester ? (swap as any).requester_escrow_amount : (swap as any).receiver_escrow_amount
  const theirEscrowPence = isRequester ? (swap as any).receiver_escrow_amount : (swap as any).requester_escrow_amount
  const hasEscrowBanner = isActive && swap.status !== 'pending' && (myEscrowPence > 0 || theirEscrowPence > 0)

  const requesterPaid = swap.requester_paid === true

  // Determine which action buttons to show
  const canAccept = false // acceptance happens via payment
  const canCancel = isRequester && swap.status === 'pending'
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
      {(canAccept || canCancel || canDecline || canMarkShipped || canMarkReceived || canDispute) && (
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
          {canCancel && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel offer
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

      {/* Requester fee — pay platform fee + escrow to send offer */}
      {swap.status === 'pending' && isRequester && !requesterPaid && userId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Confirm your offer</h2>
          <p className="text-sm text-gray-600 mb-4">
            A £0.99 platform fee is charged to send your offer.
            {!requesterMissingValue && ` You'll also place a £${requesterEscrowAmount!.toFixed(2)} escrow deposit (the estimated value of their item) which is automatically refunded when both parties confirm receipt.`}
          </p>
          {requesterMissingValue ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 space-y-2">
              <p>⚠️ Escrow protection unavailable — the other item has no estimated value. The swap can still proceed with just the £0.99 fee, but neither party is protected.</p>
              <StripePayButton type="swap_fee" swapId={id} userId={userId} role="requester" escrowAmount={0} label="Pay £0.99 & Send Offer" />
            </div>
          ) : (
            <StripePayButton type="swap_fee" swapId={id} userId={userId} role="requester" escrowAmount={requesterEscrowAmount!} label="Pay & Send Offer" />
          )}
        </div>
      )}

      {swap.status === 'pending' && isRequester && requesterPaid && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700">
          ✅ Offer sent with escrow locked. Waiting for the receiver to accept.
        </div>
      )}

      {/* Receiver fee — pay platform fee + escrow to accept */}
      {swap.status === 'pending' && isReceiver && !paidFee && userId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Accept this swap</h2>
          <p className="text-sm text-gray-600 mb-4">
            A £0.99 platform fee is charged to accept.
            {!receiverMissingValue && ` You'll also place a £${receiverEscrowAmount!.toFixed(2)} escrow deposit (the estimated value of their item) which is automatically refunded when both parties confirm receipt.`}
          </p>
          {receiverMissingValue ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 space-y-2">
              <p>⚠️ Escrow protection unavailable — the other item has no estimated value. You can still accept with just the £0.99 fee, but neither party is protected.</p>
              <StripePayButton type="swap_fee" swapId={id} userId={userId} role="receiver" escrowAmount={0} label="Pay £0.99 & Accept Swap" />
            </div>
          ) : (
            <StripePayButton type="swap_fee" swapId={id} userId={userId} role="receiver" escrowAmount={receiverEscrowAmount!} label="Pay & Accept Swap" />
          )}
        </div>
      )}

      {/* Escrow status banner */}
      {hasEscrowBanner && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 space-y-1">
          <p className="font-semibold">🔒 Escrow active</p>
          {myEscrowPence > 0 && <p>Your deposit: <strong>£{(myEscrowPence / 100).toFixed(2)}</strong> — refunded automatically once both parties confirm receipt.</p>}
          {theirEscrowPence > 0 && <p>Their deposit: <strong>£{(theirEscrowPence / 100).toFixed(2)}</strong> — held in escrow.</p>}
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
                  className={`max-w-xs rounded-2xl text-sm overflow-hidden ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  {msg.video_url && (
                    <video
                      src={msg.video_url}
                      controls
                      className="w-full max-w-xs rounded-t-2xl"
                      style={{ maxHeight: 200 }}
                    />
                  )}
                  {(msg.content || !msg.video_url) && (
                    <div className="px-3 py-2">
                      {!isMe && (
                        <p className={`text-xs mb-1 font-medium ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {msg.sender?.username || 'User'}
                        </p>
                      )}
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-gray-50">
          {videoPreview && (
            <div className="relative p-2">
              <video src={videoPreview} className="w-full max-h-32 rounded-xl object-contain bg-black" />
              <button
                type="button"
                onClick={() => { setVideoFile(null); setVideoPreview(null) }}
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <form onSubmit={sendMessage} className="p-3 flex gap-2">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="text-gray-400 hover:text-indigo-500 transition-colors p-2 rounded-xl hover:bg-gray-50 shrink-0"
              title="Send a video"
            >
              <Video size={18} />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={(!text.trim() && !videoFile) || sending}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoSelect(e.target.files)} />
        </div>
      </div>
    </div>
  )
}
