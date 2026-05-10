-- ═══════════════════════════════════════════════════════════════════
-- PAUSA — Test / Demo Data
-- Run in Supabase SQL Editor AFTER running all migrations (001, 002, 003)
-- These are dummy profiles using fake Clerk-style IDs for testing.
-- ═══════════════════════════════════════════════════════════════════

-- ── Demo Profiles ────────────────────────────────────────────────────────────
INSERT INTO profiles (id, display_name, avatar_url, ring_tier, ring_name, fincoin_balance, income_range, employment, city_tier)
VALUES
  ('user_demo_arjun',  'Arjun Sharma',   null, 3, 'Sapling', 340,  '50k-75k',  'salaried',   '1'),
  ('user_demo_priya',  'Priya Patel',    null, 2, 'Sprout',  120,  '25k-50k',  'freelance',  '2'),
  ('user_demo_rahul',  'Rahul Kumar',    null, 1, 'Seed',    30,   '25k-50k',  'salaried',   '1'),
  ('user_demo_meera',  'Meera Iyer',     null, 4, 'Grove',   780,  '75k-1lac', 'salaried',   '1'),
  ('user_demo_vikram', 'Vikram Nair',    null, 2, 'Sprout',  155,  '50k-75k',  'self-employed','2')
ON CONFLICT (id) DO NOTHING;

-- ── Demo Financial Profiles ───────────────────────────────────────────────────
INSERT INTO financial_profiles (user_id, monthly_income, housing_expense, food_expense, transport_expense, utilities_expense, insurance_expense, entertainment_expense, other_expense)
VALUES
  ('user_demo_arjun',  65000, 18000, 8000, 4000, 2000, 3000, 5000, 3000),
  ('user_demo_priya',  38000, 10000, 6000, 3000, 1500, 2000, 4000, 2000),
  ('user_demo_meera',  92000, 25000, 10000, 5000, 3000, 5000, 8000, 4000),
  ('user_demo_vikram', 55000, 14000, 7000, 3500, 2000, 3000, 5000, 3500)
ON CONFLICT (user_id) DO NOTHING;

-- ── Demo Posts ────────────────────────────────────────────────────────────────
INSERT INTO posts (id, user_id, title, body, tags, upvotes, view_count, family_members)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'user_demo_arjun',
    'How to start SIP investment as a 25-year-old salaried employee?',
    'I just got my first job in Pune with a CTC of ₹7.5L. After taxes I take home ~₹55k. I have zero debt but also zero savings. My parents depend on me for ₹8k/month. Should I start with SIP in ELSS for the 80C benefit, or go with a simple index fund? Any guidance appreciated.',
    ARRAY['first-job', 'investing', 'tax'],
    12, 84,
    '[{"relation":"parents","count":2}]'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'user_demo_priya',
    'Freelancer with irregular income — how to build an emergency fund?',
    'I am a graphic designer earning between ₹25k–₹60k per month depending on projects. Some months are dry. I want to build a 6-month emergency fund but I don''t know how much to set aside given the irregular income. Should I use a liquid mutual fund or just keep it in a savings account?',
    ARRAY['freelance', 'emergency-fund', 'investing'],
    8, 52,
    '[]'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'user_demo_rahul',
    'Should I take a personal loan to prepay my credit card debt?',
    'I have ₹1.2L credit card outstanding at 42% annual interest. I got a personal loan offer at 14% for 24 months. Monthly EMI would be ~₹5,800. Current salary is ₹40k. Is this debt consolidation move smart or am I just moving the problem?',
    ARRAY['debt', 'salary'],
    19, 130,
    '[{"relation":"parents","count":2},{"relation":"sibling","count":1}]'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'user_demo_meera',
    'NPS vs PPF for retirement — which makes more sense for a 32-year-old?',
    'I am 32, working in Bengaluru, in the 30% tax bracket. I already max out 80C with ELSS + EPF. Should I use NPS for the extra ₹50k deduction under 80CCD(1B)? Or is the lock-in until 60 too restrictive? What''s your view on the equity/debt split within NPS?',
    ARRAY['retirement', 'tax', 'investing'],
    31, 210,
    '[{"relation":"spouse","count":1},{"relation":"children","count":1}]'
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'user_demo_vikram',
    'Term insurance — how much cover is enough for a self-employed person?',
    'I run a small IT services firm. My monthly income is ~₹55k but it varies. I have one dependent wife and we''re planning a child. I understand the rule of thumb is 10× annual income but since my income isn''t fixed, how do I calculate the right term cover? Also — which insurer has the highest claim settlement ratio currently?',
    ARRAY['insurance', 'freelance'],
    7, 45,
    '[{"relation":"spouse","count":1}]'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Demo Answers ──────────────────────────────────────────────────────────────
