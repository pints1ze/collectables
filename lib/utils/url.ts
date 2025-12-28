/**
 * Get the base URL for the application based on the environment
 * This ensures email confirmation links point to the correct domain
 * 
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (explicit override - use this in production!)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. window.location.origin (client-side fallback)
 * 4. localhost:3000 (development fallback)
 * 
 * IMPORTANT: For production, set NEXT_PUBLIC_APP_URL in your environment variables
 * to ensure emails always use the correct domain.
 */
export function getBaseUrl(): string {
  // Always prioritize NEXT_PUBLIC_APP_URL if set (works in both client and server)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Client-side: use window.location.origin as fallback
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side: use VERCEL_URL if available (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // For local development
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_LOCAL_URL || 'http://localhost:3000'
  }

  // Fallback
  return 'http://localhost:3000'
}

/**
 * Get the auth callback URL for email confirmations
 */
export function getAuthCallbackUrl(): string {
  return `${getBaseUrl()}/auth/callback`
}

