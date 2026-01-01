# Storage Bucket Policies - Dashboard Setup Instructions

After running the SQL migration `003_storage_bucket_policies.sql`, you need to create the storage policies via the Supabase Dashboard.

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to: **Storage** > **item-images** bucket > **Policies** tab
3. Click **New Policy** for each of the following:

### Policy 1: INSERT (Upload)
- **Policy name**: `Users can upload item images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**: Leave empty or use: `bucket_id = 'item-images'`
- **WITH CHECK expression**: 
```sql
bucket_id = 'item-images' AND public.check_item_ownership(name)
```

### Policy 2: SELECT (Read)
- **Policy name**: `Users can read own item images`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'item-images' AND public.check_item_ownership(name)
```

### Policy 3: DELETE
- **Policy name**: `Users can delete own item images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'item-images' AND public.check_item_ownership(name)
```

## Important Notes:

- If you have existing policies that reference `storage.check_item_ownership`, you need to update them to use `public.check_item_ownership` instead
- The function `public.check_item_ownership` must exist (created by the SQL migration)
- Make sure RLS is enabled on the storage bucket (usually enabled by default)


