-- Migration 004: Add system_settings and recommendations tables
-- Execute this in Supabase SQL Editor

-- ============================================
-- System Settings Table
-- Used for global application settings like upload toggle
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('uploads_enabled', '{"enabled": true, "reason": null, "auto_disabled": false}', 'Controls whether users can upload new documents'),
  ('storage_limit_bytes', '{"limit": 2147483648, "warning_threshold": 1932735283}', 'R2 storage limit in bytes (2GB default, warning at 1.8GB)')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Recommendations Table
-- Stores user feedback and feature suggestions
-- ============================================
CREATE TYPE recommendation_status AS ENUM ('pending', 'reviewed', 'implemented', 'rejected');

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status recommendation_status DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Enable RLS on the new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
-- Only admins can read/write settings
CREATE POLICY "Admins can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- RLS Policies for recommendations
-- Anyone can insert (submit feedback)
CREATE POLICY "Anyone can submit recommendations"
  ON recommendations FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Only admins can read all recommendations
CREATE POLICY "Admins can read all recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Only admins can update recommendations
CREATE POLICY "Admins can update recommendations"
  ON recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Only admins can delete recommendations
CREATE POLICY "Admins can delete recommendations"
  ON recommendations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_id = auth.jwt() ->> 'sub'
      AND users.role = 'admin'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
