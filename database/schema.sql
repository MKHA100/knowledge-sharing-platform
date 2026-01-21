-- Knowledge Management System Database Schema
-- Execute this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('book', 'short_note', 'paper', 'jumbled');
CREATE TYPE medium_type AS ENUM ('sinhala', 'english', 'tamil');

-- All O-Level subjects as a single flat list (no categories)
CREATE TYPE subject_type AS ENUM (
  -- Religion subjects
  'buddhism',
  'catholicism',
  'saivanery',
  'christianity',
  'islam',
  -- Core subjects
  'english',
  'sinhala_language_literature',
  'tamil_language_literature',
  'mathematics',
  'history',
  'science',
  -- Category I subjects
  'civic_education',
  'business_accounting',
  'geography',
  'entrepreneurship',
  'second_language_sinhala',
  'second_language_tamil',
  'pali',
  'sanskrit',
  'french',
  'german',
  'hindi',
  'japanese',
  'arabic',
  'korean',
  'chinese',
  'russian',
  -- Category II subjects
  'music_oriental',
  'music_western',
  'music_carnatic',
  'dancing_oriental',
  'dancing_bharata',
  'english_literary_texts',
  'sinhala_literary_texts',
  'tamil_literary_texts',
  'arabic_literary_texts',
  'drama_theatre',
  -- Category III subjects
  'ict',
  'agriculture_food_technology',
  'aquatic_bioresources',
  'art_crafts',
  'home_economics',
  'health_physical_education',
  'communication_media',
  'design_construction',
  'design_mechanical',
  'design_electrical_electronic'
);

CREATE TYPE happiness_level AS ENUM ('helpful', 'very_helpful', 'life_saver');
CREATE TYPE notification_type AS ENUM (
  'comment_received', 'download_milestone', 'upload_processed',
  'document_rejected', 'system_message', 'complement'
);
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  page_count INTEGER,
  type document_type NOT NULL,
  subject subject_type NOT NULL,
  medium medium_type NOT NULL,
  status document_status DEFAULT 'pending',
  rejection_reason TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_name TEXT, -- For admin complements when user_id is null
  is_admin_complement BOOLEAN DEFAULT false,
  happiness happiness_level NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create failed_searches table
CREATE TABLE failed_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL UNIQUE,
  subject subject_type,
  medium medium_type,
  type document_type,
  search_count INTEGER DEFAULT 1,
  is_resolved BOOLEAN DEFAULT false,
  resolved_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create document_votes table
CREATE TABLE document_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, document_id)
);

-- Create user_downloads table
CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_unique BOOLEAN DEFAULT false,
  UNIQUE(user_id, document_id)
);

