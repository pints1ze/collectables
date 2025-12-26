-- Extend auth.users with display_name (if needed, handled via profile)
-- Note: We'll create a public.users view or handle display_name in app logic

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  primary_image_id UUID, -- References item_images.id
  title TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  series_name TEXT,
  year_released INTEGER,
  year_acquired INTEGER,
  sku TEXT,
  condition TEXT,
  location TEXT,
  notes TEXT,
  identified_source_url TEXT,
  identified_provider TEXT,
  identified_confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item images table
CREATE TABLE IF NOT EXISTS item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  caption TEXT,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for primary_image_id
ALTER TABLE items 
  ADD CONSTRAINT fk_items_primary_image 
  FOREIGN KEY (primary_image_id) 
  REFERENCES item_images(id) 
  ON DELETE SET NULL;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Item tags junction table
CREATE TABLE IF NOT EXISTS item_tags (
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, tag_id)
);

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- Items policies
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = items.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Item images policies
CREATE POLICY "Users can view own item images"
  ON item_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_images.item_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own item images"
  ON item_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_images.item_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own item images"
  ON item_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_images.item_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own item images"
  ON item_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_images.item_id
      AND collections.user_id = auth.uid()
    )
  );

-- Tags policies
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Item tags policies
CREATE POLICY "Users can view own item tags"
  ON item_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_tags.item_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own item tags"
  ON item_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_tags.item_id
      AND collections.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = item_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own item tags"
  ON item_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      JOIN collections ON collections.id = items.collection_id
      WHERE items.id = item_tags.item_id
      AND collections.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_collection_id ON items(collection_id);
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON item_images(item_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tags
  SET usage_count = usage_count + 1
  WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_tag_usage(tag_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tags
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

