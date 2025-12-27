-- Storage bucket policies for item-images
-- Note: Storage bucket must be created in Supabase dashboard first
-- Path format: {itemId}/{timestamp}.{ext}
--
-- IMPORTANT: This migration only creates the helper function.
-- Storage policies must be created via the Supabase Dashboard because
-- storage.objects table is owned by Supabase and cannot be modified via SQL.
--
-- After running this migration, go to:
-- Supabase Dashboard > Storage > item-images bucket > Policies
-- And create the policies manually using the function created here.

-- Helper function to check if user owns the item for a given path
-- Note: Functions in Supabase should be in the public schema, not storage schema
CREATE OR REPLACE FUNCTION public.check_item_ownership(file_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  item_uuid UUID;
BEGIN
  -- Extract item ID from path (first part before '/')
  item_uuid := split_part(file_path, '/', 1)::UUID;
  
  -- Check if item exists and user owns the collection
  -- SECURITY DEFINER allows bypassing RLS, but we need to ensure the function
  -- can access the tables. The function runs with the privileges of the creator.
  RETURN EXISTS (
    SELECT 1 FROM public.items
    JOIN public.collections ON public.collections.id = public.items.collection_id
    WHERE public.items.id = item_uuid
    AND public.collections.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_item_ownership(TEXT) TO authenticated;

-- Drop old function if it exists in storage schema
DROP FUNCTION IF EXISTS storage.check_item_ownership(TEXT);

-- ============================================================================
-- STORAGE POLICIES MUST BE CREATED VIA SUPABASE DASHBOARD
-- ============================================================================
-- 
-- Go to: Supabase Dashboard > Storage > item-images bucket > Policies
-- 
-- Create the following three policies:
--
-- 1. INSERT Policy (for uploads):
--    Name: "Users can upload item images"
--    Allowed operation: INSERT
--    Target roles: authenticated
--    USING expression: (bucket_id = 'item-images' AND public.check_item_ownership(name))
--    WITH CHECK expression: (bucket_id = 'item-images' AND public.check_item_ownership(name))
--
-- 2. SELECT Policy (for reads):
--    Name: "Users can read own item images"
--    Allowed operation: SELECT
--    Target roles: authenticated
--    USING expression: (bucket_id = 'item-images' AND public.check_item_ownership(name))
--
-- 3. DELETE Policy (for deletes):
--    Name: "Users can delete own item images"
--    Allowed operation: DELETE
--    Target roles: authenticated
--    USING expression: (bucket_id = 'item-images' AND public.check_item_ownership(name))
--
-- ============================================================================

