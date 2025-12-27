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
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tags
      </label>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleToggleTag(tag.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedTagIds.includes(tag.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      
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
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
        />
        <button
          type="button"
          onClick={handleCreateTag}
          disabled={isCreating || !newTagName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  )
}


