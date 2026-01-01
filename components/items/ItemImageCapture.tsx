'use client'

import { useState, useRef, ChangeEvent } from 'react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Image from 'next/image'

interface ItemImageCaptureProps {
  onImageCaptured: (file: File, preview: string) => void
  onCancel?: () => void
}

export default function ItemImageCapture({ onImageCaptured, onCancel }: ItemImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleContinue = () => {
    if (selectedFile && preview) {
      setIsProcessing(true)
      onImageCaptured(selectedFile, preview)
    }
  }

  const handleRetake = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Photo</h2>
        <p className="text-gray-600">Take a photo with your camera or upload an image</p>
      </div>

      {!preview ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <Button
                type="button"
                onClick={handleCapture}
                className="w-full sm:w-auto"
              >
                {typeof window !== 'undefined' && 
                 'mediaDevices' in navigator && 
                 'getUserMedia' in navigator.mediaDevices
                  ? 'Take Photo'
                  : 'Choose Image'}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, WebP
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetake}
              disabled={isProcessing}
            >
              Retake
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Processing...
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      )}

      {onCancel && (
        <div className="text-center">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}


