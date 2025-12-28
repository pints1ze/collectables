import Link from 'next/link'
import type { Collection } from '@/types/entities'
import { formatDate } from '@/lib/utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CollectionCardProps {
  collection: Collection
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-lg">{collection.name}</CardTitle>
          {collection.description && (
            <CardDescription className="line-clamp-2">
              {collection.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Created {formatDate(collection.created_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}


