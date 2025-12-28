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
      // #region agent log
      const { data: { user } } = await supabase.auth.getUser();
      fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ItemImageUpload.tsx:49',message:'Upload start - auth check',data:{itemId,userId:user?.id,userEmail:user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // #region agent log
      const { data: itemData, error: itemCheckError } = await supabase.from('items').select('id, collection_id').eq('id', itemId).single();
      fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ItemImageUpload.tsx:52',message:'Item ownership check',data:{itemId,itemData,itemCheckError:itemCheckError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // #region agent log
      if (itemData) {
        const { data: collectionData, error: collectionCheckError } = await supabase.from('collections').select('id, user_id').eq('id', itemData.collection_id).single();
        fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ItemImageUpload.tsx:56',message:'Collection ownership check',data:{collectionId:itemData.collection_id,collectionData,collectionCheckError:collectionCheckError?.message,collectionUserId:collectionData?.user_id,currentUserId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      }
      // #endregion
      
      const imageUrl = await uploadItemImage(supabase, file, itemId)
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ItemImageUpload.tsx:62',message:'Storage upload succeeded',data:{imageUrl,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
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
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ItemImageUpload.tsx:72',message:'Database insert result',data:{imageData,imageError:imageError?.message,imageErrorCode:imageError?.code,imageErrorDetails:imageError?.details,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (imageError) throw imageError
      
      onUploadComplete(imageUrl, imageData.id)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ItemImageUpload.tsx:81',message:'Upload error caught',data:{errorMessage:error?.message,errorName:error?.name,errorCode:error?.code,errorDetails:error?.details,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Item Images
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={uploading || !itemId}
          className="block w-full text-sm text-muted-foreground border border-input rounded-md px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:border file:border-primary/20 file:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {!itemId && (
          <p className="mt-2 text-sm text-muted-foreground">
            Save the item first, then you can upload images by editing it.
          </p>
        )}
        {uploading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" />
            Uploading...
          </div>
        )}
      </div>
      
      {preview && !itemId && (
        <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border border-border">
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
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-border">
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
                    className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 border border-blue-700 shadow-sm cursor-pointer"
                    aria-label="Set as primary image"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(img.id)}
                    className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 border border-red-700 shadow-sm cursor-pointer"
                    aria-label="Delete image"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
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

