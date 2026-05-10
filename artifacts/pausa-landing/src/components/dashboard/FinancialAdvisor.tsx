import { useState } from "react";
import { motion } from "framer-motion";
import { Save, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { analyzeFinances, saveFinancialProfile, type FinancialProfile } from "@/lib/financial";

const EXPENSE_FIELDS: { key: keyof FinancialProfile; label: string; category: "need" | "want" }[] = [
  { key: "housing_expense",      label: "Housing / Rent",      category: "need" },
  { key: "food_expense",         label: "Food & Groceries",    category: "need" },
  { key: "transport_expense",    label: "Transport / Petrol",  category: "need" },
  { key: "utilities_expense",    label: "Utilities / Bills",   category: "need" },
  { key: "insurance_expense",    label: "Insurance",           category: "need" },
  { key: "entertainment_expense",label: "Entertainment",       category: "want" },
  { key: "other_expense",        label: "Other",               category: "want" },
];

function FieldInput({ label, value, onChange, category }: { label: string; value: number; onChange: (v: number) => void; category: "need" | "want" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-1.5 h-4 rounded-full shrink-0 ${category === "need" ? "bg-blue-400/60" : "bg-purple-400/60"}`} />
        <label className="text-sm text-muted-foreground truncate">{label}</label>
      </div>
      <div className="relative shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">₹</span>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="w-32 bg-background border border-white/8 rounded-lg pl-7 pr-3 py-1.5 text-sm font-mono text-right text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>
    </div>
  );
}

export function FinancialAdvisor({ userId, initialProfile, onSaved }: {
  userId: string;
  initialProfile?: Partial<FinancialProfile> | null;
  onSaved?: () => void;
}) {
  const [fp, setFp] = useState<FinancialProfile>({
    user_id: userId,
    monthly_income: initialProfile?.monthly_income ?? 0,
    housing_expense: initialProfile?.housing_expense ?? 0,
    food_expense: initialProfile?.food_expense ?? 0,
    transport_expense: initialProfile?.transport_expense ?? 0,
    utilities_expense: initialProfile?.utilities_expense ?? 0,
    insurance_expense: initialProfile?.insurance_expense ?? 0,
    entertainment_expense: initialProfile?.entertainment_expense ?? 0,
    other_expense: initialProfile?.other_expense ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const set = (key: keyof FinancialProfile, val: number) => setFp((p) => ({ ...p, [key]: val }));

  const analysis = fp.monthly_income > 0 ? analyzeFinances(fp) : null;

  const handleSave = async () => {
    if (fp.monthly_income === 0) { setError("Please enter your monthly income first."); return; }
    setSaving(true); setError("");
    const { error: err } = await saveFinancialProfile(fp);
    setSaving(false);
    if (err) { setError(err); return; }
    setSaved(true);
    setShowAnalysis(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 3000);
  };

  const STATUS_ICONS = { critical: "🚨", tight: "⚠️", fair: "📊", good: "✅", excellent: "🏆" };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Financial Advisor</h3>
          <p className="text-xs text-muted-foreground">Enter your monthly numbers — we'll tell you what to do next.</p>
        </div>
        <TrendingUp className="w-5 h-5 text-primary shrink-0" />
      </div>

      {/* Income */}
      <div className="mb-5 pb-5 border-b border-white/5">
        <label className="block text-sm font-semibold text-foreground mb-2">Monthly Income (take-home)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">₹</span>
          <input
            type="number"
            value={fp.monthly_income || ""}
            onChange={(e) => set("monthly_income", parseInt(e.target.value) || 0)}
            placeholder="e.g. 75000"
            className="w-full bg-background border border-white/8 rounded-xl pl-9 pr-4 py-3 text-base font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Expenses */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs font-semibold text-foreground">Monthly Expenses</p>
          <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded font-mono">needs</span>
          <span className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded font-mono">wants</span>
        </div>
        <div className="space-y-3">
          {EXPENSE_FIELDS.map(({ key, label, category }) => (
            <FieldInput key={key} label={label} value={(fp[key] as number) ?? 0} onChange={(v) => set(key, v)} category={category} />
          ))}
        </div>
      </div>

      {/* Live summary */}
      {analysis && (
        <div className="mb-5 p-4 rounded-xl border border-white/5 bg-background/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{STATUS_ICONS[analysis.status]} {analysis.statusLabel}</span>
            <span className="text-xs font-mono font-bold" style={{ color: analysis.statusColor }}>
              {analysis.savingsRate.toFixed(0)}% saved
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs mb-3">
            <div className="p-2 rounded-lg bg-blue-500/8 border border-blue-500/15">
              <p className="text-muted-foreground mb-0.5">Needs</p>
              <p className="font-bold text-blue-400">{analysis.needsPercent.toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/8 border border-purple-500/15">
              <p className="text-muted-foreground mb-0.5">Wants</p>
              <p className="font-bold text-purple-400">{analysis.wantsPercent.toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/8 border border-primary/15">
              <p className="text-muted-foreground mb-0.5">Savings</p>
              <p className="font-bold text-primary">{analysis.savingsRate.toFixed(0)}%</p>
            </div>
          </div>
          <div className="space-y-2">
            {analysis.recommendations.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0">→</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save & Analyze"}
      </button>
    </div>
  );
}
