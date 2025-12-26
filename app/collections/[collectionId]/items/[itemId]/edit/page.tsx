'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ItemForm, { type ItemFormData } from '@/components/items/ItemForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Item } from '@/types/entities'

export default function EditItemPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.collectionId as string
  const itemId = params.itemId as string
  const supabase = createClient()
  const [item, setItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchItem() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()
      
      if (error || !data) {
        router.push(`/collections/${collectionId}`)
        return
      }
      
      setItem(data as Item)
      setIsLoading(false)
    }
    
    fetchItem()
  }, [itemId, collectionId, router, supabase])
  
  const handleSubmit = async (data: ItemFormData) => {
    // Update item
    const { error: itemError } = await supabase
      .from('items')
      .update({
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
      .eq('id', itemId)
    
    if (itemError) {
      throw new Error(itemError.message)
    }
    
    // Update tags
    // First, get current tags
    const { data: currentTags } = await supabase
      .from('item_tags')
      .select('tag_id')
      .eq('item_id', itemId)
    
    const currentTagIds = currentTags?.map(t => t.tag_id) || []
    const tagsToAdd = data.tagIds.filter(id => !currentTagIds.includes(id))
    const tagsToRemove = currentTagIds.filter(id => !data.tagIds.includes(id))
    
    // Remove tags
    if (tagsToRemove.length > 0) {
      await supabase
        .from('item_tags')
        .delete()
        .eq('item_id', itemId)
        .in('tag_id', tagsToRemove)
      
      // Decrement usage counts
      for (const tagId of tagsToRemove) {
        await supabase.rpc('decrement_tag_usage', { tag_id: tagId })
      }
    }
    
    // Add new tags
    if (tagsToAdd.length > 0) {
      const itemTags = tagsToAdd.map(tagId => ({
        item_id: itemId,
        tag_id: tagId,
      }))
      
      await supabase
        .from('item_tags')
        .insert(itemTags)
      
      // Increment usage counts
      for (const tagId of tagsToAdd) {
        await supabase.rpc('increment_tag_usage', { tag_id: tagId })
      }
    }
    
    router.push(`/collections/${collectionId}/items/${itemId}`)
    router.refresh()
  }
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  
  if (!item) {
    return null
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Item</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ItemForm
          item={item}
          collectionId={collectionId}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/collections/${collectionId}/items/${itemId}`)}
        />
      </div>
    </div>
  )
}

