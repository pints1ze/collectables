import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'

/**
 * API route to get the base URL for the application
 * This ensures we get the correct URL even in client components
 */
export async function GET() {
  return NextResponse.json({ baseUrl: getBaseUrl() })
}

