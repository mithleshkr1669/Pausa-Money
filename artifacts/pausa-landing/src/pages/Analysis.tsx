import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  Trash2,
  Edit2,
  Check,
  X,
  PieChart as PieIcon,
  List,
  RefreshCcw,
  TrendingUp,
  Plus,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useFinancialAnalysis,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  inferNeedType,
} from "@/hooks/useFinancialAnalysis";
import type {
  Transaction,
  MonthlyAnalysis,
  NeedType,
} from "@/hooks/useFinancialAnalysis";
import { useCurrency, fmtCurrency, fmtCurrencyRaw } from "@/hooks/useCurrency";
import { Link } from "wouter";

const PALETTE = [
  "#00f5d4",
  "#40e0ff",
  "#a78bfa",
  "#f59e0b",
  "#34d399",
  "#f87171",
  "#60a5fa",
  "#fb923c",
  "#e879f9",
];
const TOOLTIP_STYLE = {
  background: "#000",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 8,
  fontSize: 11,
  color: "#fff",
};
const TOOLTIP_LABEL = { color: "#fff", fontWeight: 600 };
const TOOLTIP_ITEM = { color: "#fff" };

const NEED_TYPE_LABELS: Record<NeedType, { label: string; color: string }> = {
  need: { label: "Need", color: "rgba(0,245,212,0.15)" },
  want: { label: "Want", color: "rgba(96,165,250,0.15)" },
  unwanted: { label: "Unwanted", color: "rgba(248,113,113,0.15)" },
  subscription: { label: "Subscription", color: "rgba(167,139,250,0.15)" },
  income: { label: "Income", color: "rgba(52,211,153,0.15)" },
};

const NEED_TYPE_TEXT: Record<NeedType, string> = {
  need: "text-primary",
  want: "text-blue-400",
  unwanted: "text-red-400",
  subscription: "text-purple-400",
  income: "text-emerald-400",
};

type Tab = "overview" | "transactions" | "subscriptions" | "compare";

/* ------------------------------------------------------------------ */
/* Empty State                                                         */
/* ------------------------------------------------------------------ */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-5 py-20">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
        style={{
          background: "rgba(0,245,212,0.08)",
          border: "1px solid rgba(0,245,212,0.15)",
        }}
      >
        <PieIcon className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold font-lora mb-2">
          No Analysis Yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Upload a bank statement or transaction list in Chat. The AI will
          extract, categorize, and save it here automatically.
        </p>
      </div>
      <Link href="/">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "linear-gradient(135deg,#00f5d4,#40e0ff)",
            color: "#0a0a0a",
          }}
        >
          <Plus className="w-4 h-4" />
          Go to Chat & Upload Statement
        </button>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Smart Recommendations                                               */
