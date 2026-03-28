'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Swap } from '@/lib/types'
import { ArrowLeftRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Offer pending', color: 'text-yellow-600 bg-yellow-50', icon: <Clock size={14} /> },
  accepted: { label: 'Accepted — arrange shipping', color: 'text-blue-600 bg-blue-50', icon: <CheckCircle size={14} /> },
  a_shipped: { label: 'Waiting for other party to ship', color: 'text-blue-600 bg-blue-50', icon: <Clock size={14} /> },
  b_shipped: { label: 'Waiting for other party to ship', color: 'text-blue-600 bg-blue-50', icon: <Clock size={14} /> },
  both_shipped: { label: 'Both shipped — awaiting receipt', color: 'text-indigo-600 bg-indigo-50', icon: <Clock size={14} /> },
  a_received: { label: 'Waiting for other party to confirm receipt', color: 'text-indigo-600 bg-indigo-50', icon: <Clock size={14} /> },
  b_received: { label: 'Waiting for other party to confirm receipt', color: 'text-indigo-600 bg-indigo-50', icon: <Clock size={14} /> },
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50', icon: <CheckCircle size={14} /> },
  disputed: { label: 'Disputed', color: 'text-red-600 bg-red-50', icon: <AlertTriangle size={14} /> },
  declined: { label: 'Declined', color: 'text-gray-500 bg-gray-50', icon: <XCircle size={14} /> },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-50', icon: <XCircle size={14} /> },
}

export default function SwapsPage() {
  const [swaps, setSwaps] = useState<Swap[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('swaps')
        .select(`
          *,
          requester:profiles!swaps_requester_id_fkey(id, username, trust_score, total_ratings, completed_swaps),
          receiver:profiles!swaps_receiver_id_fkey(id, username, trust_score, total_ratings, completed_swaps),
          requester_item:items!swaps_requester_item_id_fkey(id, title, images),
          receiver_item:items!swaps_receiver_item_id_fkey(id, title, images)
        `)
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      setSwaps((data as Swap[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const activeSwaps = swaps.filter((s) => !['completed', 'declined', 'cancelled'].includes(s.status))
  const completedSwaps = swaps.filter((s) => ['completed', 'declined', 'cancelled'].includes(s.status))
  const displayed = tab === 'active' ? activeSwaps : completedSwaps

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Swaps</h1>

      <div className="flex gap-2 mb-6">
        {(['active', 'completed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'active' ? `Active (${activeSwaps.length})` : `History (${completedSwaps.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {tab === 'active' ? 'No active swaps' : 'No completed swaps yet'}
          </p>
          <p className="text-sm mt-1">
            <Link href="/" className="text-indigo-600 hover:underline">Browse items</Link> to make your first offer
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((swap) => {
            const isRequester = swap.requester_id === userId
            const otherParty = isRequester ? swap.receiver : swap.requester
            const myItem = isRequester ? swap.requester_item : swap.receiver_item
            const theirItem = isRequester ? swap.receiver_item : swap.requester_item
            const statusMeta = STATUS_LABELS[swap.status] || STATUS_LABELS.pending

            return (
              <Link key={swap.id} href={`/swaps/${swap.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                      {statusMeta.icon}
                      {statusMeta.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {isRequester ? 'You offered' : 'Incoming offer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-900 truncate">{myItem?.title}</p>
                      <p className="text-gray-400 text-xs">your item</p>
                    </div>
                    <ArrowLeftRight size={16} className="text-gray-300 shrink-0" />
                    <div className="flex-1 text-sm text-right">
                      <p className="font-medium text-gray-900 truncate">{theirItem?.title}</p>
                      <p className="text-gray-400 text-xs">{otherParty?.username || 'them'}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
