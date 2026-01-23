-- Manual Fix: Approve all pending thank you messages and create notifications
-- Run this in Supabase SQL Editor to fix existing messages

-- Step 1: Check current status
SELECT 
  id, 
  status, 
  sentiment_category,
  notification_sent_at,
  message,
  created_at 
FROM thank_you_messages 
ORDER BY created_at DESC;

-- Step 2: Approve all pending messages and create notifications
DO $$
DECLARE
  msg RECORD;
  sender_name TEXT;
BEGIN
  FOR msg IN 
    SELECT 
      tm.id,
      tm.sender_id,
      tm.recipient_id,
      tm.message,
      tm.admin_edited_message
    FROM thank_you_messages tm
    WHERE tm.status = 'pending_review'
  LOOP
    -- Get sender name
    SELECT name INTO sender_name FROM users WHERE id = msg.sender_id;
    
    -- Update thank_you_message to approved
    UPDATE thank_you_messages
    SET 
      status = 'approved',
      notification_sent_at = NOW()
    WHERE id = msg.id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, is_read)
    VALUES (
      msg.recipient_id,
      'thank_you',
      COALESCE(sender_name, 'Someone') || ' thanked you!',
      COALESCE(msg.admin_edited_message, msg.message),
      false
    );
    
    RAISE NOTICE 'Approved message % and created notification', msg.id;
  END LOOP;
END $$;

-- Step 3: Verify the fix
SELECT 
  'Thank You Messages' as table_name,
  status,
  COUNT(*) as count
FROM thank_you_messages
GROUP BY status;

SELECT 
  'Notifications' as table_name,
  type,
  COUNT(*) as count
FROM notifications
WHERE type = 'thank_you'
GROUP BY type;
