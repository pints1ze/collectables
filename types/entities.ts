export interface User {
  id: string
  email: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  collection_id: string
  primary_image_id: string | null
  title: string
  description: string | null
  notes: string | null
  identified_source_url: string | null
  identified_provider: string | null
  identified_confidence: number | null
  created_at: string
  updated_at: string
}

export interface ItemImage {
  id: string
  item_id: string
  image_url: string
  is_primary: boolean
  caption: string | null
  captured_at: string | null
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  usage_count: number
  created_at: string
  updated_at: string
}

export interface ItemTag {
  item_id: string
  tag_id: string
  created_at: string
}


