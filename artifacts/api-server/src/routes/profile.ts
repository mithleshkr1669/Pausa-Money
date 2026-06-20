import { Router, type IRouter } from "express";

const router: IRouter = Router();

const profileStore = new Map<string, Record<string, unknown>>();

/**
 * GET /profile — get profile for a session/user
 */
router.get("/profile", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const profile = profileStore.get(userId) || {};
  res.json({ profile });
});

/**
 * POST /profile — update profile fields
 */
router.post("/profile", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const updates = req.body as Record<string, unknown>;

  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Request body must be a JSON object" });
    return;
  }

  const allowed = [
    "name", "age", "occupation",
    "monthlyIncome", "monthlyExpenses",
    "goals", "riskTolerance",
  ];

  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key];
  }

  const existing = profileStore.get(userId) || {};
  const merged = { ...existing, ...filtered };
  merged.profileComplete = !!(merged.monthlyIncome && merged.monthlyExpenses);
  profileStore.set(userId, merged);

  res.json({ ok: true, profile: merged });
});

export default router;
