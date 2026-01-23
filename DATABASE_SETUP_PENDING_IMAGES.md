# Database Setup for Pending Images

## Issue
The `pending_images` table doesn't exist in your Supabase database, causing the 500 error.

## Solution
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Create pending_images table
CREATE TABLE IF NOT EXISTS pending_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_paths TEXT[] NOT NULL,
  submission_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_images_uploader ON pending_images(uploader_id);
CREATE INDEX IF NOT EXISTS idx_pending_images_status ON pending_images(status);
CREATE INDEX IF NOT EXISTS idx_pending_images_created_at ON pending_images(created_at DESC);

-- Enable RLS
ALTER TABLE pending_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Admins can view all pending images" ON pending_images;
DROP POLICY IF EXISTS "Users can view their own pending images" ON pending_images;
DROP POLICY IF EXISTS "Users can insert their own pending images" ON pending_images;
DROP POLICY IF EXISTS "Admins can update pending images" ON pending_images;
DROP POLICY IF EXISTS "Admins can delete pending images" ON pending_images;

-- Create RLS policies
CREATE POLICY "Admins can view all pending images"
  ON pending_images FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own pending images"
  ON pending_images FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Users can insert their own pending images"
  ON pending_images FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pending_images.uploader_id
      AND users.clerk_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Admins can update pending images"
  ON pending_images FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete pending images"
  ON pending_images FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = (SELECT auth.jwt() ->> 'sub')
      AND users.role = 'admin'
    )
  );
```

## Steps
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Paste the SQL above
5. Click "Run" to execute

## After Setup
Once the table is created:
1. Try uploading images again
2. Images will be stored in R2 and tracked in the database
3. They will appear in the admin dashboard for review
