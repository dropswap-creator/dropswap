'use client'

import { useState } from 'react'
import { CreditCard, ShieldCheck } from 'lucide-react'

interface StripePayButtonProps {
  type: 'giveaway' | 'swap_fee'
  swapId: string
  userId: string
  role?: 'requester' | 'receiver'
  escrowAmount?: number   // item value in £ (not pence)
  label: string
}

export default function StripePayButton({
  type,
  swapId,
  userId,
  role,
  escrowAmount = 0,
  label,
}: StripePayButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalGbp = (0.99 + escrowAmount).toFixed(2)
  const hasEscrow = escrowAmount > 0

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, swapId, userId, role, escrowAmount }),
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
    <div className="space-y-3">
      {hasEscrow && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Platform fee</span>
            <span>£0.99</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-green-500" />
              Escrow deposit <span className="text-gray-400 text-xs">(refunded on completion)</span>
            </span>
            <span>£{escrowAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-1.5">
            <span>Total today</span>
            <span>£{totalGbp}</span>
          </div>
        </div>
      )}
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
