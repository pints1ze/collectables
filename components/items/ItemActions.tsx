'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'

interface ItemActionsProps {
  collectionId: string
  itemId: string
  itemTitle: string
}

export default function ItemActions({ collectionId, itemId, itemTitle }: ItemActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      // Get tag IDs before deletion (needed to decrement usage counts)
      const { data: itemTags } = await supabase
        .from('item_tags')
        .select('tag_id')
        .eq('item_id', itemId)
      
      const tagIds = itemTags?.map(it => it.tag_id) || []
      
      // Delete the item (this will cascade delete item_tags and item_images)
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
      
      if (error) {
        throw error
      }
      
      // Decrement tag usage counts after item deletion
      for (const tagId of tagIds) {
        await supabase.rpc('decrement_tag_usage', { tag_id: tagId })
      }
      
      // Redirect to collection page
      router.push(`/collections/${collectionId}`)
      router.refresh()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.')
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href={`/collections/${collectionId}/items/${itemId}/edit`}>
          <Button
            variant="secondary"
            size="sm"
            className="p-2"
            title="Edit item"
            aria-label="Edit item"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          className="p-2"
          onClick={() => setShowDeleteDialog(true)}
          title="Delete item"
          aria-label="Delete item"
          disabled={isDeleting}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}

