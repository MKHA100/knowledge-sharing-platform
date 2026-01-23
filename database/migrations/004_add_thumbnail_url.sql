-- Migration: Add thumbnail_url column to documents table
-- Purpose: Store URLs for pre-generated PDF thumbnail images
-- Date: 2026-01-24

-- Add thumbnail_url column
ALTER TABLE documents
ADD COLUMN thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN documents.thumbnail_url IS 'URL to thumbnail image (PNG/JPEG) of the PDF first page, stored in R2 thumbnails/ folder';

-- Create index for faster queries filtering by null thumbnails (useful for backfill)
CREATE INDEX idx_documents_thumbnail_url_null ON documents(id) WHERE thumbnail_url IS NULL;

-- Note: Run this migration in Supabase SQL Editor
-- After running, existing documents will have NULL thumbnail_url
-- Use the backfill API endpoint to generate thumbnails for existing documents
