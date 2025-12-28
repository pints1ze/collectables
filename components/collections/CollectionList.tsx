import type { Collection } from '@/types/entities'
import CollectionCard from './CollectionCard'

interface CollectionListProps {
  collections: Collection[]
}

export default function CollectionList({ collections }: CollectionListProps) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No collections yet.</p>
        <p className="text-sm text-muted-foreground/70">Create your first collection to get started!</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  )
}


