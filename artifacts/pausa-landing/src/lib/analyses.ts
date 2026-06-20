import { supabase, isSupabaseConfigured } from "./supabase";

export interface StoredTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  needType: "need" | "want" | "saving";
}

export interface StoredAnalysis {
  id: string;
  user_id: string;
  month_label: string;
  period_start?: string;
  period_end?: string;
  total_income: number;
  total_expense: number;
  transactions: StoredTransaction[];
  source_file?: string;
  confirmed: boolean;
  created_at: string;
}

const LS_KEY = "pausa_analyses_v2";
const MAX_MONTHS = 2;

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsLoad(): StoredAnalysis[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as StoredAnalysis[];
  } catch {
    return [];
  }
}

function lsSave(items: StoredAnalysis[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function listAnalyses(userId: string | null): Promise<StoredAnalysis[]> {
  if (isSupabaseConfigured && supabase && userId) {
    const { data, error } = await supabase
      .from("financial_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_MONTHS);
    if (!error && data) return data as StoredAnalysis[];
  }
  // fallback: localStorage (sorted newest first, max 2)
  return lsLoad().slice(0, MAX_MONTHS);
}

export async function saveAnalysis(
  userId: string | null,
  analysis: Omit<StoredAnalysis, "id" | "created_at">
): Promise<StoredAnalysis | null> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const record: StoredAnalysis = { ...analysis, id, created_at };

  if (isSupabaseConfigured && supabase && userId) {
    // Enforce MAX_MONTHS: delete oldest if already at limit
    const { data: existing } = await supabase
      .from("financial_analyses")
      .select("id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (existing && existing.length >= MAX_MONTHS) {
      const toDelete = existing.slice(0, existing.length - MAX_MONTHS + 1);
      await supabase.from("financial_analyses").delete().in("id", toDelete.map((r: { id: string }) => r.id));
    }

    const { data, error } = await supabase
      .from("financial_analyses")
      .insert({ ...record, user_id: userId })
      .select()
      .single();

    if (!error && data) return data as StoredAnalysis;
  }

  // localStorage fallback
  const all = lsLoad();
  const updated = [record, ...all].slice(0, MAX_MONTHS);
  lsSave(updated);
  return record;
}

export async function confirmAnalysis(
  userId: string | null,
  analysisId: string
): Promise<void> {
  if (isSupabaseConfigured && supabase && userId) {
    await supabase
      .from("financial_analyses")
      .update({ confirmed: true })
      .eq("id", analysisId)
      .eq("user_id", userId);
  }
  // update localStorage too
  const all = lsLoad();
  const updated = all.map((a) => a.id === analysisId ? { ...a, confirmed: true } : a);
  lsSave(updated);
}

export async function deleteAnalysis(
  userId: string | null,
  analysisId: string
): Promise<void> {
  if (isSupabaseConfigured && supabase && userId) {
    await supabase.from("financial_analyses").delete().eq("id", analysisId);
  }
  const all = lsLoad();
  lsSave(all.filter((a) => a.id !== analysisId));
}

// ── Comparison helpers ────────────────────────────────────────────────────────

export interface MonthComparison {
  months: [StoredAnalysis, StoredAnalysis];
  incomeDelta: number;
  expenseDelta: number;
  savingsDelta: number;
  incomeGrowth: number;  // %
  expenseGrowth: number; // %
  categoryChanges: {
    category: string;
    prev: number;
    curr: number;
    delta: number;
    deltaPercent: number;
  }[];
  improvements: string[];
  concerns: string[];
}

function sumByCategory(txns: StoredTransaction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of txns) {
    if (t.amount < 0) {
      const cat = t.category || "Other";
      out[cat] = (out[cat] ?? 0) + Math.abs(t.amount);
    }
  }
  return out;
}

export function compareMonths(prev: StoredAnalysis, curr: StoredAnalysis): MonthComparison {
  const incomeDelta = curr.total_income - prev.total_income;
  const expenseDelta = curr.total_expense - prev.total_expense;
  const prevSavings = prev.total_income - prev.total_expense;
  const currSavings = curr.total_income - curr.total_expense;
  const savingsDelta = currSavings - prevSavings;

  const pct = (a: number, b: number) => b > 0 ? ((a - b) / b) * 100 : 0;

  const prevCats = sumByCategory(prev.transactions);
  const currCats = sumByCategory(curr.transactions);
  const allCats = Array.from(new Set([...Object.keys(prevCats), ...Object.keys(currCats)]));

  const categoryChanges = allCats.map((cat) => {
    const p = prevCats[cat] ?? 0;
    const c = currCats[cat] ?? 0;
    return { category: cat, prev: p, curr: c, delta: c - p, deltaPercent: pct(c, p) };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const improvements: string[] = [];
  const concerns: string[] = [];

  if (savingsDelta > 0) improvements.push(`Savings improved by ₹${savingsDelta.toLocaleString("en-IN")}/month 🎉`);
  if (expenseDelta < 0) improvements.push(`Total expenses down by ₹${Math.abs(expenseDelta).toLocaleString("en-IN")} vs last month`);
  if (incomeDelta > 0) improvements.push(`Income grew by ₹${incomeDelta.toLocaleString("en-IN")}`);

  for (const ch of categoryChanges.slice(0, 3)) {
    if (ch.delta > 2000 && ch.deltaPercent > 15) {
      concerns.push(`${ch.category} spending jumped ₹${ch.delta.toLocaleString("en-IN")} (+${ch.deltaPercent.toFixed(0)}%) vs last month`);
    }
    if (ch.delta < -2000 && ch.deltaPercent < -15) {
      improvements.push(`${ch.category} spending reduced ₹${Math.abs(ch.delta).toLocaleString("en-IN")} (${ch.deltaPercent.toFixed(0)}%)`);
    }
  }

  if (expenseDelta > 5000) concerns.push(`Total expenses increased ₹${expenseDelta.toLocaleString("en-IN")} — review discretionary spends`);
  if (currSavings < 0) concerns.push("You're spending more than you earn this month — immediate action needed");
  if (currSavings / curr.total_income < 0.1 && curr.total_income > 0)
    concerns.push("Savings rate below 10% — target at least 20% of income");

  return {
    months: [prev, curr],
    incomeDelta,
    expenseDelta,
    savingsDelta,
    incomeGrowth: pct(curr.total_income, prev.total_income),
    expenseGrowth: pct(curr.total_expense, prev.total_expense),
    categoryChanges,
    improvements,
    concerns,
  };
}

// ── AI summary for chat context ────────────────────────────────────────────────

export function getAnalysisSummaryForAI(analyses: StoredAnalysis[]): string {
  if (analyses.length === 0) return "";
  const lines: string[] = ["## Bank Statement Data on File"];
  for (const a of analyses) {
    lines.push(`### ${a.month_label}`);
    lines.push(`- Income: ₹${a.total_income.toLocaleString("en-IN")}`);
    lines.push(`- Expenses: ₹${a.total_expense.toLocaleString("en-IN")}`);
    lines.push(`- Net Savings: ₹${(a.total_income - a.total_expense).toLocaleString("en-IN")}`);
    const cats = sumByCategory(a.transactions);
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (top.length) lines.push(`- Top categories: ${top.map(([k, v]) => `${k} ₹${v.toLocaleString("en-IN")}`).join(", ")}`);
  }
  if (analyses.length === 2) {
    const cmp = compareMonths(analyses[1], analyses[0]);
    lines.push("### Month-over-Month");
    if (cmp.improvements.length) lines.push("Improvements: " + cmp.improvements.join("; "));
    if (cmp.concerns.length) lines.push("Concerns: " + cmp.concerns.join("; "));
  }
  return lines.join("\n");
}
