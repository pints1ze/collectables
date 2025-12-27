import Link from 'next/link'
import Image from 'next/image'
import type { Item } from '@/types/entities'

interface ItemCardProps {
  item: Item
  collectionId: string
  imageUrl?: string | null
}

export default function ItemCard({ item, collectionId, imageUrl }: ItemCardProps) {
  return (
    <Link
      href={`/collections/${collectionId}/items/${item.id}`}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {imageUrl ? (
        <div className="aspect-square relative bg-gray-100">
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">No image</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {item.title}
        </h3>
        {item.brand && (
          <p className="text-sm text-gray-600 mb-1">{item.brand}</p>
        )}
        {item.year_released && (
          <p className="text-xs text-gray-500">{item.year_released}</p>
        )}
      </div>
    </Link>
  )
}


