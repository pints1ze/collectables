import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadItemImage(
  supabase: SupabaseClient,
  file: File,
  itemId: string
): Promise<string> {
  // #region agent log
  const { data: { user } } = await supabase.auth.getUser();
  fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload.ts:5',message:'Storage upload function entry',data:{itemId,userId:user?.id,fileName:file.name,fileSize:file.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${itemId}/${Date.now()}.${fileExt}`
  
  // #region agent log
  // Test if the policy query would work - check item ownership via the path
  const pathItemId = fileName.split('/')[0];
  const { data: policyTestData, error: policyTestError } = await supabase
    .from('items')
    .select('id, collection_id, collections!inner(user_id)')
    .eq('id', pathItemId)
    .single();
  fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload.ts:13',message:'Policy query test',data:{fileName,pathItemId,policyTestData,policyTestError:policyTestError?.message,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // #region agent log
  // Test the ownership check logic directly (simulating what the function does)
  const { data: directCheck, error: directError } = await supabase
    .from('items')
    .select('id, collection_id, collections!inner(id, user_id)')
    .eq('id', pathItemId)
    .single();
  const ownershipCheckResult = directCheck ? { 
    owns: directCheck.collections?.user_id === user?.id,
    collectionUserId: directCheck.collections?.user_id,
    currentUserId: user?.id,
    itemId: directCheck.id,
    collectionId: directCheck.collection_id
  } : null;
  fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload.ts:26',message:'Direct ownership function test',data:{fileName,pathItemId,ownershipCheckResult,directError:directError?.message,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,D'})}).catch(()=>{});
  // #endregion
  
  // #region agent log
  // Check bucket info
  const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
  const itemImagesBucket = bucketsData?.find(b => b.name === 'item-images' || b.id === 'item-images');
  fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload.ts:30',message:'Bucket check',data:{allBuckets:bucketsData?.map(b=>({name:b.name,id:b.id})),itemImagesBucket:itemImagesBucket?{name:itemImagesBucket.name,id:itemImagesBucket.id}:null,bucketsError:bucketsError?.message,fileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload.ts:19',message:'Before storage upload',data:{fileName,bucket:'item-images',userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
  // #endregion
  
  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a45f423f-dbfd-4a32-a0be-34181c1b8c4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload.ts:18',message:'Storage upload result',data:{success:!error,errorMessage:error?.message,errorName:error?.name,errorStatusCode:error?.statusCode,uploadedPath:data?.path,fileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(data.path)
  
  return publicUrl
}

// Note: We don't upload temporary images to storage anymore.
// Instead, we keep the image in memory until the item is created,
// then upload it directly to the item's location.


