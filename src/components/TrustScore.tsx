'use client'

import { Star } from 'lucide-react'
import Link from 'next/link'

interface TrustScoreProps {
  score: number
  totalRatings: number
  completedSwaps: number
  size?: 'sm' | 'md' | 'lg'
  profileId?: string
}

export default function TrustScore({
  score,
  totalRatings,
  completedSwaps,
  size = 'md',
  profileId,
}: TrustScoreProps) {
  const starSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  const inner = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={
              star <= Math.round(score)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
      <span className={`${textSize} text-gray-600`}>
        {totalRatings > 0 ? score.toFixed(1) : 'No ratings'}
        {totalRatings > 0 && (
          <span className="text-gray-400"> ({totalRatings})</span>
        )}
      </span>
      {completedSwaps > 0 && (
        <span className={`${textSize} text-green-600 font-medium`}>
          · {completedSwaps} swap{completedSwaps !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )

  if (profileId) {
    return (
      <Link href={`/profile/${profileId}`} className="hover:opacity-75 transition-opacity">
        {inner}
      </Link>
    )
  }

  return inner
}
