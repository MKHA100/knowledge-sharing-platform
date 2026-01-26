-- Add anonymous display fields for users
-- This allows users to remain anonymous when their documents are viewed publicly

-- Add new columns for anonymous display
ALTER TABLE users
ADD COLUMN IF NOT EXISTS anon_name TEXT,
ADD COLUMN IF NOT EXISTS anon_avatar_seed INTEGER;

-- Generate random avatar seeds (1-100 for variety)
UPDATE users
SET anon_avatar_seed = (FLOOR(RANDOM() * 100) + 1)::INTEGER
WHERE anon_avatar_seed IS NULL;

-- Create a function to generate creative anonymous names
CREATE OR REPLACE FUNCTION generate_anon_name()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Clever', 'Wise', 'Bright', 'Swift', 'Noble', 'Keen', 'Bold', 'Calm',
    'Brave', 'Quick', 'Sharp', 'Smart', 'Kind', 'Cool', 'Fair', 'True',
    'Eager', 'Happy', 'Lucky', 'Merry'
  ];
  animals TEXT[] := ARRAY[
    'Panda', 'Owl', 'Fox', 'Eagle', 'Lion', 'Tiger', 'Bear', 'Wolf',
    'Hawk', 'Dolphin', 'Otter', 'Penguin', 'Koala', 'Falcon', 'Raven',
    'Lynx', 'Crane', 'Dragon', 'Phoenix', 'Turtle'
  ];
  adj TEXT;
  animal TEXT;
BEGIN
  adj := adjectives[1 + floor(random() * array_length(adjectives, 1))];
  animal := animals[1 + floor(random() * array_length(animals, 1))];
  RETURN adj || ' ' || animal;
END;
$$ LANGUAGE plpgsql;

-- Populate anonymous names for existing users
UPDATE users
SET anon_name = generate_anon_name()
WHERE anon_name IS NULL;

-- Create a trigger to generate anonymous name for new users
CREATE OR REPLACE FUNCTION set_user_anon_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.anon_name IS NULL THEN
    NEW.anon_name := (
      SELECT generate_anon_name()
    );
  END IF;
  
  IF NEW.anon_avatar_seed IS NULL THEN
    NEW.anon_avatar_seed := (FLOOR(RANDOM() * 100) + 1)::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_user_anon_fields ON users;
CREATE TRIGGER trigger_set_user_anon_fields
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_anon_fields();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_anon_name ON users(anon_name);

-- Comment on new columns
COMMENT ON COLUMN users.anon_name IS 'Anonymous display name (e.g., "Clever Panda") shown to non-admins';
COMMENT ON COLUMN users.anon_avatar_seed IS 'Seed for generating consistent anonymous avatar (1-100)';
