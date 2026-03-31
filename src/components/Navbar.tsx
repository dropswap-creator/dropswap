'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, User, LogOut, List, Gift, Menu, X, Search } from 'lucide-react'
import Image from 'next/image'
import type { User as SupaUser } from '@supabase/supabase-js'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar() {
  const [user, setUser] = useState<SupaUser | null>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="DropSwap" width={36} height={36} className="object-contain h-9 w-auto" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/search" className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${pathname === '/search' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Search size={16} /> Search
              </Link>
              <Link href="/items/new" className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus size={16} /> Post Item
              </Link>
              <Link href="/giveaways" className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${pathname.startsWith('/giveaways') ? 'text-pink-600 bg-pink-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Gift size={16} /> Giveaways
              </Link>
              <Link href="/swaps" className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${pathname.startsWith('/swaps') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <List size={16} /> My Swaps
              </Link>
              <Link href="/profile" className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${pathname === '/profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                <User size={16} /> Profile
              </Link>
              <NotificationBell userId={user.id} />
              <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Log in</Link>
              <Link href="/auth/signup" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="sm:hidden flex items-center gap-1">
          {user && <NotificationBell userId={user.id} />}
          <button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {user ? (
            <>
              <Link href="/search" className="flex items-center gap-3 px-3 py-3 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                <Search size={18} /> Search
              </Link>
              <Link href="/items/new" className="flex items-center gap-3 px-3 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm">
                <Plus size={18} /> Post Item
              </Link>
              <Link href="/giveaways" className="flex items-center gap-3 px-3 py-3 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                <Gift size={18} /> Giveaways
              </Link>
              <Link href="/swaps" className="flex items-center gap-3 px-3 py-3 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                <List size={18} /> My Swaps
              </Link>
              <Link href="/profile" className="flex items-center gap-3 px-3 py-3 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                <User size={18} /> Profile
              </Link>
              <button onClick={signOut} className="flex items-center gap-3 px-3 py-3 text-red-500 rounded-xl text-sm hover:bg-red-50 w-full">
                <LogOut size={18} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="flex items-center px-3 py-3 text-gray-700 rounded-xl text-sm hover:bg-gray-50">Log in</Link>
              <Link href="/auth/signup" className="flex items-center px-3 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium">Sign up free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
