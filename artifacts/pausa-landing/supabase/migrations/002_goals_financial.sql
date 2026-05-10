-- Pausa — Goals & Financial Profile Migration
-- Run this AFTER 001_community.sql in your Supabase SQL Editor

-- ─── SAVINGS GOALS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              text REFERENCES profiles(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  category             text NOT NULL DEFAULT 'other',
  target_amount        int NOT NULL,           -- in rupees
  current_amount       int DEFAULT 0,          -- in rupees
  monthly_contribution int DEFAULT 0,          -- in rupees
  target_date          date,
  is_completed         bool DEFAULT false,
  created_at           timestamptz DEFAULT now()
);

-- ─── FINANCIAL PROFILES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_profiles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              text UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_income       int DEFAULT 0,
  housing_expense      int DEFAULT 0,
  food_expense         int DEFAULT 0,
  transport_expense    int DEFAULT 0,
  utilities_expense    int DEFAULT 0,
  insurance_expense    int DEFAULT 0,
  entertainment_expense int DEFAULT 0,
  other_expense        int DEFAULT 0,
  updated_at           timestamptz DEFAULT now()
);

-- ─── BADGES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key  text NOT NULL,                    -- newcomer | goal_setter | saver | contributor | helper | planner | guardian | founder
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_goals"     ON savings_goals     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_financial" ON financial_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_badges"    ON user_badges        FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── UPDATE profiles ring_name for existing rows ─────────────────────────────
UPDATE profiles SET ring_name = 'Seed' WHERE ring_tier = 1;
UPDATE profiles SET ring_name = 'Companion' WHERE ring_tier = 2;
UPDATE profiles SET ring_name = 'Guardian' WHERE ring_tier = 3;
UPDATE profiles SET ring_name = 'Director' WHERE ring_tier = 4;
UPDATE profiles SET ring_name = 'Founder' WHERE ring_tier = 5;
