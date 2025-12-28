'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils/format'
import type { Tag } from '@/types/entities'

interface TagSelectorProps {
  selectedTagIds: string[]
  onSelectionChange: (tagIds: string[]) => void
  userId: string
}

export default function TagSelector({ selectedTagIds, onSelectionChange, userId }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()
  
  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name')
      
      if (error) {
        console.error('Error fetching tags:', error)
      } else {
        setTags(data as Tag[])
      }
    }
    
    fetchTags()
  }, [userId, supabase])
  
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    const slug = slugify(newTagName.trim())
    
    setIsCreating(true)
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: newTagName.trim(),
        slug,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag. It may already exist.')
    } else {
      setTags([...tags, data as Tag])
      onSelectionChange([...selectedTagIds, data.id])
      setNewTagName('')
    }
    
    setIsCreating(false)
  }
  
  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onSelectionChange([...selectedTagIds, tagId])
    }
  }
  
  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedTagIds.filter(id => id !== tagId))
  }
  
  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id))
  const unselectedTags = tags.filter(tag => !selectedTagIds.includes(tag.id))
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground mb-2">
        Tags
      </label>
      
      {/* Selected tags with remove button */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white border border-blue-700 shadow-sm"
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveTag(tag.id, e)}
                className="ml-1 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag.name} tag`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Unselected tags */}
      {unselectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {unselectedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer border shadow-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreateTag()
            }
          }}
          placeholder="Create new tag..."
          className="flex-1 px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isCreating}
        />
        <button
          type="button"
          onClick={handleCreateTag}
          disabled={isCreating || !newTagName.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 border border-primary/20 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  )
}


