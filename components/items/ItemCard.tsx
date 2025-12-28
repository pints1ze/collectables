import Link from 'next/link'
import Image from 'next/image'
import type { Item } from '@/types/entities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ItemCardProps {
  item: Item
  collectionId: string
  imageUrl?: string | null
}

export default function ItemCard({ item, collectionId, imageUrl }: ItemCardProps) {
  return (
    <Link href={`/collections/${collectionId}/items/${item.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        {imageUrl ? (
          <div className="aspect-square relative bg-muted">
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-square bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        <CardHeader className="p-4">
          <CardTitle className="text-base line-clamp-2">
            {item.title}
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  )
}


