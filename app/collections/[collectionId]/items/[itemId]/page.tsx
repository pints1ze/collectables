import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import type { Item, ItemImage, Tag } from '@/types/entities'

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
  
  // Verify collection belongs to user
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  
  if (!collection) {
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
      <div className="mb-6">
        <Link
          href={`/collections/${collectionId}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Collection
        </Link>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {primaryImage && (
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
              <h1 className="text-3xl font-bold text-gray-900">
                {(item as Item).title}
              </h1>
              <Link href={`/collections/${collectionId}/items/${itemId}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
            
            {(item as Item).description && (
              <p className="text-gray-700">
                {(item as Item).description}
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {(item as Item).brand && (
                <div>
                  <span className="font-medium text-gray-500">Brand:</span>
                  <p className="text-gray-900">{(item as Item).brand}</p>
                </div>
              )}
              
              {(item as Item).series_name && (
                <div>
                  <span className="font-medium text-gray-500">Series:</span>
                  <p className="text-gray-900">{(item as Item).series_name}</p>
                </div>
              )}
              
              {(item as Item).year_released && (
                <div>
                  <span className="font-medium text-gray-500">Year Released:</span>
                  <p className="text-gray-900">{(item as Item).year_released}</p>
                </div>
              )}
              
              {(item as Item).year_acquired && (
                <div>
                  <span className="font-medium text-gray-500">Year Acquired:</span>
                  <p className="text-gray-900">{(item as Item).year_acquired}</p>
                </div>
              )}
              
              {(item as Item).sku && (
                <div>
                  <span className="font-medium text-gray-500">SKU:</span>
                  <p className="text-gray-900">{(item as Item).sku}</p>
                </div>
              )}
              
              {(item as Item).condition && (
                <div>
                  <span className="font-medium text-gray-500">Condition:</span>
                  <p className="text-gray-900">{(item as Item).condition}</p>
                </div>
              )}
              
              {(item as Item).location && (
                <div>
                  <span className="font-medium text-gray-500">Location:</span>
                  <p className="text-gray-900">{(item as Item).location}</p>
                </div>
              )}
            </div>
            
            {tags && tags.length > 0 && (
              <div>
                <span className="font-medium text-gray-500 text-sm mb-2 block">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {(tags as Tag[]).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {(item as Item).notes && (
              <div>
                <span className="font-medium text-gray-500 text-sm mb-2 block">Notes:</span>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {(item as Item).notes}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {images && images.length > 1 && (
          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
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

