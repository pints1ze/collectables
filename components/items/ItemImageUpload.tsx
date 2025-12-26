'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadItemImage } from '@/lib/storage/upload'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Image from 'next/image'

interface ItemImageUploadProps {
  itemId?: string
  onUploadComplete: (imageUrl: string, imageId: string) => void
  existingImages?: Array<{ id: string; image_url: string; is_primary: boolean }>
  onSetPrimary?: (imageId: string) => void
  onDelete?: (imageId: string) => void
}

export default function ItemImageUpload({
  itemId,
  onUploadComplete,
  existingImages = [],
  onSetPrimary,
  onDelete,
}: ItemImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    if (!itemId) {
      // If no itemId, just return - user needs to save item first
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }
    
    setUploading(true)
    try {
      const imageUrl = await uploadItemImage(supabase, file, itemId)
      
      // Create item_image record
      const { data: imageData, error: imageError } = await supabase
        .from('item_images')
        .insert({
          item_id: itemId,
          image_url: imageUrl,
          is_primary: existingImages.length === 0, // First image is primary
        })
        .select()
        .single()
      
      if (imageError) throw imageError
      
      onUploadComplete(imageUrl, imageData.id)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Item Images
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={uploading || !itemId}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {!itemId && (
          <p className="mt-2 text-sm text-gray-500">
            Save the item first, then you can upload images by editing it.
          </p>
        )}
        {uploading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <LoadingSpinner size="sm" />
            Uploading...
          </div>
        )}
      </div>
      
      {preview && !itemId && (
        <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}
      
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {existingImages.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={img.image_url}
                alt="Item"
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {!img.is_primary && onSetPrimary && (
                  <button
                    onClick={() => onSetPrimary(img.id)}
                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Set Primary
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(img.id)}
                    className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
              {img.is_primary && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

