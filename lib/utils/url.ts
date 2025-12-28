/**
 * Get the base URL for the application based on the environment
 * This ensures email confirmation links point to the correct domain
 * 
 * Works in both server and client components:
 * - Client: Uses window.location.origin or NEXT_PUBLIC_APP_URL
 * - Server: Uses VERCEL_URL or NEXT_PUBLIC_APP_URL
 */
export function getBaseUrl(): string {
  // Client-side: use window.location.origin if available
  if (typeof window !== 'undefined') {
    // Check if we have an explicit base URL set (useful for custom domains)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }
    // Use the current origin (works for localhost, Vercel, and custom domains)
    return window.location.origin
  }

  // Server-side: use environment variables
  // Check if we have an explicit base URL set (useful for custom domains)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // In production (Vercel), use the VERCEL_URL environment variable
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

