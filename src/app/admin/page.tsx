'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Item, Profile } from '@/lib/types'
import { Users, Package, ArrowLeftRight, Flag, Trash2, Ban, Eye } from 'lucide-react'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

interface Report {
  id: string
  item_id: string
  reporter_id: string
  reason: string
  created_at: string
  items?: Item & { profiles?: Profile }
  reporter?: Profile
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({ users: 0, items: 0, swaps: 0, reports: 0 })
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [tab, setTab] = useState<'reports' | 'items' | 'users' | 'disputes'>('reports')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setAuthed(true)
      await loadAll()
      setLoading(false)
    }
    init()
  }, [])

  async function loadAll() {
    const [
      { count: userCount },
      { count: itemCount },
      { count: swapCount },
      { count: reportCount },
      { data: reportData },
      { data: userData },
      { data: itemData },
      { data: disputeData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('items').select('*', { count: 'exact', head: true }),
      supabase.from('swaps').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*, items(*, profiles(*)), reporter:profiles!reporter_id(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('items').select('*, profiles(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('swaps').select(`
        *,
        requester:profiles!swaps_requester_id_fkey(id, username),
        receiver:profiles!swaps_receiver_id_fkey(id, username),
        requester_item:items!swaps_requester_item_id_fkey(title),
        receiver_item:items!swaps_receiver_item_id_fkey(title)
      `).eq('status', 'disputed').order('updated_at', { ascending: false }),
    ])

    setStats({
      users: userCount || 0,
      items: itemCount || 0,
      swaps: swapCount || 0,
      reports: reportCount || 0,
    })
    setReports((reportData as Report[]) || [])
    setUsers((userData as Profile[]) || [])
    setItems((itemData as Item[]) || [])
    setDisputes((disputeData as any[]) || [])
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    await supabase.from('items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    setReports((prev) => prev.filter((r) => r.item_id !== itemId))
    setStats((s) => ({ ...s, items: s.items - 1 }))
  }

  async function dismissReport(reportId: string) {
    await supabase.from('reports').delete().eq('id', reportId)
    setReports((prev) => prev.filter((r) => r.id !== reportId))
    setStats((s) => ({ ...s, reports: s.reports - 1 }))
  }

  async function banUser(userId: string) {
    if (!confirm('Ban this user? They will no longer be able to log in.')) return
    await supabase.from('profiles').update({ banned: true }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned: true } as any : u))
  }

  async function resolveDispute(swapId: string, resolution: 'completed' | 'cancelled') {
    if (!confirm(`Mark this dispute as ${resolution}?`)) return
    await supabase.from('swaps').update({ status: resolution, updated_at: new Date().toISOString() }).eq('id', swapId)
    if (resolution === 'cancelled') {
      const swap = disputes.find((d) => d.id === swapId)
      if (swap) {
        await supabase.from('items').update({ status: 'available' }).in('id', [swap.requester_item_id, swap.receiver_item_id])
      }
    }
    setDisputes((prev) => prev.filter((d) => d.id !== swapId))
  }

  if (loading) return <div className="animate-pulse bg-white rounded-2xl h-64" />
  if (!authed) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">DropSwap Internal</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Users size={20} className="text-indigo-600" />, label: 'Users', value: stats.users, bg: 'bg-indigo-50' },
          { icon: <Package size={20} className="text-blue-600" />, label: 'Items', value: stats.items, bg: 'bg-blue-50' },
          { icon: <ArrowLeftRight size={20} className="text-green-600" />, label: 'Swaps', value: stats.swaps, bg: 'bg-green-50' },
          { icon: <Flag size={20} className="text-red-600" />, label: 'Reports', value: stats.reports, bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['reports', 'disputes', 'items', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
            {t === 'reports' && stats.reports > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{stats.reports}</span>
            )}
            {t === 'disputes' && disputes.length > 0 && (
              <span className="ml-1.5 bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full">{disputes.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <Flag size={32} className="mx-auto mb-3 text-gray-200" />
              <p>No reports — all clear!</p>
            </div>
          ) : reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  Item: {report.items?.title || report.item_id}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Reason: <span className="text-red-600">{report.reason}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Reported by {(report.reporter as any)?.username || 'unknown'} · {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/items/${report.item_id}`}
                  className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={13} /> View
                </Link>
                <button
                  onClick={() => deleteItem(report.item_id)}
                  className="flex items-center gap-1 text-xs text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={13} /> Delete Item
                </button>
                <button
                  onClick={() => dismissReport(report.id)}
                  className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disputes tab */}
      {tab === 'disputes' && (
        <div className="space-y-3">
          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <p className="text-2xl mb-3">⚖️</p>
              <p>No active disputes — all clear!</p>
            </div>
          ) : disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-2xl border border-orange-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {(dispute.requester as any)?.username} ↔ {(dispute.receiver as any)?.username}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(dispute.requester_item as any)?.title} ↔ {(dispute.receiver_item as any)?.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Disputed {new Date(dispute.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/swaps/${dispute.id}`}
                    className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={13} /> View
                  </Link>
                  <button
                    onClick={() => resolveDispute(dispute.id, 'completed')}
                    className="text-xs text-white bg-green-500 px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => resolveDispute(dispute.id, 'cancelled')}
                    className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel Swap
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items tab */}
      {tab === 'items' && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.category} · {item.country} · by {item.profiles?.username || 'unknown'} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                item.status === 'available' ? 'bg-green-100 text-green-700' :
                item.status === 'in_swap' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.status}
              </span>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/items/${item.id}`}
                  className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={13} /> View
                </Link>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex items-center gap-1 text-xs text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                {(user.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{user.username || 'No username'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user.country} · ⭐ {user.trust_score?.toFixed(1) || '0.0'} · {user.completed_swaps || 0} swaps · joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              {(user as any).banned && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">Banned</span>
              )}
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye size={13} /> View
                </Link>
                {!(user as any).banned && (
                  <button
                    onClick={() => banUser(user.id)}
                    className="flex items-center gap-1 text-xs text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Ban size={13} /> Ban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
