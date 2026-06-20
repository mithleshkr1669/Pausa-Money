---
name: Tab switching pattern
description: How AI-driven navigation works inside the Dashboard without route changes
---

## Rule
AI navigation actions must switch Dashboard tabs (via `setActiveItem`), NOT change wouter routes. Using `navigate("/analysis")` inside the Dashboard's ChatPageV2 takes the user OUT of the dashboard entirely.

## How to apply
- `ChatPageV2` accepts `onNavigate?: (tabId: string) => void`
- Dashboard passes `onNavigate={setActiveItem}` so tab IDs map directly: `"tools"` → `"tools"`, `"analysis"` → `"analysis"`, `"dashboard"` → `"overview"`
- `PAGE_TO_TAB` map in ChatV2.tsx handles all aliases
- `ChatPageV2` also needs `userId` (for Supabase goal creation) and `onGoalCreated` callback

**Why:** Dashboard uses `activeItem` state for tab routing inside a single mounted component. External route changes bypass this entirely and break the in-dashboard experience.
