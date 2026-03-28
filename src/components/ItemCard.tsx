'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Tag } from 'lucide-react'
import TrustScore from './TrustScore'
import type { Item } from '@/lib/types'

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
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>

          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              <Tag size={10} />
              {item.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={10} />
              {item.country}
            </span>
          </div>

          {profile && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <TrustScore
                score={profile.trust_score}
                totalRatings={profile.total_ratings}
                completedSwaps={profile.completed_swaps}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
