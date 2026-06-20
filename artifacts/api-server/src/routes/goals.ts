import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";

const router: IRouter = Router();

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline?: string;
  createdAt: string;
}

const goalsStore = new Map<string, Goal[]>();

/**
 * GET /goals — list goals
 */
router.get("/goals", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const goals = goalsStore.get(userId) || [];
  res.json({ goals });
});

/**
 * POST /goals — create a new goal
 */
router.post("/goals", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const { name, targetAmount, category, deadline, currentAmount } = req.body as {
    name?: string;
    targetAmount?: number;
    category?: string;
    deadline?: string;
    currentAmount?: number;
  };

  if (!name || !targetAmount) {
    res.status(400).json({ error: "name and targetAmount are required" });
    return;
  }

  const goal: Goal = {
    id: randomUUID(),
    name,
    targetAmount: Number(targetAmount),
    currentAmount: Number(currentAmount || 0),
    category: category || "other",
    deadline,
    createdAt: new Date().toISOString(),
  };

  const existing = goalsStore.get(userId) || [];
  existing.push(goal);
  goalsStore.set(userId, existing);

  res.json({ ok: true, goal });
});

/**
 * PATCH /goals/:id — update goal progress
 */
router.patch("/goals/:id", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const { id } = req.params;
  const goals = goalsStore.get(userId) || [];
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  const updates = req.body as Partial<Goal>;
  goals[idx] = { ...goals[idx], ...updates, id };
  goalsStore.set(userId, goals);
  res.json({ ok: true, goal: goals[idx] });
});

/**
 * DELETE /goals/:id — delete a goal
 */
router.delete("/goals/:id", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const { id } = req.params;
  const goals = goalsStore.get(userId) || [];
  const filtered = goals.filter((g) => g.id !== id);
  goalsStore.set(userId, filtered);
  res.json({ ok: true });
});

export default router;
