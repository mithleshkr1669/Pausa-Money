import { supabase, isSupabaseConfigured } from "./supabase";

export interface FinancialProfile {
  id?: string;
  user_id: string;
  monthly_income: number;
  housing_expense: number;
  food_expense: number;
  transport_expense: number;
  utilities_expense: number;
  insurance_expense: number;
  entertainment_expense: number;
  other_expense: number;
  updated_at?: string;
}

export interface FinancialAnalysis {
  totalExpenses: number;
  totalNeeds: number;
  totalWants: number;
  currentSavings: number;
  savingsRate: number;
  needsPercent: number;
  wantsPercent: number;
  status: "critical" | "tight" | "fair" | "good" | "excellent";
  statusLabel: string;
  statusColor: string;
  recommendations: string[];
  monthlyToSave: number;
  targetSavingsRate: number;
}

export function analyzeFinances(fp: FinancialProfile): FinancialAnalysis {
  const income = fp.monthly_income;
  const needs = fp.housing_expense + fp.food_expense + fp.transport_expense + fp.utilities_expense + fp.insurance_expense;
  const wants = fp.entertainment_expense + fp.other_expense;
  const total = needs + wants;
  const savings = income - total;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const needsPct = income > 0 ? (needs / income) * 100 : 0;
  const wantsPct = income > 0 ? (wants / income) * 100 : 0;
  const idealSavings = income * 0.20;

  let status: FinancialAnalysis["status"] = "fair";
  let statusLabel = "Fair";
  let statusColor = "#e0a040";

  if (savings < 0) { status = "critical"; statusLabel = "Critical — Overspending"; statusColor = "#e05050"; }
  else if (savingsRate < 5) { status = "tight"; statusLabel = "Tight — Low Savings"; statusColor = "#e07050"; }
  else if (savingsRate < 15) { status = "fair"; statusLabel = "Fair — Build Cushion"; statusColor = "#e0a040"; }
  else if (savingsRate < 25) { status = "good"; statusLabel = "Good — On Track"; statusColor = "#7eb8e0"; }
  else { status = "excellent"; statusLabel = "Excellent — Growing Wealth"; statusColor = "#00E5CC"; }

  const recs: string[] = [];
  if (savings < 0) recs.push(`You're spending ₹${Math.abs(savings).toLocaleString("en-IN")} more than you earn. Cut wants first.`);
  if (needsPct > 60) recs.push(`Needs at ${needsPct.toFixed(0)}% of income. Aim below 50% — consider cheaper housing or commute.`);
  if (wantsPct > 30) recs.push(`Wants at ${wantsPct.toFixed(0)}% — cap at 30%. Review subscriptions and dining.`);
  if (savingsRate < 20 && savings >= 0) recs.push(`Target ₹${Math.round(idealSavings).toLocaleString("en-IN")}/month saved (20%). You're at ₹${savings.toLocaleString("en-IN")}.`);
  if (fp.insurance_expense === 0) recs.push("No insurance expense found. Ensure you have term insurance (10× annual income).");
  if (savingsRate >= 20) recs.push("Invest via SIP in ELSS for tax savings (80C limit ₹1.5L/year).");
  if (savingsRate >= 20) recs.push("Build 6-month emergency fund (₹" + (total * 6).toLocaleString("en-IN") + " target) in liquid funds.");
  if (recs.length === 0) recs.push("Your finances look healthy! Consider NPS for additional 80CCD(1B) deduction of ₹50,000.");

  return {
    totalExpenses: total,
    totalNeeds: needs,
    totalWants: wants,
    currentSavings: savings,
    savingsRate,
    needsPercent: needsPct,
    wantsPercent: wantsPct,
    status,
    statusLabel,
    statusColor,
    recommendations: recs,
    monthlyToSave: Math.max(0, idealSavings - savings),
    targetSavingsRate: 20,
  };
}

// ── Supabase persistence ──────────────────────────────────────────────────────

export async function getFinancialProfile(userId: string): Promise<FinancialProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.from("financial_profiles").select("*").eq("user_id", userId).single();
  return data as FinancialProfile | null;
}

export async function saveFinancialProfile(fp: FinancialProfile): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { error: "Supabase not configured." };
  const { error } = await supabase.from("financial_profiles").upsert(
    { ...fp, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) { console.error("[saveFinancialProfile]", error.message); return { error: error.message }; }
  return { error: null };
}
