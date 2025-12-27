import ItemCard from './ItemCard'
import type { Item } from '@/types/entities'

interface ItemGridProps {
  items: Item[]
  collectionId: string
}

export default async function ItemGrid({ items, collectionId }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No items in this collection yet.</p>
        <p className="text-sm text-gray-400">Add your first item to get started!</p>
      </div>
    )
  }
  
  // Fetch primary images for items
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  
  const itemsWithImages = await Promise.all(
    items.map(async (item) => {
      if (!item.primary_image_id) {
        return { item, imageUrl: null }
      }
      
      const { data: image } = await supabase
        .from('item_images')
        .select('image_url')
        .eq('id', item.primary_image_id)
        .single()
      
      return { item, imageUrl: image?.image_url || null }
    })
  )
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {itemsWithImages.map(({ item, imageUrl }) => (
        <ItemCard
          key={item.id}
          item={item}
          collectionId={collectionId}
          imageUrl={imageUrl}
        />
      ))}
    </div>
  )
}


