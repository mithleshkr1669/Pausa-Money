#!/usr/bin/env node
/**
 * Pausa — Credit Card Rewards Auto-Sync Cron Script
 *
 * PURPOSE:
 *   Fetches community-maintained reward rules from open-source GitHub repos,
 *   compares against current entries, and batch-updates the local rewards matrix.
 *
 * SETUP:
 *   1. npm install node-fetch (or use Node 18+ built-in fetch)
 *   2. Set PAUSA_API_KEY environment variable (your internal API key)
 *   3. Set PAUSA_API_URL (e.g. https://api.pausa.app or http://localhost:8080)
 *   4. Add to crontab: 0 2 * * 0 node sync-rewards.js  (every Sunday at 2am)
 *
 * COMMUNITY DATA SOURCES:
 *   - https://github.com/pausa-community/card-rewards (primary)
 *   - https://raw.githubusercontent.com/pausa-community/card-rewards/main/rewards.json
 */

const PAUSA_API_URL = process.env.PAUSA_API_URL ?? "http://localhost:8080";
const PAUSA_API_KEY = process.env.PAUSA_API_KEY ?? "";

// Community-maintained rewards GitHub raw URL
const COMMUNITY_REWARDS_URL =
  "https://raw.githubusercontent.com/pausa-community/card-rewards/main/rewards.json";

// ─── Step 1: Fetch community rewards ─────────────────────────────────────────
async function fetchCommunityRewards() {
  console.log("[sync] Fetching community rewards from GitHub...");
  try {
    const res = await fetch(COMMUNITY_REWARDS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[sync] Community repo not available, using local baseline:", err.message);
    // Return empty — no update will occur
    return null;
  }
}

// ─── Step 2: Compare with current local matrix ───────────────────────────────
function diffRewards(current, incoming) {
  if (!incoming) return { updates: [], additions: [] };
  const updates = [];
  const additions = [];

  for (const [merchant, cards] of Object.entries(incoming)) {
    const existing = current[merchant];
    if (!existing) {
      additions.push({ merchant, cards });
    } else {
      for (const card of cards) {
        const match = existing.find((c) => c.cardName === card.cardName);
        if (!match) {
          additions.push({ merchant, card });
        } else if (match.cashbackPercent !== card.cashbackPercent) {
          updates.push({
            merchant,
            cardName: card.cardName,
            old: match.cashbackPercent,
            new: card.cashbackPercent,
          });
        }
      }
    }
  }

  return { updates, additions };
}

// ─── Step 3: POST batch update to the sync endpoint ──────────────────────────
async function batchUpdate(updates, additions) {
  if (updates.length === 0 && additions.length === 0) {
    console.log("[sync] ✅ No changes detected — rewards matrix is current.");
    return;
  }

  console.log(`[sync] Detected ${updates.length} updates, ${additions.length} additions.`);

  const res = await fetch(`${PAUSA_API_URL}/api/v1/sync-rewards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": PAUSA_API_KEY,
    },
    body: JSON.stringify({ updates, additions, syncedAt: new Date().toISOString() }),
  });

  if (!res.ok) {
    throw new Error(`[sync] Sync endpoint returned HTTP ${res.status}`);
  }

  const result = await res.json();
  console.log("[sync] ✅ Sync complete:", result);
}

// ─── Current local baseline (mirrors rewards.ts) ─────────────────────────────
// In production, fetch this from your database or export from rewards.ts
const CURRENT_MATRIX = {
  swiggy: [
    { cardName: "Swiggy HDFC Bank", cashbackPercent: 10 },
    { cardName: "HDFC Regalia", cashbackPercent: 5 },
    { cardName: "AmEx Gold", cashbackPercent: 5 },
  ],
  amazon: [
    { cardName: "Amazon Pay ICICI", cashbackPercent: 5 },
    { cardName: "SBI SimplyCLICK", cashbackPercent: 10 },
    { cardName: "HDFC Regalia", cashbackPercent: 3.3 },
  ],
  // ... add all merchants from rewards.ts
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[sync] Starting Pausa rewards sync — ${new Date().toISOString()}`);

  const communityData = await fetchCommunityRewards();
  const { updates, additions } = diffRewards(CURRENT_MATRIX, communityData);
  await batchUpdate(updates, additions);

  console.log("[sync] Done.");
}

main().catch((err) => {
  console.error("[sync] FATAL:", err);
  process.exit(1);
});
