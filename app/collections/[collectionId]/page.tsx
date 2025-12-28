import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import FilterableItemGrid from '@/components/items/FilterableItemGrid'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import type { Collection, Item, Tag } from '@/types/entities'

interface CollectionPageProps {
  params: Promise<{ collectionId: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  
  if (collectionError || !collection) {
    notFound()
  }
  
  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })
  
  if (itemsError) {
    console.error('Error fetching items:', itemsError)
  }

  const itemsList = (items as Item[]) || []

  // Fetch all tags for the user
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name')
  
  if (tagsError) {
    console.error('Error fetching tags:', tagsError)
  }

  const availableTags = (tags as Tag[]) || []

  // Fetch item tags and images
  const itemsWithData = await Promise.all(
    itemsList.map(async (item) => {
      // Fetch tags for this item
      const { data: itemTags } = await supabase
        .from('item_tags')
        .select('tag_id')
        .eq('item_id', item.id)
      
      const tagIds = itemTags?.map(it => it.tag_id) || []
      const itemTagsList = availableTags.filter(tag => tagIds.includes(tag.id))

      // Fetch primary image
      let imageUrl: string | null = null
      if (item.primary_image_id) {
        const { data: image } = await supabase
          .from('item_images')
          .select('image_url')
          .eq('id', item.primary_image_id)
          .single()
        
        imageUrl = image?.image_url || null
      }

      return {
        ...item,
        tags: itemTagsList,
        imageUrl,
      }
    })
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: (collection as Collection).name }
        ]}
      />
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {(collection as Collection).name}
          </h1>
          {(collection as Collection).description && (
            <p className="text-muted-foreground">
              {(collection as Collection).description}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <Link href={`/collections/${collectionId}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Link href={`/collections/${collectionId}/items/new`}>
            <Button>Add Item</Button>
          </Link>
        </div>
      </div>
      
      <FilterableItemGrid 
        items={itemsWithData} 
        collectionId={collectionId}
        availableTags={availableTags}
      />
    </div>
  )
}


