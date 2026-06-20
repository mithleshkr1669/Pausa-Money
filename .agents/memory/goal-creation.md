---
name: Goal creation architecture
description: How AI-triggered goal creation flows from chat to Supabase in Pausa app
---

## Rule
AI `create_goal` actions must use Supabase `createGoal()` (from `@/lib/goals`), NOT `apiPost("/api/goals")` which hits an in-memory backend store.

## How to apply
- `ChatPageV2` receives `userId?: string` and `onGoalCreated?: (goal: SavingsGoal) => void` props from Dashboard
- In `executeActions`, call `createGoal(userId, {...})` with proper field mapping:
  - AI field `targetAmount` → Supabase `target_amount`
  - AI field `deadline` → Supabase `target_date`  
  - AI category `"travel"` → Supabase `"vacation"` (see `AI_GOAL_CATEGORY_MAP`)
- Call `onGoalCreated(newGoal)` so Dashboard state (`goals`) updates immediately without refetch
- Dashboard passes `handleGoalCreated` as `onGoalCreated`

**Why:** The backend `/api/goals` route is an in-memory store used only for planning purposes — it doesn't connect to Supabase. The real goals data lives in Supabase `savings_goals` table.
