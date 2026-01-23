-- Migration: Add 'thank_you' to notification_type enum
-- Run this in Supabase SQL Editor

-- Add 'thank_you' to the notification_type enum
ALTER TYPE notification_type ADD VALUE 'thank_you';

-- Verify the change
SELECT 
  enumlabel as notification_types
FROM pg_enum 
WHERE enumtypid = 'notification_type'::regtype
ORDER BY enumsortorder;
