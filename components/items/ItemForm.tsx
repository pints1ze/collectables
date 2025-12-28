'use client'

import { useState, FormEvent, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ItemImageUpload from './ItemImageUpload'
import TagSelector from '@/components/tags/TagSelector'
import { createClient } from '@/lib/supabase/client'
import type { Item, ItemImage } from '@/types/entities'

interface ItemFormProps {
  item?: Item
  collectionId: string
  onSubmit: (data: ItemFormData) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<ItemFormData>
}

export interface ItemFormData {
  title: string
  description: string | null
  notes: string | null
  tagIds: string[]
  primaryImageId: string | null
}

export default function ItemForm({ item, collectionId, onSubmit, onCancel, initialData }: ItemFormProps) {
  const supabase = createClient()
  const [title, setTitle] = useState(item?.title || initialData?.title || '')
  const [description, setDescription] = useState(item?.description || initialData?.description || '')
  const [notes, setNotes] = useState(item?.notes || initialData?.notes || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || [])
  const [existingImages, setExistingImages] = useState<ItemImage[]>([])
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(item?.primary_image_id || initialData?.primaryImageId || null)
  const [userId, setUserId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUserId(user.id)
      
      if (item) {
        // Load existing tags
        const { data: itemTags } = await supabase
          .from('item_tags')
          .select('tag_id')
          .eq('item_id', item.id)
        
        if (itemTags) {
          setSelectedTagIds(itemTags.map(it => it.tag_id))
        }
        
        // Load existing images
        const { data: images } = await supabase
          .from('item_images')
          .select('*')
          .eq('item_id', item.id)
          .order('is_primary', { ascending: false })
        
        if (images) {
          setExistingImages(images as ItemImage[])
        }
      }
    }
    
    loadData()
  }, [item, supabase])
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    
    setIsLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        tagIds: selectedTagIds,
        primaryImageId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }
  
  const handleImageUpload = async (imageUrl: string, imageId: string) => {
    if (!item) return
    
    setExistingImages([...existingImages, {
      id: imageId,
      item_id: item.id,
      image_url: imageUrl,
      is_primary: existingImages.length === 0,
      caption: null,
      captured_at: null,
      created_at: new Date().toISOString(),
    }])
    
    if (existingImages.length === 0) {
      setPrimaryImageId(imageId)
    }
  }
  
  const handleSetPrimary = async (imageId: string) => {
    if (!item) return
    
    // Update all images to not primary
    await supabase
      .from('item_images')
      .update({ is_primary: false })
      .eq('item_id', item.id)
    
    // Set selected as primary
    await supabase
      .from('item_images')
      .update({ is_primary: true })
      .eq('id', imageId)
    
    setPrimaryImageId(imageId)
    setExistingImages(existingImages.map(img => ({
      ...img,
      is_primary: img.id === imageId,
    })))
  }
  
  const handleDeleteImage = async (imageId: string) => {
    if (!item) return
    
    await supabase
      .from('item_images')
      .delete()
      .eq('id', imageId)
    
    setExistingImages(existingImages.filter(img => img.id !== imageId))
    
    if (primaryImageId === imageId) {
      const nextPrimary = existingImages.find(img => img.id !== imageId)
      setPrimaryImageId(nextPrimary?.id || null)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Input
        label="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isLoading}
      />
      
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        rows={4}
      />
      
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        rows={3}
      />
      
      {userId && (
        <TagSelector
          selectedTagIds={selectedTagIds}
          onSelectionChange={setSelectedTagIds}
          userId={userId}
        />
      )}
      
      {/* Only show image upload for existing items */}
      {item && (
        <ItemImageUpload
          itemId={item.id}
          onUploadComplete={handleImageUpload}
          existingImages={existingImages}
          onSetPrimary={handleSetPrimary}
          onDelete={handleDeleteImage}
        />
      )}
      
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              {item ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            item ? 'Update Item' : 'Create Item'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

