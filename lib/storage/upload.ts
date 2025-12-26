import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadItemImage(
  supabase: SupabaseClient,
  file: File,
  itemId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${itemId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(data.path)
  
  return publicUrl
}

