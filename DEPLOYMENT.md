# Deploying Collectables to Vercel

This guide will walk you through deploying your Collectables app to Vercel step by step.

## Prerequisites

Before deploying, make sure you have:
- ✅ A GitHub, GitLab, or Bitbucket account (for connecting your repository)
- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com) - free tier available)
- ✅ Your Supabase project set up and configured
- ✅ All environment variables ready

## Step 1: Prepare Your Repository

1. **Commit your code** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   ```

2. **Push to GitHub/GitLab/Bitbucket**:
   ```bash
   git push origin main
   ```
   (Replace `main` with your branch name if different)

## Step 2: Connect to Vercel

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in or create an account (you can use GitHub to sign in)

2. **Import Your Project**:
   - Click "Add New..." → "Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Select your `collectables` repository

3. **Configure Project Settings**:
   - **Framework Preset**: Vercel should auto-detect Next.js
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

## Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - Found in: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (keep this secret!)
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **Important**: Never expose this in client-side code. It's only used in server-side API routes.

### Optional Environment Variables

4. **OPENAI_API_KEY** (Optional - for AI image analysis)
   - Value: Your OpenAI API key
   - Found in: [OpenAI Platform](https://platform.openai.com/api-keys)
   - If not set, the app will work but image analysis will return mock data

5. **GOOGLE_CUSTOM_SEARCH_API_KEY** (Optional - for image search)
   - Value: Your Google Custom Search API key
   - Found in: [Google Cloud Console](https://console.cloud.google.com/)

6. **GOOGLE_CUSTOM_SEARCH_ENGINE_ID** (Optional - for image search)
   - Value: Your Custom Search Engine ID
   - Found in: [Google Programmable Search Engine](https://programmablesearchengine.google.com/)

### How to Add Environment Variables in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Enter the **Name** and **Value** for each variable
4. Select the environments where it applies:
   - ✅ **Production**
   - ✅ **Preview** (recommended for testing)
   - ✅ **Development** (optional)
5. Click **Save**
6. Repeat for all environment variables

## Step 4: Deploy

1. **Click "Deploy"** in the Vercel dashboard
2. Vercel will:
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Deploy to production

3. **Wait for deployment** (usually 1-3 minutes)
   - You'll see build logs in real-time
   - If there are errors, check the build logs

## Step 5: Verify Deployment

1. **Check the deployment URL**:
   - Vercel will provide a URL like: `https://your-app-name.vercel.app`
   - Your app should be live!

2. **Test your app**:
   - Visit the URL
   - Try signing up/signing in
   - Create a collection
   - Add an item with an image
   - Verify everything works

## Step 6: Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `collectables.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (can take up to 24 hours)

## Troubleshooting

### Build Fails

**Common issues:**

1. **Missing environment variables**:
   - Check that all required variables are set in Vercel
   - Ensure variable names match exactly (case-sensitive)

2. **TypeScript errors**:
   - Run `npm run build` locally first to catch errors
   - Fix any TypeScript errors before deploying

3. **Supabase connection issues**:
   - Verify your Supabase URL and keys are correct
   - Check Supabase project is active (not paused)

### Runtime Errors

1. **Check Vercel Function Logs**:
   - Go to your project → **Deployments** → Click on a deployment → **Functions** tab
   - Check logs for API route errors

2. **Check Browser Console**:
   - Open browser DevTools → Console
   - Look for client-side errors

3. **Verify Environment Variables**:
   - Ensure `NEXT_PUBLIC_*` variables are set (these are exposed to the browser)
   - Check that server-side variables are set correctly

### Image Upload Issues

1. **Verify Supabase Storage**:
   - Check that the `item-images` bucket exists in Supabase
   - Verify bucket is set to **Public** or has proper RLS policies
   - Check storage policies in `supabase/migrations/003_storage_bucket_policies.sql`

2. **Check CORS Settings**:
   - Supabase storage should allow requests from your Vercel domain
   - Check Supabase Dashboard → Storage → Settings

## Post-Deployment Checklist

- [ ] App loads successfully
- [ ] User authentication works (sign up/sign in)
- [ ] Can create collections
- [ ] Can add items
- [ ] Image upload works
- [ ] Images display correctly
- [ ] Tags work correctly
- [ ] All API routes function (if using OpenAI/Google Search)

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:
- **Production**: Deploys from `main` branch (or your default branch)
- **Preview**: Creates preview deployments for pull requests

To deploy updates:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically build and deploy!

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs (Dashboard → Logs)
3. Review error messages in browser console
4. Verify all environment variables are set correctly

