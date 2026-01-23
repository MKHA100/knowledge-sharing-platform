-- Pending images table for admin review
-- Execute this in Supabase SQL Editor

-- Create pending_images table
CREATE TABLE IF NOT EXISTS pending_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_paths TEXT[] NOT NULL, -- Array of file paths for all images in this batch
  submission_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_images_uploader ON pending_images(uploader_id);
CREATE INDEX IF NOT EXISTS idx_pending_images_status ON pending_images(status);
CREATE INDEX IF NOT EXISTS idx_pending_images_created_at ON pending_images(created_at DESC);

-- Enable RLS
ALTER TABLE pending_images ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Admins can see all pending images
CREATE POLICY "Admins can view all pending images"
  ON pending_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND users.role = 'admin'
    )
  );

-- Users can see their own pending images
CREATE POLICY "Users can view their own pending images"
  ON pending_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

-- Users can insert their own pending images
CREATE POLICY "Users can insert their own pending images"
  ON pending_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

-- Admins can update pending images
CREATE POLICY "Admins can update pending images"
  ON pending_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND users.role = 'admin'
    )
  );

-- Admins can delete pending images
CREATE POLICY "Admins can delete pending images"
  ON pending_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND users.role = 'admin'
    )
  );
  ON pending_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Admins can update pending images
CREATE POLICY "Admins can update pending images"
  ON pending_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Admins can delete pending images
CREATE POLICY "Admins can delete pending images"
  ON pending_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );
