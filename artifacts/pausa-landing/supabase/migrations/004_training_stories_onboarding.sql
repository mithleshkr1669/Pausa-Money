-- ═══════════════════════════════════════════════════════════════════
-- Migration 004: AI Training Data, Community Stories, Onboarding
-- Run AFTER 001, 002, 003
-- ═══════════════════════════════════════════════════════════════════

-- ── AI Training Data (liked / disliked responses for fine-tuning) ─────────────
CREATE TABLE IF NOT EXISTS ai_training_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text,
  session_id  text,
  prompt      text NOT NULL,
  response    text NOT NULL,
  provider    text,                   -- 'gemini' | 'anthropic'
  label       text,                   -- 'liked' | 'disliked'
  saved       bool DEFAULT false,
  context     jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- ── AI Saved Responses ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_saved_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  text,
  prompt      text,
  response    text NOT NULL,
  provider    text,
  created_at  timestamptz DEFAULT now()
);

-- ── Community Stories (financial journey narratives) ──────────────────────────
CREATE TABLE IF NOT EXISTS community_stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE SET NULL,
  title       text NOT NULL,
  situation   text NOT NULL,   -- "I was 24, earning ₹38k, confused..."
  challenge   text NOT NULL,   -- "The problem was..."
  action      text NOT NULL,   -- "Here's what I did..."
  result      text NOT NULL,   -- "Now I..."
  city        text,
  income_range text,
  ring_tier   int DEFAULT 1,
  tags        text[] DEFAULT '{}',
  upvotes     int DEFAULT 0,
  is_featured bool DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ── User Onboarding (story-based questionnaire + phone OTP) ───────────────────
CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id       text PRIMARY KEY,
  situation     text,    -- e.g. 'first_job' | 'debt' | 'planning_family' | 'nri'
  worry         text,    -- e.g. 'where_to_start' | 'too_much_debt' | 'no_savings'
  income_range  text,
  supports      text[] DEFAULT '{}',   -- ['parents','spouse','children']
  top_goal      text,
  phone         text,
  phone_verified bool DEFAULT false,
  completed     bool DEFAULT false,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ── Notification Preferences ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id      text PRIMARY KEY,
  email        text,
  phone        text,
  email_enabled bool DEFAULT true,
  whatsapp_enabled bool DEFAULT false,
  notify_answers bool DEFAULT true,
  notify_upvotes bool DEFAULT false,
  notify_weekly_digest bool DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- ── RLS policies ─────────────────────────────────────────────────────────────
ALTER TABLE ai_training_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_saved_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_stories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_ai_training"      ON ai_training_data       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_ai_saved"         ON ai_saved_responses     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_stories"          ON community_stories       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_onboarding"       ON user_onboarding         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_notif_prefs"      ON notification_preferences FOR ALL TO anon USING (true) WITH CHECK (true);
