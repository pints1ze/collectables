'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CollectionForm from '@/components/collections/CollectionForm'

export default function NewCollectionPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const handleSubmit = async (data: { name: string; description: string | null }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/sign-in')
      return
    }
    
    const { error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
      })
    
    if (error) {
      throw new Error(error.message)
    }
    
    router.push('/collections')
    router.refresh()
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Collection</h1>
      <CollectionForm onSubmit={handleSubmit} />
    </div>
  )
}