INSERT INTO answers (post_id, user_id, body, upvotes, is_verified)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'user_demo_meera',
    'Start with a 3-fund portfolio approach: 60% Nifty 50 Index (UTI or Mirae), 30% Nifty Next 50, 10% Overnight Fund for liquidity. For 80C, ELSS is great but check the 3-year lock-in is okay for you. Suggest starting with ₹5k/month SIP and increasing 10% each year (step-up SIP). Do NOT delay — compounding works best when you start young.',
    9, true
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'user_demo_vikram',
    'ELSS for the 80C dual benefit (tax + returns) makes sense for first year. After your emergency fund is built (3-6 months expenses), shift a portion to pure Nifty index funds for long-term compounding without lock-in.',
    5, false
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'user_demo_arjun',
    'For irregular income: calculate your lowest reliable monthly income (not average). Build emergency fund = 6 × lowest-month expenses. Use a liquid mutual fund (Parag Parikh Liquid Fund or HDFC Liquid) — better returns than savings account (5–6% vs 3.5%), instant redemption T+1. Set a standing instruction to invest any surplus above ₹30k into the liquid fund automatically.',
    11, false
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'user_demo_meera',
    'Yes, do the consolidation. 14% vs 42% is not even a question. You save ~₹28% annual interest. Use the personal loan, pay off card fully, and CUT THE CARD or reduce limit drastically. Then focus on clearing the personal loan. EMI of ₹5.8k on ₹40k salary is 14.5% of income — uncomfortable but manageable for 24 months.',
    16, true
  )
ON CONFLICT DO NOTHING;

-- ── Demo Savings Goals ────────────────────────────────────────────────────────
INSERT INTO savings_goals (user_id, name, category, target_amount, current_amount, monthly_contribution, is_completed)
VALUES
  ('user_demo_arjun',  'Emergency Fund',           'emergency',  200000, 45000,  8000,  false),
  ('user_demo_arjun',  'MacBook Pro for Work',     'other',       150000, 90000,  10000, false),
  ('user_demo_priya',  'Medical Emergency Buffer', 'medical',     100000, 12000,  4000,  false),
  ('user_demo_meera',  'Home Down Payment',        'home',        1500000,480000, 40000, false),
  ('user_demo_meera',  'Europe Vacation',          'vacation',    200000, 200000, 0,     true),
  ('user_demo_vikram', 'Business Equipment',       'business',    300000, 75000,  15000, false)
ON CONFLICT DO NOTHING;

-- ── Demo Comments ─────────────────────────────────────────────────────────────
INSERT INTO comments (post_id, user_id, body)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'user_demo_priya',  'This is super helpful! What app do you use to track SIP contributions?'),
  ('a0000000-0000-0000-0000-000000000001', 'user_demo_rahul',  'Also curious — is step-up SIP available from day one or do you need to call the AMC?'),
  ('a0000000-0000-0000-0000-000000000003', 'user_demo_priya',  'Went through this exact situation last year. Consolidation was 100% the right call for me.'),
  ('a0000000-0000-0000-0000-000000000004', 'user_demo_vikram', 'Does the 80CCD(1B) deduction apply even in the new tax regime?')
ON CONFLICT DO NOTHING;
