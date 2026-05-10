-- Pausa — Extensions Migration (run AFTER 001 + 002)
-- Adds: comments, saved_replies, family_members in posts, nature ring names

-- ─── COMMENTS (lightweight discussion on posts) ───────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id    text REFERENCES profiles(id) ON DELETE SET NULL,
  body       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── SAVED REPLIES (bookmark a specific answer) ──────────────────────────────
CREATE TABLE IF NOT EXISTS saved_replies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text REFERENCES profiles(id) ON DELETE CASCADE,
  answer_id  uuid REFERENCES answers(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, answer_id)
);

-- ─── ADD family_members to posts ─────────────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS family_members jsonb DEFAULT '[]';
-- e.g. [{"relation":"parents","count":2},{"relation":"spouse","count":1}]

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_comments"       ON comments      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_saved_replies"  ON saved_replies FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── UPDATE ring names to nature theme ───────────────────────────────────────
UPDATE profiles SET ring_name = 'Seed'    WHERE ring_tier = 1;
UPDATE profiles SET ring_name = 'Sprout'  WHERE ring_tier = 2;
UPDATE profiles SET ring_name = 'Sapling' WHERE ring_tier = 3;
UPDATE profiles SET ring_name = 'Grove'   WHERE ring_tier = 4;
UPDATE profiles SET ring_name = 'Forest'  WHERE ring_tier = 5;