-- Create indexes for performance
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploader ON documents(uploader_id);
CREATE INDEX idx_documents_subject ON documents(subject);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_medium ON documents(medium);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_upvotes ON documents(upvotes DESC);
CREATE INDEX idx_documents_downloads ON documents(downloads DESC);
CREATE INDEX idx_documents_trending ON documents(is_trending, created_at DESC);
CREATE INDEX idx_documents_featured ON documents(is_featured, created_at DESC);
CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
CREATE INDEX idx_comments_document ON comments(document_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_failed_searches_normalized ON failed_searches(normalized_query);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- Function: Search documents with filters and fuzzy matching
CREATE OR REPLACE FUNCTION search_documents(
  search_query TEXT DEFAULT '',
  filter_subject subject_type DEFAULT NULL,
  filter_medium medium_type DEFAULT NULL,
  filter_type document_type DEFAULT NULL,
  page_limit INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  uploader_name TEXT,
  subject subject_type,
  medium medium_type,
  type document_type,
  upvotes INTEGER,
  downvotes INTEGER,
  views INTEGER,
  downloads INTEGER,
  created_at TIMESTAMPTZ,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    u.name AS uploader_name,
    d.subject,
    d.medium,
    d.type,
    d.upvotes,
    d.downvotes,
    d.views,
    d.downloads,
    d.created_at,
    CASE 
      WHEN search_query = '' THEN 0.0::REAL
      ELSE similarity(d.title, search_query)
    END AS similarity
  FROM documents d
  LEFT JOIN users u ON d.uploader_id = u.id
  WHERE d.status = 'approved'
    AND (filter_subject IS NULL OR d.subject = filter_subject)
    AND (filter_medium IS NULL OR d.medium = filter_medium)
    AND (filter_type IS NULL OR d.type = filter_type)
    AND (
      search_query = '' 
      OR d.title ILIKE '%' || search_query || '%'
      OR similarity(d.title, search_query) > 0.1
    )
  ORDER BY 
    CASE WHEN search_query = '' THEN d.created_at END DESC,
    similarity DESC,
    d.upvotes DESC
  LIMIT page_limit OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Toggle upvote on document
CREATE OR REPLACE FUNCTION toggle_upvote(
  doc_id UUID,
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  existing_vote TEXT;
  new_upvotes INTEGER;
  new_downvotes INTEGER;
BEGIN
  -- Check existing vote
  SELECT vote_type INTO existing_vote
  FROM document_votes
  WHERE document_id = doc_id AND user_id = user_id_param;

  IF existing_vote IS NULL THEN
    -- No existing vote, add upvote
    INSERT INTO document_votes (document_id, user_id, vote_type)
    VALUES (doc_id, user_id_param, 'upvote');
    
    UPDATE documents 
    SET upvotes = upvotes + 1
    WHERE id = doc_id;
    
  ELSIF existing_vote = 'upvote' THEN
    -- Remove upvote
    DELETE FROM document_votes
    WHERE document_id = doc_id AND user_id = user_id_param;
    
    UPDATE documents 
    SET upvotes = upvotes - 1
    WHERE id = doc_id;
    
  ELSIF existing_vote = 'downvote' THEN
    -- Change from downvote to upvote
    UPDATE document_votes
    SET vote_type = 'upvote'
    WHERE document_id = doc_id AND user_id = user_id_param;
    
    UPDATE documents 
    SET upvotes = upvotes + 1, downvotes = downvotes - 1
    WHERE id = doc_id;
  END IF;

  -- Return updated counts
  SELECT upvotes, downvotes INTO new_upvotes, new_downvotes
  FROM documents WHERE id = doc_id;

  RETURN json_build_object(
    'upvotes', new_upvotes,
    'downvotes', new_downvotes,
    'user_vote', CASE 
      WHEN existing_vote IS NULL OR existing_vote = 'downvote' THEN 'upvote'
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Toggle downvote on document
CREATE OR REPLACE FUNCTION toggle_downvote(
  doc_id UUID,
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  existing_vote TEXT;
  new_upvotes INTEGER;
  new_downvotes INTEGER;
BEGIN
  -- Check existing vote
  SELECT vote_type INTO existing_vote
  FROM document_votes
  WHERE document_id = doc_id AND user_id = user_id_param;

  IF existing_vote IS NULL THEN
    -- No existing vote, add downvote
    INSERT INTO document_votes (document_id, user_id, vote_type)
    VALUES (doc_id, user_id_param, 'downvote');
    
    UPDATE documents 
    SET downvotes = downvotes + 1
    WHERE id = doc_id;
    
  ELSIF existing_vote = 'downvote' THEN
    -- Remove downvote
    DELETE FROM document_votes
    WHERE document_id = doc_id AND user_id = user_id_param;
    
    UPDATE documents 
    SET downvotes = downvotes - 1
    WHERE id = doc_id;
    
  ELSIF existing_vote = 'upvote' THEN
    -- Change from upvote to downvote
    UPDATE document_votes
    SET vote_type = 'downvote'
    WHERE document_id = doc_id AND user_id = user_id_param;
    
    UPDATE documents 
    SET downvotes = downvotes + 1, upvotes = upvotes - 1
    WHERE id = doc_id;
  END IF;

  -- Return updated counts
  SELECT upvotes, downvotes INTO new_upvotes, new_downvotes
  FROM documents WHERE id = doc_id;

  RETURN json_build_object(
    'upvotes', new_upvotes,
    'downvotes', new_downvotes,
    'user_vote', CASE 
      WHEN existing_vote IS NULL OR existing_vote = 'upvote' THEN 'downvote'
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Increment document view count
CREATE OR REPLACE FUNCTION increment_view_count(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_views INTEGER;
BEGIN
  UPDATE documents 
  SET views = views + 1
  WHERE id = doc_id
  RETURNING views INTO new_views;
  
  RETURN new_views;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment download count and record user download
CREATE OR REPLACE FUNCTION increment_download_count(
  doc_id UUID,
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  new_downloads INTEGER;
  is_first_download BOOLEAN := false;
BEGIN
  -- Check if this is the user's first download of this document
  INSERT INTO user_downloads (user_id, document_id, is_unique)
  VALUES (user_id_param, doc_id, true)
  ON CONFLICT (user_id, document_id) DO NOTHING;
  
  IF FOUND THEN
    is_first_download := true;
    -- Only increment global counter for unique downloads
    UPDATE documents 
    SET downloads = downloads + 1
    WHERE id = doc_id
    RETURNING downloads INTO new_downloads;
  ELSE
    -- Get current download count without incrementing
    SELECT downloads INTO new_downloads
    FROM documents WHERE id = doc_id;
  END IF;

  RETURN json_build_object(
    'downloads', new_downloads,
    'is_first_download', is_first_download
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Get a random failed search for suggestions
CREATE OR REPLACE FUNCTION get_failed_search_suggestion()
RETURNS TABLE (
  query TEXT,
  subject subject_type,
  medium medium_type,
  type document_type,
  search_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.query,
    fs.subject,
    fs.medium,
    fs.type,
    fs.search_count
  FROM failed_searches fs
  WHERE fs.is_resolved = false
    AND fs.search_count >= 3
  ORDER BY fs.search_count DESC, RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_failed_searches_updated_at
  BEFORE UPDATE ON failed_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (replace with your actual Clerk ID after first login)
-- UNCOMMENT AND UPDATE AFTER FIRST LOGIN:
-- INSERT INTO users (clerk_id, email, name, role) 
-- VALUES ('your-clerk-user-id', 'admin@example.com', 'Admin User', 'admin');