'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ItemForm, { type ItemFormData } from '@/components/items/ItemForm'
import ItemImageCapture from '@/components/items/ItemImageCapture'
import ImageSearchResults from '@/components/items/ImageSearchResults'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { uploadItemImage } from '@/lib/storage/upload'
import type { ImageAnalysisResult } from '@/app/api/analyze-image/route'
import type { ImageSearchResult, ScrapedProductData } from '@/types/api'

type Step = 'capture' | 'searching' | 'selecting' | 'scraping' | 'analyzing' | 'form' | 'success'

export default function NewItemPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.collectionId as string
  const supabase = createClient()
  
  const [step, setStep] = useState<Step>('capture')
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([])
  const [scrapedData, setScrapedData] = useState<ScrapedProductData | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<Partial<ItemFormData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createdItemId, setCreatedItemId] = useState<string | null>(null)
  
  const handleImageCaptured = async (file: File, preview: string) => {
    try {
      setError(null)
      setStep('searching')
      
      // Store file and preview in memory (no upload yet)
      setTempImageFile(file)
      setTempImagePreview(preview)
      
      // First, search for matching products on hallmark.com
      console.log('Starting Google Custom Search...')
      const searchFormData = new FormData()
      searchFormData.append('image', file)
      
      let results: ImageSearchResult[] = []
      let searchError: string | null = null
      
      try {
        const searchResponse = await fetch('/api/search-images', {
          method: 'POST',
          body: searchFormData,
        })
        
        const searchData = await searchResponse.json()
        results = searchData.results || []
        searchError = searchData.error || null
        
        console.log(`Search completed: ${results.length} results found`, searchError ? `(Error: ${searchError})` : '')
        
        if (searchError) {
          console.warn('Search API returned error:', searchError)
        }
      } catch (err) {
        console.error('Error calling search API:', err)
        searchError = err instanceof Error ? err.message : 'Failed to search images'
      }
      
      // Always show search results, even if empty or errored
      setSearchResults(results)
      
      // Always show the selection step, even if no results
      console.log('Moving to selection step with', results.length, 'results')
      setStep('selecting')
      
      // Set error message if search failed, but don't block the UI
      if (searchError && results.length === 0) {
        setError(`Search completed but no results found. ${searchError}`)
      } else {
        // Clear any previous errors if we have results
        setError(null)
      }
    } catch (err) {
      console.error('Error in handleImageCaptured:', err)
      setError(err instanceof Error ? err.message : 'Failed to process image')
      // Still show the selection step with empty results
      setSearchResults([])
      setStep('selecting')
    }
  }

  const handleSearchResultSelect = async (result: ImageSearchResult) => {
    try {
      setError(null)
      setStep('scraping')
      
      console.log('Scraping product page:', result.url)
      
      // Scrape the selected product page
      const scrapeResponse = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: result.url }),
      })
      
      let scraped: ScrapedProductData | null = null
      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json()
        if (scrapeData.success) {
          scraped = scrapeData.data
          setScrapedData(scraped)
          console.log('Scraped data:', scraped)
        } else {
          console.warn('Scraping failed:', scrapeData.error)
        }
      } else {
        const errorData = await scrapeResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('Scraping request failed:', errorData.error)
      }
      
      // Proceed to AI analysis (will merge with scraped data)
      // Pass scraped data directly to avoid React state timing issues
      await proceedToAIAnalysis(tempImageFile!, scraped)
    } catch (err) {
      console.error('Error scraping product:', err)
      // Continue to AI analysis even if scraping fails
      await proceedToAIAnalysis(tempImageFile!, null)
    }
  }

  const handleSearchSkip = async () => {
    // Skip search/scraping, go directly to AI analysis
    await proceedToAIAnalysis(tempImageFile!, null)
  }

  const proceedToAIAnalysis = async (file: File, scrapedDataToMerge: ScrapedProductData | null = null) => {
    try {
      setStep('analyzing')
      
      // Use passed scraped data or fall back to state (for backwards compatibility)
      const dataToMerge = scrapedDataToMerge !== null ? scrapedDataToMerge : scrapedData
      
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
      console.log('AI analysis result:', analysis)
      console.log('Merging with scraped data:', dataToMerge)
      
      // Merge scraped data with AI analysis (scraped data takes priority)
      const mergedSuggestions = mergeScrapedAndAIData(dataToMerge, analysis)
      
      console.log('Merged suggestions:', mergedSuggestions)
      
      setAiSuggestions(mergedSuggestions)
      setStep('form')
    } catch (err) {
      console.error('Error processing image:', err)
      setError(err instanceof Error ? err.message : 'Failed to process image')
      setStep('capture')
    }
  }

  const mergeScrapedAndAIData = (
    scraped: ScrapedProductData | null,
    ai: ImageAnalysisResult
  ): Partial<ItemFormData> => {
    // Scraped data takes priority, AI fills in missing fields
    // Use nullish coalescing to properly handle null vs empty string
    return {
      title: scraped?.title ?? ai.title ?? '',
      description: scraped?.description ?? ai.description ?? null,
      brand: scraped?.brand ?? ai.brand ?? null,
      series_name: scraped?.series_name ?? ai.series_name ?? null,
      year_released: scraped?.year_released ?? ai.year_released ?? null,
      sku: scraped?.sku ?? null, // SKU from scraped data (AI doesn't provide this)
      condition: ai.condition ?? null, // Condition not scraped
      tagIds: [], // Tags will be handled separately if needed
      primaryImageId: null, // Will be set after item creation
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
    
    // Store the created item ID and show success state
    setCreatedItemId(item.id)
    setStep('success')
  }
  
  const handleAddAnother = () => {
    // Reset all state to start fresh
    setStep('capture')
    setTempImageFile(null)
    setTempImagePreview(null)
    setSearchResults([])
    setScrapedData(null)
    setAiSuggestions(null)
    setError(null)
    setCreatedItemId(null)
  }
  
  const handleViewItem = () => {
    if (createdItemId) {
      router.push(`/collections/${collectionId}/items/${createdItemId}`)
      router.refresh()
    }
  }
  
  const handleBackToCollection = () => {
    router.push(`/collections/${collectionId}`)
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
      setSearchResults([])
      setScrapedData(null)
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
        
        {step === 'searching' && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Searching for matching products...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
          </div>
        )}
        
        {step === 'selecting' && (
          <ImageSearchResults
            results={searchResults}
            onSelect={handleSearchResultSelect}
            onSkip={handleSearchSkip}
            error={error}
          />
        )}
        
        {step === 'scraping' && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Extracting product information...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
          </div>
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
            <div className={`border rounded-lg p-4 mb-6 ${
              scrapedData 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
                <div className="flex items-start gap-3">
                  <svg className={`w-5 h-5 mt-0.5 ${
                    scrapedData ? 'text-green-600' : 'text-blue-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      scrapedData ? 'text-green-900' : 'text-blue-900'
                    }`}>
                      {scrapedData ? 'Product Information Found' : 'AI Suggestions'}
                    </h3>
                    <p className={`text-sm ${
                      scrapedData ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {scrapedData
                        ? 'We found product information from hallmark.com and combined it with AI analysis. Please review and adjust as needed.'
                        : 'We\'ve analyzed your image and filled in some fields. Please review and adjust as needed.'}
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
        
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md w-full text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Item Created Successfully!</h2>
              <p className="text-green-800 mb-6">Your item has been added to the collection.</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddAnother}
                  className="flex-1"
                >
                  Add Another Item
                </Button>
                <Button
                  onClick={handleViewItem}
                  variant="secondary"
                  className="flex-1"
                >
                  View Item
                </Button>
                <Button
                  onClick={handleBackToCollection}
                  variant="ghost"
                  className="flex-1"
                >
                  Back to Collection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

