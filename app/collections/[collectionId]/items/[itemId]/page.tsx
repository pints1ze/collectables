import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import ItemActions from '@/components/items/ItemActions'
import type { Item, ItemImage, Tag, Collection } from '@/types/entities'

interface ItemPageProps {
  params: Promise<{ collectionId: string; itemId: string }>
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { collectionId, itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  // Verify collection belongs to user and fetch collection name
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  
  if (collectionError || !collection) {
    notFound()
  }
  
  // Fetch item
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()
  
  if (itemError || !item) {
    notFound()
  }
  
  // Fetch images
  const { data: images } = await supabase
    .from('item_images')
    .select('*')
    .eq('item_id', itemId)
    .order('is_primary', { ascending: false })
  
  // Fetch tags
  const { data: itemTags } = await supabase
    .from('item_tags')
    .select('tag_id')
    .eq('item_id', itemId)
  
  const tagIds = itemTags?.map(it => it.tag_id) || []
  const { data: tags } = tagIds.length > 0
    ? await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds)
    : { data: [] }
  
  const primaryImage = images?.find(img => img.is_primary) || images?.[0]
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: (collection as Collection).name, href: `/collections/${collectionId}` },
          { label: (item as Item).title }
        ]}
      />
      
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {primaryImage && (
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <Image
                src={primaryImage.image_url}
                alt={(item as Item).title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-card-foreground">
                {(item as Item).title}
              </h1>
              <ItemActions
                collectionId={collectionId}
                itemId={itemId}
                itemTitle={(item as Item).title}
              />
            </div>
            
            {(item as Item).description && (
              <p className="text-muted-foreground">
                {(item as Item).description}
              </p>
            )}
            
            
            {tags && tags.length > 0 && (
              <div>
                <span className="font-medium text-muted-foreground text-sm mb-2 block">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {(tags as Tag[]).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm border border-border shadow-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {(item as Item).notes && (
              <div>
                <span className="font-medium text-muted-foreground text-sm mb-2 block">Notes:</span>
                <p className="text-foreground whitespace-pre-wrap">
                  {(item as Item).notes}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {images && images.length > 1 && (
          <div className="border-t border-border p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">Additional Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={(img as ItemImage).image_url}
                    alt={(item as Item).title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


