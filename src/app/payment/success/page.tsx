'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const swapId = params.get('swapId')
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (swapId) router.push(`/swaps/${swapId}`)
      else router.push('/')
    }, 4000)
    return () => clearTimeout(timer)
  }, [swapId])

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment confirmed</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your £0.99 swap fee has been received. You&apos;re all set!
        </p>
        {swapId && (
          <Link
            href={`/swaps/${swapId}`}
            className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            View your swap
          </Link>
        )}
        <p className="text-xs text-gray-400 mt-4">Redirecting automatically...</p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
