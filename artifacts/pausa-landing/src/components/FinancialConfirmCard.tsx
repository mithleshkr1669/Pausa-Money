import { useState } from "react";
import {
  CheckCircle,
  Edit2,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { useCurrency, fmtCurrencyRaw } from "@/hooks/useCurrency";

export interface FinancialConfirmData {
  monthlyIncome: number | null;
  monthlyExpenses: number | null;
  source?: string;
  question?: string;
  breakdown?: Record<string, number>;
}

export interface TransactionItem {
  desc: string;
  amount: number;
  category?: string;
}

export interface TransactionConfirmData {
  period?: string;
  totalIncome: number;
  totalExpenses: number;
  incomeItems: TransactionItem[];
  expenseItems: TransactionItem[];
}

/* ------------------------------------------------------------------ */
/* Financial Confirm Card — confirm income / expenses                  */
/* ------------------------------------------------------------------ */
export function FinancialConfirmCard({
  data,
  onDone,
}: {
  data: FinancialConfirmData;
  onDone?: () => void;
}) {
  const { updateProfile } = useFinancialProfile();
  const { currency } = useCurrency();
  const [income, setIncome] = useState<string>(
    data.monthlyIncome?.toString() ?? "",
  );
  const [expenses, setExpenses] = useState<string>(
    data.monthlyExpenses?.toString() ?? "",
  );
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);

  const netSavings = (Number(income) || 0) - (Number(expenses) || 0);
  const savingsRate =
    Number(income) > 0 ? ((netSavings / Number(income)) * 100).toFixed(0) : "0";

  const handleConfirm = () => {
    updateProfile({
      monthlyIncome: Number(income) || null,
      monthlyExpenses: Number(expenses) || null,
    });
    setConfirmed(true);
    setEditing(false);
    onDone?.();
  };

  if (confirmed) {
    return (
      <div
        className="my-3 flex items-center gap-2 text-xs text-primary px-4 py-2 rounded-xl"
        style={{
          background: "rgba(0,245,212,0.06)",
          border: "1px solid rgba(0,245,212,0.15)",
        }}
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          Financial profile updated — I'll use these numbers for all my advice.
        </span>
      </div>
    );
  }

  return (
    <div
      className="my-3 rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(0,245,212,0.2)",
        background: "rgba(0,10,8,0.6)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background: "rgba(0,245,212,0.06)",
          borderBottom: "1px solid rgba(0,245,212,0.12)",
        }}
      >
        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
        <div>
          <p className="text-xs font-semibold text-primary">
            Confirm Your Financial Data
          </p>
          {data.source && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {data.source}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.question && (
          <p className="text-xs text-muted-foreground italic">
            {data.question}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Income */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Monthly Income
            </label>
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-primary text-sm font-bold">
                {currency.symbol}
              </span>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground min-w-0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              Monthly Expenses
            </label>
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-primary text-sm font-bold">
                {currency.symbol}
              </span>
              <input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground min-w-0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Net summary */}
        {income && expenses && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span className="text-muted-foreground">Monthly savings</span>
            <span
              className={`font-semibold ${netSavings >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {currency.symbol}
              {Math.abs(netSavings).toLocaleString()} ({savingsRate}%)
            </span>
          </div>
        )}

        {/* Breakdown */}
        {data.breakdown && Object.keys(data.breakdown).length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Breakdown
            </p>
            {Object.entries(data.breakdown).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between text-xs px-2 py-1 rounded-md"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <span className="text-muted-foreground capitalize">{k}</span>
                <span className="font-medium text-foreground">
                  {fmtCurrencyRaw(v, currency)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #00f5d4, #40e0ff)",
              color: "#0a0a0a",
            }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Confirm & Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transaction Confirm Card — review categorized transactions          */
/* ------------------------------------------------------------------ */
export function TransactionConfirmCard({
  data,
  onConfirmAndAnalyze,
}: {
  data: TransactionConfirmData;
  onConfirmAndAnalyze?: (summary: string) => void;
}) {
  const { currency } = useCurrency();
  const { updateProfile } = useFinancialProfile();
  const [expenseItems, setExpenseItems] = useState<TransactionItem[]>(
    data.expenseItems,
  );
  const [incomeItems] = useState<TransactionItem[]>(data.incomeItems);
  const [confirmed, setConfirmed] = useState(false);

  const totalInc = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExp = expenseItems.reduce((s, i) => s + i.amount, 0);
  const net = totalInc - totalExp;

  const CATEGORIES = [
    "Food",
    "Transport",
    "Housing",
    "Entertainment",
    "Healthcare",
    "Shopping",
    "Utilities",
    "Other",
  ];

  const updateCategory = (idx: number, cat: string) => {
    setExpenseItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, category: cat } : item)),
    );
  };

  const handleConfirm = () => {
    updateProfile({
      monthlyIncome: totalInc || null,
      monthlyExpenses: totalExp || null,
    });
    setConfirmed(true);
    if (onConfirmAndAnalyze) {
      const breakdown = expenseItems.reduce<Record<string, number>>(
        (acc, item) => {
          const cat = item.category || "Other";
          acc[cat] = (acc[cat] || 0) + item.amount;
          return acc;
        },
        {},
      );
      const summary = `Confirmed transaction data for ${data.period || "this period"}:
- Total income: ${currency.symbol}${totalInc.toLocaleString()} (${incomeItems.map((i) => `${i.desc}: ${currency.symbol}${i.amount}`).join(", ")})
- Total expenses: ${currency.symbol}${totalExp.toLocaleString()}
- Category breakdown: ${Object.entries(breakdown)
        .map(([k, v]) => `${k}: ${currency.symbol}${v}`)
        .join(", ")}
- Net savings: ${currency.symbol}${net.toLocaleString()}
Please provide a detailed financial analysis and recommendations based on these confirmed numbers.`;
      onConfirmAndAnalyze(summary);
    }
  };

  if (confirmed) {
    return (
      <div
        className="my-3 flex items-center gap-2 text-xs text-primary px-4 py-2 rounded-xl"
        style={{
          background: "rgba(0,245,212,0.06)",
          border: "1px solid rgba(0,245,212,0.15)",
        }}
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Transactions confirmed — analyzing your data now...</span>
      </div>
    );
  }

  return (
    <div
      className="my-3 rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(64,224,255,0.2)",
        background: "rgba(0,10,18,0.6)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "rgba(64,224,255,0.06)",
          borderBottom: "1px solid rgba(64,224,255,0.12)",
        }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-sky-400">
              Review Transaction Categories
            </p>
            {data.period && (
              <p className="text-[11px] text-muted-foreground">{data.period}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400 font-semibold">
            {currency.symbol}
            {totalInc.toLocaleString()} in
          </span>
          <span className="text-red-400 font-semibold">
            {currency.symbol}
            {totalExp.toLocaleString()} out
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
        {/* Income */}
        {incomeItems.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              Income
            </p>
            <div className="space-y-1">
              {incomeItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(52,211,153,0.04)",
                    border: "1px solid rgba(52,211,153,0.08)",
                  }}
                >
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {item.desc}
                  </span>
                  <span className="font-semibold text-emerald-400 shrink-0 ml-2">
                    {currency.symbol}
                    {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses */}
        {expenseItems.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1.5">
              Expenses — verify categories
            </p>
            <div className="space-y-1">
              {expenseItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(248,113,113,0.04)",
                    border: "1px solid rgba(248,113,113,0.08)",
                  }}
                >
                  <span className="text-muted-foreground truncate flex-1">
                    {item.desc}
                  </span>
                  <select
                    value={item.category || "Other"}
                    onChange={(e) => updateCategory(i, e.target.value)}
                    className="text-[10px] rounded px-1.5 py-0.5 bg-white/[0.05] border border-white/[0.08] text-foreground outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option
                        key={c}
                        value={c}
                        style={{ background: "#1a1a1a" }}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="font-semibold text-red-400 shrink-0">
                    {currency.symbol}
                    {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Net */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span className="text-muted-foreground font-medium">
            Net savings this period
          </span>
          <span
            className={`font-bold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {net >= 0 ? "+" : ""}
            {currency.symbol}
            {Math.abs(net).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #40e0ff, #00f5d4)",
            color: "#0a0a0a",
          }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Confirm Categories & Get Analysis
        </button>
      </div>
    </div>
  );
}
