'use client'

import { useState, FormEvent } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Collection } from '@/types/entities'

interface CollectionFormProps {
  collection?: Collection
  onSubmit: (data: { name: string; description: string | null }) => Promise<void>
  onCancel?: () => void
}

export default function CollectionForm({ collection, onSubmit, onCancel }: CollectionFormProps) {
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }
    
    setIsLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
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
        label="Collection Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isLoading}
        placeholder="e.g., Baseball Cards, Hallmark 2024"
      />
      
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        rows={4}
        placeholder="Add a description for this collection..."
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
              {collection ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            collection ? 'Update Collection' : 'Create Collection'
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

