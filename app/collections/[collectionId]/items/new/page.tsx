'use client'

import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ItemForm, { type ItemFormData } from '@/components/items/ItemForm'

export default function NewItemPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.collectionId as string
  const supabase = createClient()
  
  const handleSubmit = async (data: ItemFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }
    
    // Create item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert({
        collection_id: collectionId,
        title: data.title,
        description: data.description,
        brand: data.brand,
        series_name: data.series_name,
        year_released: data.year_released,
        year_acquired: data.year_acquired,
        sku: data.sku,
        condition: data.condition,
        location: data.location,
        notes: data.notes,
        primary_image_id: data.primaryImageId,
      })
      .select()
      .single()
    
    if (itemError) {
      throw new Error(itemError.message)
    }
    
    // Associate tags
    if (data.tagIds.length > 0) {
      const itemTags = data.tagIds.map(tagId => ({
        item_id: item.id,
        tag_id: tagId,
      }))
      
      await supabase
        .from('item_tags')
        .insert(itemTags)
      
      // Update tag usage counts
      for (const tagId of data.tagIds) {
        await supabase.rpc('increment_tag_usage', { tag_id: tagId })
      }
    }
    
    router.push(`/collections/${collectionId}/items/${item.id}`)
    router.refresh()
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Item</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ItemForm
          collectionId={collectionId}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/collections/${collectionId}`)}
        />
      </div>
    </div>
  )
}

