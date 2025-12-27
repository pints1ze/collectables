import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CollectionList from '@/components/collections/CollectionList'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import type { Collection } from '@/types/entities'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching collections:', error)
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Collections' }]} />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Collections</h1>
        <Link href="/collections/new">
          <Button>New Collection</Button>
        </Link>
      </div>
      
      <CollectionList collections={(collections as Collection[]) || []} />
    </div>
  )
}


