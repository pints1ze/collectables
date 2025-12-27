'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ItemForm, { type ItemFormData } from '@/components/items/ItemForm'
import ItemImageCapture from '@/components/items/ItemImageCapture'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { uploadItemImage } from '@/lib/storage/upload'
import type { ImageAnalysisResult } from '@/app/api/analyze-image/route'

type Step = 'capture' | 'analyzing' | 'form'

export default function NewItemPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.collectionId as string
  const supabase = createClient()
  
  const [step, setStep] = useState<Step>('capture')
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<Partial<ItemFormData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleImageCaptured = async (file: File, preview: string) => {
    try {
      setError(null)
      setStep('analyzing')
      
      // Store file and preview in memory (no upload yet)
      setTempImageFile(file)
      setTempImagePreview(preview)
      
      // Send to AI for analysis
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze image')
      }
      
      const analysis: ImageAnalysisResult = await response.json()
      
      // Convert AI suggestions to form data format
      const suggestions: Partial<ItemFormData> = {
        title: analysis.title || '',
        description: analysis.description || null,
        brand: analysis.brand || null,
        series_name: analysis.series_name || null,
        year_released: analysis.year_released || null,
        condition: analysis.condition || null,
        tagIds: [], // Tags will be handled separately if needed
        primaryImageId: null, // Will be set after item creation
      }
      
      setAiSuggestions(suggestions)
      setStep('form')
    } catch (err) {
      console.error('Error processing image:', err)
      setError(err instanceof Error ? err.message : 'Failed to process image')
      setStep('capture')
    }
  }
  
  const handleSubmit = async (data: ItemFormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }
    
    if (!tempImageFile) {
      throw new Error('Image is required')
    }
    
    // Create item first
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
        primary_image_id: null, // Will be set after image is uploaded
      })
      .select()
      .single()
    
    if (itemError) {
      throw new Error(itemError.message)
    }
    
    // Upload image to item location and create image record
    try {
      const imageUrl = await uploadItemImage(supabase, tempImageFile, item.id)
      
      // Create item_image record
      const { data: imageData, error: imageError } = await supabase
        .from('item_images')
        .insert({
          item_id: item.id,
          image_url: imageUrl,
          is_primary: true,
        })
        .select()
        .single()
      
      if (imageError) {
        throw imageError
      }
      
      // Update item with primary_image_id
      await supabase
        .from('items')
        .update({ primary_image_id: imageData.id })
        .eq('id', item.id)
    } catch (imageErr) {
      console.error('Error uploading image:', imageErr)
      // Continue even if image upload fails - item is already created
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
  
  const handleCancel = () => {
    if (step === 'capture') {
      router.push(`/collections/${collectionId}`)
    } else {
      // Go back to capture step
      setStep('capture')
      setTempImageFile(null)
      setTempImagePreview(null)
      setAiSuggestions(null)
      setError(null)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Item</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {step === 'capture' && (
          <ItemImageCapture
            onImageCaptured={handleImageCaptured}
            onCancel={handleCancel}
          />
        )}
        
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Analyzing image with AI...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
          </div>
        )}
        
        {step === 'form' && aiSuggestions && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">AI Suggestions</h3>
                  <p className="text-sm text-blue-800">
                    We've analyzed your image and filled in some fields. Please review and adjust as needed.
                  </p>
                </div>
              </div>
            </div>
            
            {tempImagePreview && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Image
                </label>
                <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={tempImagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            
            <ItemForm
              collectionId={collectionId}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={aiSuggestions}
            />
          </div>
        )}
      </div>
    </div>
  )
}

