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

