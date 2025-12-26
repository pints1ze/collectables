import Link from 'next/link'
import type { Collection } from '@/types/entities'
import { formatDate } from '@/lib/utils/format'

interface CollectionCardProps {
  collection: Collection
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {collection.name}
      </h3>
      {collection.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {collection.description}
        </p>
      )}
      <p className="text-xs text-gray-500">
        Created {formatDate(collection.created_at)}
      </p>
    </Link>
  )
}

