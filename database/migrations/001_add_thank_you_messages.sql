-- Migration: Add Thank You Messages with AI Moderation
-- Execute this in Supabase SQL Editor

-- Step 1: Create new enum types
CREATE TYPE thank_you_status AS ENUM ('pending_review', 'approved', 'rejected');
CREATE TYPE sentiment_category AS ENUM ('positive', 'neutral', 'negative', 'inappropriate');

-- Step 2: Create thank_you_messages table
CREATE TABLE thank_you_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sentiment_category sentiment_category NOT NULL,
  ai_confidence REAL NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_reasoning TEXT,
  status thank_you_status NOT NULL DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_edited_message TEXT,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create indexes for thank_you_messages
CREATE INDEX idx_thank_you_sender ON thank_you_messages(sender_id);
CREATE INDEX idx_thank_you_recipient ON thank_you_messages(recipient_id);
CREATE INDEX idx_thank_you_document ON thank_you_messages(document_id);
CREATE INDEX idx_thank_you_status ON thank_you_messages(status, created_at DESC);
CREATE INDEX idx_thank_you_reviewed ON thank_you_messages(reviewed_by, reviewed_at DESC);

-- Step 4: Add trigger for updated_at timestamp
CREATE TRIGGER update_thank_you_messages_updated_at
  BEFORE UPDATE ON thank_you_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify migration
SELECT 
  'thank_you_messages table created' as status,
  count(*) as row_count 
FROM thank_you_messages;
