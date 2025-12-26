'use client'

import { useState, FormEvent, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ItemImageUpload from './ItemImageUpload'
import TagSelector from '@/components/tags/TagSelector'
import { createClient } from '@/lib/supabase/client'
import type { Item, ItemImage } from '@/types/entities'

interface ItemFormProps {
  item?: Item
  collectionId: string
  onSubmit: (data: ItemFormData) => Promise<void>
  onCancel?: () => void
}

export interface ItemFormData {
  title: string
  description: string | null
  brand: string | null
  series_name: string | null
  year_released: number | null
  year_acquired: number | null
  sku: string | null
  condition: string | null
  location: string | null
  notes: string | null
  tagIds: string[]
  primaryImageId: string | null
}

export default function ItemForm({ item, collectionId, onSubmit, onCancel }: ItemFormProps) {
  const supabase = createClient()
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || '')
  const [brand, setBrand] = useState(item?.brand || '')
  const [seriesName, setSeriesName] = useState(item?.series_name || '')
  const [yearReleased, setYearReleased] = useState(item?.year_released?.toString() || '')
  const [yearAcquired, setYearAcquired] = useState(item?.year_acquired?.toString() || '')
  const [sku, setSku] = useState(item?.sku || '')
  const [condition, setCondition] = useState(item?.condition || '')
  const [location, setLocation] = useState(item?.location || '')
  const [notes, setNotes] = useState(item?.notes || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<ItemImage[]>([])
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(item?.primary_image_id || null)
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
        brand: brand.trim() || null,
        series_name: seriesName.trim() || null,
        year_released: yearReleased ? parseInt(yearReleased) : null,
        year_acquired: yearAcquired ? parseInt(yearAcquired) : null,
        sku: sku.trim() || null,
        condition: condition.trim() || null,
        location: location.trim() || null,
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          disabled={isLoading}
        />
        
        <Input
          label="Series Name"
          value={seriesName}
          onChange={(e) => setSeriesName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Year Released"
          type="number"
          value={yearReleased}
          onChange={(e) => setYearReleased(e.target.value)}
          disabled={isLoading}
          min="1000"
          max="2100"
        />
        
        <Input
          label="Year Acquired"
          type="number"
          value={yearAcquired}
          onChange={(e) => setYearAcquired(e.target.value)}
          disabled={isLoading}
          min="1000"
          max="2100"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="SKU / Card Number"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          disabled={isLoading}
        />
        
        <Input
          label="Condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., Mint, Good, Fair"
        />
      </div>
      
      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        disabled={isLoading}
        placeholder="Where is this item stored?"
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
      
      <ItemImageUpload
        itemId={item?.id}
        onUploadComplete={handleImageUpload}
        existingImages={existingImages}
        onSetPrimary={item ? handleSetPrimary : undefined}
        onDelete={item ? handleDeleteImage : undefined}
      />
      
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

