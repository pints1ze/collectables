'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Image from 'next/image'
import type { ImageSearchResult } from '@/types/api'

interface ImageSearchResultsProps {
  results: ImageSearchResult[]
  isLoading?: boolean
  onSelect: (result: ImageSearchResult) => void
  onSkip: () => void
  error?: string | null
}

export default function ImageSearchResults({
  results,
  isLoading = false,
  onSelect,
  onSkip,
  error,
}: ImageSearchResultsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Searching for matching products...</p>
        <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Matches Found</h2>
          <p className="text-gray-600 mb-4">
            We searched hallmark.com but couldn't find matching products. You can skip this step and proceed with AI analysis.
          </p>
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 max-w-2xl mx-auto">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Button onClick={onSkip}>Skip to AI Analysis</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Matching Product</h2>
        <p className="text-gray-600">
          We found {results.length} potential matches on hallmark.com. Select the one that best matches your item.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedIndex === index
                ? 'border-blue-600 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            <div className="relative w-full aspect-square bg-gray-100">
              {result.thumbnail ? (
                <Image
                  src={result.thumbnail}
                  alt={result.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              {selectedIndex === index && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                {result.title}
              </h3>
              {result.snippet && (
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {result.snippet}
                </p>
              )}
              <p className="text-xs text-gray-500 truncate">{result.displayLink}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          variant="secondary"
          onClick={onSkip}
        >
          Skip
        </Button>
        <Button
          onClick={() => {
            if (selectedIndex !== null) {
              onSelect(results[selectedIndex])
            }
          }}
          disabled={selectedIndex === null}
        >
          Use Selected Product
        </Button>
      </div>
    </div>
  )
}