/* ------------------------------------------------------------------ */
function computeRecommendations(a: MonthlyAnalysis, sym: string) {
  const recs = [];
  const net = a.totalIncome - a.totalExpenses;
  const wants = a.transactions
    .filter((t) => t.needType === "want")
    .reduce((s, t) => s + t.amount, 0);
  const subs = a.transactions
    .filter((t) => t.needType === "subscription")
    .reduce((s, t) => s + t.amount, 0);
  const unwanted = a.transactions
    .filter((t) => t.needType === "unwanted")
    .reduce((s, t) => s + t.amount, 0);
  const wantPct =
    a.totalExpenses > 0 ? ((wants / a.totalExpenses) * 100).toFixed(0) : 0;

  if (net < 0)
    recs.push({
      icon: "⚠️",
      title: "Spending Exceeds Income",
      desc: `You spent ${sym}${Math.abs(net).toLocaleString()} more than you earned. Cut wants by reducing dining out and entertainment.`,
      type: "critical",
    });
  else
    recs.push({
      icon: "📈",
      title: "Invest Your Surplus",
      desc: `${sym}${net.toLocaleString()} monthly surplus invested at 12% for 10 years → ${sym}${Math.round(net * 12 * 17.5).toLocaleString()}.`,
      type: "success",
    });

  if (subs > 0)
    recs.push({
      icon: "🔄",
      title: "Review Subscriptions",
      desc: `${sym}${subs.toLocaleString()}/month (${sym}${(subs * 12).toLocaleString()}/year) on subscriptions. Cancel unused ones.`,
      type: "warning",
    });

  if (Number(wantPct) > 40)
    recs.push({
      icon: "💡",
      title: "Wants Are High",
      desc: `Wants are ${wantPct}% of spending. The 50/30/20 rule suggests keeping wants under 30%. Save ${sym}${Math.round(wants * 0.2).toLocaleString()} by cutting back.`,
      type: "info",
    });

  if (unwanted > 0)
    recs.push({
      icon: "🎯",
      title: "Eliminate Impulse Spending",
      desc: `${sym}${unwanted.toLocaleString()}/month on marked unwanted spending = ${sym}${(unwanted * 12).toLocaleString()}/year wasted. Redirect to SIP.`,
      type: "warning",
    });

  if (net > 0 && a.totalIncome > 0) {
    const sr = ((net / a.totalIncome) * 100).toFixed(0);
    if (Number(sr) < 20)
      recs.push({
        icon: "💰",
        title: "Boost Your Savings Rate",
        desc: `You're saving ${sr}% — target is 20%. Saving ${sym}${Math.round(a.totalIncome * 0.2).toLocaleString()}/month doubles your wealth-building speed.`,
        type: "info",
      });
  }

  return recs;
}

