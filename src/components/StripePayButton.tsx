'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'

interface StripePayButtonProps {
  type: 'giveaway' | 'completion' | 'bond'
  swapId: string
  userId: string
  itemValue?: number // only needed for bond
  label: string
}

export default function StripePayButton({
  type,
  swapId,
  userId,
  itemValue = 0,
  label,
}: StripePayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, swapId, userId, itemValue }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        <CreditCard size={16} />
        {loading ? 'Redirecting...' : label}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
