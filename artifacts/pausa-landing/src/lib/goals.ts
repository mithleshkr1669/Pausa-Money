import { supabase, isSupabaseConfigured } from "./supabase";
import { upgradeRingTier, type RingTier } from "./community";

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
}

export const GOAL_CATEGORIES = [
  { value: "medical",     label: "Medical Emergency",    emoji: "🏥" },
  { value: "education",   label: "Education",            emoji: "📚" },
  { value: "home",        label: "Home Down Payment",    emoji: "🏠" },
  { value: "vehicle",     label: "Vehicle",              emoji: "🚗" },
  { value: "wedding",     label: "Wedding",              emoji: "💍" },
  { value: "vacation",    label: "Vacation",             emoji: "✈️" },
  { value: "business",    label: "Business",             emoji: "💼" },
  { value: "retirement",  label: "Retirement",           emoji: "🌅" },
  { value: "emergency",   label: "Emergency Fund",       emoji: "🛟" },
  { value: "other",       label: "Other",                emoji: "🎯" },
] as const;

export function getCategoryMeta(value: string) {
  return GOAL_CATEGORIES.find((c) => c.value === value) ?? GOAL_CATEGORIES[9];
}

export function monthsToGoal(target: number, current: number, monthly: number): number | null {
  if (monthly <= 0) return null;
  const remaining = target - current;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / monthly);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function getGoals(userId: string): Promise<SavingsGoal[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) console.error("[getGoals]", error.message);
  return (data as SavingsGoal[]) ?? [];
}

export async function createGoal(
  userId: string,
  goal: Omit<SavingsGoal, "id" | "user_id" | "is_completed" | "created_at">
): Promise<{ data: SavingsGoal | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { data: null, error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({ user_id: userId, ...goal, is_completed: false })
    .select()
    .single();
  if (error) { console.error("[createGoal]", error.message); return { data: null, error: error.message }; }
  return { data: data as SavingsGoal, error: null };
}

export async function updateGoalProgress(
  goalId: string,
  currentAmount: number,
  userId: string
): Promise<{ completed: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { completed: false, error: "Supabase not configured." };
  const { data: goal } = await supabase.from("savings_goals").select("target_amount").eq("id", goalId).single();
  const isCompleted = goal ? currentAmount >= goal.target_amount : false;
  const { error } = await supabase.from("savings_goals")
    .update({ current_amount: currentAmount, is_completed: isCompleted })
    .eq("id", goalId);
  if (error) return { completed: false, error: error.message };
  if (isCompleted) await checkMilestoneUpgrade(userId);
  return { completed: isCompleted, error: null };
}

export async function deleteGoal(goalId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("savings_goals").delete().eq("id", goalId);
}

// ── Milestone upgrade logic ───────────────────────────────────────────────────

export async function checkMilestoneUpgrade(userId: string): Promise<{ upgraded: boolean; newTier?: RingTier }> {
  if (!isSupabaseConfigured || !supabase) return { upgraded: false };
  const { data: profile } = await supabase.from("profiles").select("ring_tier").eq("id", userId).single();
  const currentTier = (profile?.ring_tier ?? 1) as RingTier;
  const { count: completedGoals } = await supabase
    .from("savings_goals").select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("is_completed", true);
  const { data: fp } = await supabase.from("financial_profiles").select("id").eq("user_id", userId).single();
  const hasFinancialProfile = !!fp;

  let targetTier = currentTier;
  if (currentTier < 2 && (completedGoals ?? 0) >= 1 && hasFinancialProfile) targetTier = 2;
  if (currentTier < 3 && (completedGoals ?? 0) >= 3) targetTier = 3;
  if (currentTier < 4 && (completedGoals ?? 0) >= 6) targetTier = 4;

  if (targetTier > currentTier) {
    await upgradeRingTier(userId, targetTier as RingTier);
    return { upgraded: true, newTier: targetTier as RingTier };
  }
  return { upgraded: false };
}
