'use client'

import { useState, useMemo } from 'react'
import ItemCard from './ItemCard'
import type { Item, Tag } from '@/types/entities'

interface ItemWithTags extends Item {
  tags: Tag[]
  imageUrl: string | null
}

interface FilterableItemGridProps {
  items: ItemWithTags[]
  collectionId: string
  availableTags: Tag[]
}

export default function FilterableItemGrid({ items, collectionId, availableTags }: FilterableItemGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Text search filter
      const matchesSearch = searchQuery.trim() === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))

      // Tag filter
      const matchesTags = selectedTagIds.length === 0 ||
        selectedTagIds.every(tagId => 
          item.tags.some(tag => tag.id === tagId)
        )

      return matchesSearch && matchesTags
    })
  }, [items, searchQuery, selectedTagIds])

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTagIds([])
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTagIds.length > 0

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search items by title, description, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Filter by Tags
          </label>
          {availableTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border shadow-sm ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tags available. Add tags to items to filter by them.
            </p>
          )}
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredItems.length} of {items.length} items
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Item Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          {hasActiveFilters ? (
            <>
              <p className="text-muted-foreground mb-4">No items match your filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-primary hover:underline"
              >
                Clear filters to see all items
              </button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">No items in this collection yet.</p>
              <p className="text-sm text-muted-foreground/70">Add your first item to get started!</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              collectionId={collectionId}
              imageUrl={item.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}

