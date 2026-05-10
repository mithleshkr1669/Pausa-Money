-- Pausa Community — Supabase Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- NOTE: This uses Clerk user IDs (text) instead of Supabase auth.users UUIDs
-- because Pausa uses Clerk for authentication.

-- Enable pgvector for future RAG support (optional)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ───────────────────────────────────────────────
-- PROFILES (keyed by Clerk user ID)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              text PRIMARY KEY,           -- Clerk user ID (user_xxxx)
  username        text UNIQUE,
  display_name    text,
  avatar_url      text,
  ring_tier       int DEFAULT 1,              -- 1=Beej 2=Saathi 3=Sevak 4=Sutradhaar 5=Nirmata
  ring_name       text DEFAULT 'Beej',
  fincoin_balance int DEFAULT 0,
  plan_tier       text DEFAULT 'free',        -- free | pro
  employment      text,
  city_tier       text,
  language_pref   text DEFAULT 'en',
  income_range    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────
-- POSTS (Community Q&A)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE SET NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  tags        text[] DEFAULT '{}',
  upvotes     int DEFAULT 0,
  view_count  int DEFAULT 0,
  is_answered bool DEFAULT false,
  language    text DEFAULT 'en',
  slug        text UNIQUE,
  created_at  timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────
-- ANSWERS
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id       text REFERENCES profiles(id) ON DELETE SET NULL,
  body          text NOT NULL,
  upvotes       int DEFAULT 0,
  is_ai         bool DEFAULT false,
  is_verified   bool DEFAULT false,
  verifier_id   text REFERENCES profiles(id) ON DELETE SET NULL,
  verifier_type text,                         -- cfp | sebi_ria | ca
  created_at    timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────
-- VOTES (one per user per target)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL,
  target_type text NOT NULL,                  -- post | answer
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

-- ───────────────────────────────────────────────
-- RING ACTIVITY (for promotion tracking)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ring_activity (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,                -- post | answer | helpful_vote | review | referral | welcome
  target_id     uuid,
  points        int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────
-- FINCOIN LEDGER
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fincoin_ledger (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   text REFERENCES profiles(id) ON DELETE CASCADE,
  amount    int NOT NULL,                     -- positive = credit, negative = debit
  reason    text NOT NULL,
  target_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────
-- RPC FUNCTIONS (for atomic upvote increments)
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_post_upvotes(post_id uuid)
RETURNS void AS $$
  UPDATE posts SET upvotes = upvotes + 1 WHERE id = post_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_answer_upvotes(answer_id uuid)
RETURNS void AS $$
  UPDATE answers SET upvotes = upvotes + 1 WHERE id = answer_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ───────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- (Clerk tokens won't auto-set auth.uid, so we
--  use anon key + check user_id in app logic.
--  Enable RLS + open policies for now; tighten later
--  with a Clerk JWT template in Supabase.)
-- ───────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ring_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE fincoin_ledger ENABLE ROW LEVEL SECURITY;

-- Open read/write for anon key (app-level auth via Clerk)
-- Tighten by adding a Clerk JWT integration in Supabase settings
CREATE POLICY "anon_all_profiles" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_posts"    ON posts    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_answers"  ON answers  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_votes"    ON votes    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_ring"     ON ring_activity FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_fincoin"  ON fincoin_ledger FOR ALL TO anon USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────
-- SAMPLE DATA (optional — delete before production)
-- ───────────────────────────────────────────────
-- INSERT INTO profiles (id, display_name, ring_tier, ring_name)
-- VALUES ('user_demo123', 'Demo User', 1, 'Beej');
