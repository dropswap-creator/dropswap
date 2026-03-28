'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { COUNTRIES } from '@/lib/types'
import { ArrowLeftRight } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('')
  const [agreedAge, setAgreedAge] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!country) { setError('Please select your country'); return }
    if (!agreedAge) { setError('You must confirm you are 18 or older'); return }
    if (!agreedTerms) { setError('You must agree to the Terms & Conditions'); return }
    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ country })
        .eq('id', data.user.id)
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center text-indigo-600 font-bold text-xl mb-2">
          <ArrowLeftRight size={22} />
          DropSwap
        </div>
        <p className="text-center text-xs text-gray-400 mb-6">Back to Barter. Swap More. Spend Less.</p>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Create account</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your country</label>
            <select
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Legal checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedAge}
                onChange={(e) => setAgreedAge(e.target.checked)}
                className="mt-0.5 shrink-0 w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-gray-600">
                I confirm I am <strong>18 years of age or older</strong>. DropSwap is not available to anyone under 18.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 shrink-0 w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms & Conditions</Link>
                {' '}and{' '}
                <Link href="/rules" target="_blank" className="text-indigo-600 hover:underline">Community Rules</Link>
              </span>
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