/* ------------------------------------------------------------------ */
/* Overview Tab                                                        */
/* ------------------------------------------------------------------ */
function OverviewTab({ analysis }: { analysis: MonthlyAnalysis }) {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);
  const sym = currency.symbol;

  const needsTotal = analysis.transactions
    .filter((t) => t.needType === "need")
    .reduce((s, t) => s + t.amount, 0);
  const wantsTotal = analysis.transactions
    .filter((t) => t.needType === "want")
    .reduce((s, t) => s + t.amount, 0);
  const subTotal = analysis.transactions
    .filter((t) => t.needType === "subscription")
    .reduce((s, t) => s + t.amount, 0);
  const unwantedTotal = analysis.transactions
    .filter((t) => t.needType === "unwanted")
    .reduce((s, t) => s + t.amount, 0);

  const pieData = [
    { name: "Needs", value: needsTotal },
    { name: "Wants", value: wantsTotal },
    { name: "Subscriptions", value: subTotal },
    { name: "Unwanted", value: unwantedTotal },
  ].filter((d) => d.value > 0);

  const catData = useMemo(() => {
    const byCategory = analysis.transactions
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {});
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [analysis]);

  const recs = computeRecommendations(analysis, sym);

  const PIE_COLORS = ["#00f5d4", "#60a5fa", "#a78bfa", "#f87171"];

  return (
    <div className="space-y-6">
      {/* Needs vs Wants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Needs vs Wants vs Subscriptions
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={32}
                paddingAngle={3}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmt(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#888" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { label: "Needs", value: needsTotal, color: "text-primary" },
              { label: "Wants", value: wantsTotal, color: "text-blue-400" },
              {
                label: "Subscriptions",
                value: subTotal,
                color: "text-purple-400",
              },
              {
                label: "Unwanted",
                value: unwantedTotal,
                color: "text-red-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-2 py-1 rounded text-xs"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-semibold ${item.color}`}>
                  {fmtCurrencyRaw(item.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Top Spending Categories
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={catData}
              layout="vertical"
              margin={{ top: 0, right: 8, bottom: 0, left: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={fmt}
                tick={{ fill: "#555", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#aaa", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => fmt(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {catData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          💡 What You Can Do With Your Money
        </p>
        <div className="space-y-2">
          {recs.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background:
                  r.type === "critical"
                    ? "rgba(248,113,113,0.06)"
                    : r.type === "success"
                      ? "rgba(52,211,153,0.06)"
                      : r.type === "warning"
                        ? "rgba(245,158,11,0.06)"
                        : "rgba(255,255,255,0.03)",
                border: `1px solid ${r.type === "critical" ? "rgba(248,113,113,0.15)" : r.type === "success" ? "rgba(52,211,153,0.15)" : r.type === "warning" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span className="text-base shrink-0">{r.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {r.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transactions Tab                                                    */
/* ------------------------------------------------------------------ */
function TransactionsTab({
  analysis,
  analysisId,
}: {
  analysis: MonthlyAnalysis;
  analysisId: string;
}) {
  const { currency } = useCurrency();
  const { updateTransaction, deleteTransaction } = useFinancialAnalysis();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [filter, setFilter] = useState<"all" | NeedType>("all");

  const filtered =
    filter === "all"
      ? analysis.transactions
      : analysis.transactions.filter((t) => t.needType === filter);

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditDesc(tx.description);
    setEditAmount(tx.amount.toString());
  };

  const saveEdit = (txId: string) => {
    updateTransaction(analysisId, txId, {
      description: editDesc,
      amount: Number(editAmount) || 0,
    });
    setEditingId(null);
  };

  const allCats =
    analysis.transactions[0]?.type === "income"
      ? [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
      : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(
          ["all", "income", "need", "want", "unwanted", "subscription"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${filter === f ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground border border-white/[0.07] hover:border-white/20"}`}
          >
            {f === "all" ? "All" : NEED_TYPE_LABELS[f as NeedType]?.label || f}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                Description
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-28">
                Amount
              </th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-36">
                Category
              </th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-28">
                Type
              </th>
              <th className="w-20 px-3 py-2.5 font-medium text-muted-foreground text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx, i) => (
              <tr
                key={tx.id}
                className="border-b border-white/4 hover:bg-white/2 transition-colors"
              >
                <td className="px-4 py-2.5">
                  {editingId === tx.id ? (
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-white/6 border border-white/10 rounded px-2 py-1 outline-none text-xs text-foreground"
                    />
                  ) : (
                    <span
                      className="text-foreground truncate block max-w-70"
                      title={tx.description}
                    >
                      {tx.description}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {editingId === tx.id ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-24 bg-white/6 border border-white/10 rounded px-2 py-1 outline-none text-xs text-right"
                    />
                  ) : (
                    <span
                      className={`font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-foreground"}`}
                    >
                      {tx.type === "income" ? "+" : ""}
                      {fmtCurrencyRaw(tx.amount, currency)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <select
                    value={tx.category}
                    onChange={(e) =>
                      updateTransaction(analysisId, tx.id, {
                        category: e.target.value,
                        needType: inferNeedType(e.target.value, tx.type),
                      })
                    }
                    className="text-[10px] rounded px-1.5 py-0.5 outline-none cursor-pointer w-full"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e8e0d0",
                    }}
                  >
                    {tx.type === "income"
                      ? INCOME_CATEGORIES.map((c) => (
                          <option
                            key={c}
                            value={c}
                            style={{ background: "#1a1a1a" }}
                          >
                            {c}
                          </option>
                        ))
                      : EXPENSE_CATEGORIES.map((c) => (
                          <option
                            key={c}
                            value={c}
                            style={{ background: "#1a1a1a" }}
                          >
                            {c}
                          </option>
                        ))}
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  {tx.type === "expense" ? (
                    <button
                      onClick={() =>
                        updateTransaction(analysisId, tx.id, {
                          needType:
                            tx.needType === "want"
                              ? "unwanted"
                              : tx.needType === "unwanted"
                                ? "need"
                                : "want",
                        })
                      }
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize transition-all ${NEED_TYPE_TEXT[tx.needType]}`}
                      style={{
                        background: NEED_TYPE_LABELS[tx.needType].color,
                      }}
                      title="Click to cycle type"
                    >
                      {NEED_TYPE_LABELS[tx.needType].label}
                    </button>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium text-emerald-400"
                      style={{ background: "rgba(52,211,153,0.12)" }}
                    >
                      Income
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    {editingId === tx.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(tx.id)}
                          className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-all"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-muted-foreground hover:bg-white/10 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(tx)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(analysisId, tx.id)}
                          className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                >
                  No transactions in this category
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">
          {filtered.length} transactions
        </span>
        <span className="text-emerald-400 font-medium">
          In:{" "}
          {fmtCurrencyRaw(
            filtered
              .filter((t) => t.type === "income")
              .reduce((s, t) => s + t.amount, 0),
            currency,
          )}
        </span>
        <span className="text-red-400 font-medium">
          Out:{" "}
          {fmtCurrencyRaw(
            filtered
              .filter((t) => t.type === "expense")
              .reduce((s, t) => s + t.amount, 0),
            currency,
          )}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subscriptions Tab                                                   */
/* ------------------------------------------------------------------ */
function SubscriptionsTab({
  analysis,
  analysisId,
}: {
  analysis: MonthlyAnalysis;
  analysisId: string;
}) {
  const { currency } = useCurrency();
  const { updateTransaction, deleteTransaction } = useFinancialAnalysis();
  const subs = analysis.transactions.filter(
    (t) => t.needType === "subscription",
  );
  const total = subs.reduce((s, t) => s + t.amount, 0);
  const annual = total * 12;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Monthly Total", value: fmtCurrencyRaw(total, currency) },
          { label: "Annual Cost", value: fmtCurrencyRaw(annual, currency) },
          { label: "No. of Subscriptions", value: subs.length.toString() },
        ].map((c) => (
          <div
            key={c.label}
            className="p-4 rounded-xl border border-border bg-card text-center"
          >
            <div className="text-[11px] text-muted-foreground mb-1">
              {c.label}
            </div>
            <div className="text-lg font-bold text-foreground">{c.value}</div>
          </div>
        ))}
      </div>

      {subs.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <p>No subscriptions found.</p>
          <p className="text-xs mt-1">
            Mark transactions as "Subscription" in the Transactions tab to track
            them here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Subscriptions
          </p>
          {subs.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.07]"
              style={{ background: "rgba(167,139,250,0.05)" }}
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {tx.description}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmtCurrencyRaw(tx.amount * 12, currency)}/year
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-purple-400">
                  {fmtCurrencyRaw(tx.amount, currency)}/mo
                </span>
                <button
                  onClick={() => deleteTransaction(analysisId, tx.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 text-xs text-muted-foreground">
            💡 If you cancelled all subscriptions, you'd save{" "}
            <span className="text-primary font-semibold">
              {fmtCurrencyRaw(annual, currency)}/year
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compare Tab                                                         */
/* ------------------------------------------------------------------ */
function CompareTab({ analyses }: { analyses: MonthlyAnalysis[] }) {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);

  if (analyses.length < 2) {
    return (
      <div className="text-center py-16 space-y-3">
        <RefreshCcw className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
        <p className="text-sm text-muted-foreground">
          Upload statements for at least 2 months to compare.
        </p>
        <p className="text-xs text-muted-foreground">
          Go to Chat → upload a bank statement → confirm transactions.
        </p>
      </div>
    );
  }

  const chartData = analyses.map((a) => ({
    name: a.period,
    Income: a.totalIncome,
    Expenses: a.totalExpenses,
    Savings: Math.max(0, a.totalIncome - a.totalExpenses),
  }));

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border border-border bg-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Month-over-Month Comparison
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => fmt(v as number)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#888" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="Income" fill="#00f5d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Savings" fill="#40e0ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table comparison */}
      <div className="rounded-xl overflow-hidden border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.03)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                Period
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                Income
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                Expenses
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                Savings
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((a) => {
              const net = a.totalIncome - a.totalExpenses;
              const sr =
                a.totalIncome > 0
                  ? ((net / a.totalIncome) * 100).toFixed(1)
                  : "0";
              return (
                <tr key={a.id} className="border-b border-white/4">
                  <td className="px-4 py-2.5 font-medium">{a.period}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-400 font-medium">
                    {fmtCurrencyRaw(a.totalIncome, currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-400 font-medium">
                    {fmtCurrencyRaw(a.totalExpenses, currency)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold ${net >= 0 ? "text-primary" : "text-red-400"}`}
                  >
                    {net >= 0 ? "+" : ""}
                    {fmtCurrencyRaw(Math.abs(net), currency)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold ${Number(sr) >= 20 ? "text-primary" : Number(sr) >= 10 ? "text-amber-400" : "text-red-400"}`}
                  >
                    {sr}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */
export function AnalysisPage() {
  const { analyses, removeAnalysis } = useFinancialAnalysis();
  const { currency } = useCurrency();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const analysis = selectedId
    ? analyses.find((a) => a.id === selectedId)
    : analyses[analyses.length - 1];

  const net = analysis ? analysis.totalIncome - analysis.totalExpenses : 0;
  const savingsRate =
    analysis && analysis.totalIncome > 0
      ? ((net / analysis.totalIncome) * 100).toFixed(1)
      : "0";

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <PieIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: <List className="w-3.5 h-3.5" />,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: <RefreshCcw className="w-3.5 h-3.5" />,
    },
    {
      id: "compare",
      label: "Compare Months",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <header
          className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between"
          style={{ background: "hsl(0 0% 7%)" }}
        >
          <div>
            <h1 className="text-lg font-semibold font-lora text-gradient">
              Spending Analysis
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-analyzed bank statements · needs vs wants · subscriptions
            </p>
          </div>
          {analyses.length > 0 && (
            <div className="flex items-center gap-2">
              {analyses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(!selectedId && a.id === analyses[analyses.length - 1].id) || selectedId === a.id ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground border border-white/[0.07] hover:border-white/20"}`}
                >
                  {a.period}
                </button>
              ))}
              {analysis && (
                <button
                  onClick={() => {
                    removeAnalysis(analysis.id);
                    setSelectedId(null);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete this analysis"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </header>

        {!analysis ? (
          <EmptyState />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: "Total Income",
                  value: fmtCurrencyRaw(analysis.totalIncome, currency),
                  color: "text-emerald-400",
                },
                {
                  label: "Total Expenses",
                  value: fmtCurrencyRaw(analysis.totalExpenses, currency),
                  color: "text-red-400",
                },
                {
                  label: "Net Savings",
                  value: `${net >= 0 ? "+" : ""}${fmtCurrencyRaw(Math.abs(net), currency)}`,
                  color: net >= 0 ? "text-primary" : "text-red-400",
                },
                {
                  label: "Savings Rate",
                  value: `${savingsRate}%`,
                  color:
                    Number(savingsRate) >= 20
                      ? "text-primary"
                      : Number(savingsRate) >= 10
                        ? "text-amber-400"
                        : "text-red-400",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <div className="text-[11px] text-muted-foreground mb-1 font-medium">
                    {c.label}
                  </div>
                  <div className={`text-lg font-bold ${c.color}`}>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && <OverviewTab analysis={analysis} />}
            {activeTab === "transactions" && (
              <TransactionsTab analysis={analysis} analysisId={analysis.id} />
            )}
            {activeTab === "subscriptions" && (
              <SubscriptionsTab analysis={analysis} analysisId={analysis.id} />
            )}
            {activeTab === "compare" && <CompareTab analyses={analyses} />}
          </div>
        )}
      </div>
    </Layout>
  );
}
