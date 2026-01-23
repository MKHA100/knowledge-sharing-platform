-- Migration: Add admin upload tracking and description to documents table
-- This allows tracking when admins upload documents on behalf of users

-- Add description column (missing from original schema)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add columns to track admin uploads
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS uploaded_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS original_image_batch_id UUID REFERENCES pending_images(id) ON DELETE SET NULL;

-- Create index for admin uploaded documents
CREATE INDEX IF NOT EXISTS idx_documents_admin_uploaded ON documents(uploaded_by_admin) WHERE uploaded_by_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_image_batch ON documents(original_image_batch_id) WHERE original_image_batch_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN documents.description IS 'Optional description or additional details about the document';
COMMENT ON COLUMN documents.uploaded_by_admin IS 'True if this document was uploaded by an admin on behalf of a user';
COMMENT ON COLUMN documents.admin_uploaded_by IS 'Admin user who uploaded this document on behalf of the uploader';
COMMENT ON COLUMN documents.original_image_batch_id IS 'Reference to the pending_images batch this document was compiled from';
