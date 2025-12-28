import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/collections'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the specified next URL or default to collections
      const redirectUrl = new URL(next, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If there's an error or no code, redirect to sign-in
  const signInUrl = new URL('/sign-in', requestUrl.origin)
  signInUrl.searchParams.set('error', 'auth_failed')
  return NextResponse.redirect(signInUrl)
}

