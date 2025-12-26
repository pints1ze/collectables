'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CollectionForm from '@/components/collections/CollectionForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Collection } from '@/types/entities'

export default function EditCollectionPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.collectionId as string
  const supabase = createClient()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchCollection() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single()
      
      if (error || !data) {
        router.push('/collections')
        return
      }
      
      setCollection(data as Collection)
      setIsLoading(false)
    }
    
    fetchCollection()
  }, [collectionId, router, supabase])
  
  const handleSubmit = async (data: { name: string; description: string | null }) => {
    const { error } = await supabase
      .from('collections')
      .update({
        name: data.name,
        description: data.description,
      })
      .eq('id', collectionId)
    
    if (error) {
      throw new Error(error.message)
    }
    
    router.push(`/collections/${collectionId}`)
    router.refresh()
  }
  
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }
  
  if (!collection) {
    return null
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Collection</h1>
      <CollectionForm
        collection={collection}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/collections/${collectionId}`)}
      />
    </div>
  )
}

