-- ============================================
-- Test Your Palate - Supabase Migration
-- ============================================

-- 1. Dashboard Configuration Table
CREATE TABLE IF NOT EXISTS dashboard_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL DEFAULT 'Dishoom',
  drinks_remaining INTEGER NOT NULL DEFAULT 150,
  current_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add the column if the table was created by a previous migration
ALTER TABLE dashboard_config ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1;

-- Clear any existing rows to prevent duplicates when running this script multiple times
TRUNCATE TABLE dashboard_config;

-- Insert default configuration row
INSERT INTO dashboard_config (restaurant_name, drinks_remaining, current_round)
VALUES ('Dishoom', 150, 1);

-- 2. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  work_email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  flavor_guess TEXT NOT NULL,
  follow_up_permission BOOLEAN NOT NULL DEFAULT false,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Winners Table
CREATE TABLE IF NOT EXISTS winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  winner_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on submissions email for fast lookup
CREATE INDEX idx_submissions_email ON submissions(work_email);

-- Create index on winners submission_id
CREATE INDEX idx_winners_submission_id ON winners(submission_id);

-- ============================================
-- Enable Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_config;
ALTER PUBLICATION supabase_realtime ADD TABLE winners;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE dashboard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Dashboard Config: anyone can read, anyone can update (admin protected at app level)
CREATE POLICY "Allow public read on dashboard_config"
  ON dashboard_config FOR SELECT
  USING (true);

CREATE POLICY "Allow public update on dashboard_config"
  ON dashboard_config FOR UPDATE
  USING (true);

-- Submissions: anyone can insert and read
CREATE POLICY "Allow public insert on submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on submissions"
  ON submissions FOR SELECT
  USING (true);

CREATE POLICY "Allow public update on submissions"
  ON submissions FOR UPDATE
  USING (true);

-- Winners: anyone can read, insert, delete (admin protected at app level)
CREATE POLICY "Allow public read on winners"
  ON winners FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on winners"
  ON winners FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete on winners"
  ON winners FOR DELETE
  USING (true);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_config_updated_at
  BEFORE UPDATE ON dashboard_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
