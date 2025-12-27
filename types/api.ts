import type { Item } from './entities'

// Phase 2: AI Draft Response
export interface AIDraftResponse {
  title: string
  description: string
  candidate_tags: string[]
  brand?: string
  series_name?: string
  year_released?: number
  sku?: string
}

export interface AIDraftRequest {
  image_url: string
  description?: string
}

// Phase 3: Identify Online
export interface SearchCandidate {
  title: string
  url: string
  snippet: string
  provider: string
}

export interface IdentifyRequest {
  image_url?: string
  title?: string
  description?: string
  brand?: string
}

export interface ApplyMatchRequest {
  url: string
  item_id?: string
}

export interface ApplyMatchResponse {
  suggestions: Partial<Item>
  confidence: number
  source_url: string
}

// Google Custom Search Integration
export interface ImageSearchResult {
  title: string
  url: string
  snippet: string
  thumbnail?: string
  displayLink: string
}

export interface ImageSearchResponse {
  results: ImageSearchResult[]
  totalResults?: number
  error?: string
}

export interface ImageSearchRequest {
  image: File
}

// Product Scraping
export interface ScrapedProductData {
  title: string | null
  description: string | null
  brand: string | null
  series_name: string | null
  year_released: number | null
  sku: string | null
}

export interface ScrapeProductRequest {
  url: string
}

export interface ScrapeProductResponse {
  data: ScrapedProductData
  success: boolean
  error?: string
}


