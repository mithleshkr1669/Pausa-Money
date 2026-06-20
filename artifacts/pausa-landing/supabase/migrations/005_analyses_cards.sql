-- Pausa — Financial Analyses & Credit Cards Migration
-- Run this AFTER 004_training_stories_onboarding.sql in your Supabase SQL Editor

-- ─── FINANCIAL ANALYSES ───────────────────────────────────────────────────────
-- Stores bank-statement analyses per user, max 2 months kept (older auto-pruned by app).
CREATE TABLE IF NOT EXISTS financial_analyses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text REFERENCES profiles(id) ON DELETE CASCADE,
  month_label   text NOT NULL,                -- e.g. "June 2025"
  period_start  date,
  period_end    date,
  total_income  int NOT NULL DEFAULT 0,       -- in rupees
  total_expense int NOT NULL DEFAULT 0,       -- in rupees
  transactions  jsonb DEFAULT '[]'::jsonb,    -- array of {id,date,description,amount,category,needType}
  source_file   text,                         -- original filename uploaded
  confirmed     bool DEFAULT false,           -- user confirmed the extraction
  created_at    timestamptz DEFAULT now()
);

-- ─── CREDIT CARDS ────────────────────────────────────────────────────────────
-- User's saved credit cards for cashback optimization.
CREATE TABLE IF NOT EXISTS credit_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE,
  card_name   text NOT NULL,                  -- e.g. "HDFC Regalia"
  bank        text NOT NULL,                  -- HDFC, SBI, Axis, ICICI, AmEx
  card_type   text DEFAULT 'credit',
  last_four   text,                           -- last 4 digits (optional)
  color       text DEFAULT '#1a1a2e',
  added_at    timestamptz DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE financial_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_analyses" ON financial_analyses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_cards"    ON credit_cards       FOR ALL TO anon USING (true) WITH CHECK (true);
