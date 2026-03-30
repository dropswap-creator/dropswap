'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Bell } from 'lucide-react'

export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; message: string; href: string; created_at: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription for new pending swaps
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'swaps',
        filter: `receiver_id=eq.${userId}`,
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('swaps')
      .select('id, created_at, requester:profiles!requester_id(username), requester_item:items!requester_item_id(title)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!data) return

    const notes = data.map((s: any) => ({
      id: s.id,
      message: `${s.requester?.username || 'Someone'} wants to swap "${s.requester_item?.title || 'an item'}"`,
      href: `/swaps/${s.id}`,
      created_at: s.created_at,
    }))

    setNotifications(notes)
    setCount(notes.length)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-sm text-gray-900">Swap Requests</p>
              {count > 0 && <span className="text-xs text-red-500 font-medium">{count} pending</span>}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">No pending requests</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="px-4 py-3 border-t border-gray-100">
              <Link href="/swaps" onClick={() => setOpen(false)} className="text-xs text-indigo-600 font-medium hover:underline">
                View all swaps →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
