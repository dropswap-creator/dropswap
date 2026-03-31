'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Tag, Clock } from 'lucide-react'
import TrustScore from './TrustScore'
import type { Item } from '@/lib/types'
import { timeAgo, isNew } from '@/lib/timeAgo'

interface ItemCardProps {
  item: Item
}

export default function ItemCard({ item }: ItemCardProps) {
  const profile = item.profiles

  return (
    <Link href={`/items/${item.id}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative h-48 bg-gray-100">
          {item.images && item.images.length > 0 ? (
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-4xl">
              📦
            </div>
          )}
          {item.status !== 'available' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 font-semibold px-3 py-1 rounded-full text-sm">
                {item.status === 'in_swap' ? 'In Swap' : 'Swapped'}
              </span>
            </div>
          )}
          {item.status === 'available' && isNew(item.created_at) && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              NEW
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              <Tag size={10} />
              {item.category}
            </span>
            {item.estimated_value && (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                ~£{item.estimated_value}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={10} />
              {item.country}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={10} />
              {timeAgo(item.created_at)}
            </span>
          </div>

          {profile && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <TrustScore
                score={profile.trust_score}
                totalRatings={profile.total_ratings}
                completedSwaps={profile.completed_swaps}
                size="sm"
                profileId={profile.id}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
