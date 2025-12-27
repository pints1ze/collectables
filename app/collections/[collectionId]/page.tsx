import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ItemGrid from '@/components/items/ItemGrid'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import type { Collection, Item } from '@/types/entities'

interface CollectionPageProps {
  params: Promise<{ collectionId: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single()
  
  if (collectionError || !collection) {
    notFound()
  }
  
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })
  
  if (itemsError) {
    console.error('Error fetching items:', itemsError)
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: 'Collections', href: '/collections' },
          { label: (collection as Collection).name }
        ]}
      />
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {(collection as Collection).name}
          </h1>
          {(collection as Collection).description && (
            <p className="text-gray-600">
              {(collection as Collection).description}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <Link href={`/collections/${collectionId}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Link href={`/collections/${collectionId}/items/new`}>
            <Button>Add Item</Button>
          </Link>
        </div>
      </div>
      
      <ItemGrid items={(items as Item[]) || []} collectionId={collectionId} />
    </div>
  )
}


