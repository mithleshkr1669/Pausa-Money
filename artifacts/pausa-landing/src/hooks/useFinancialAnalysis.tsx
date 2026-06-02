import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type NeedType = "need" | "want" | "unwanted" | "subscription" | "income";

export const NEED_CAT_LIST = [
  "Housing",
  "Groceries",
  "Transport",
  "Utilities",
  "Healthcare",
  "Education",
  "Insurance",
] as const;
export const WANT_CAT_LIST = [
  "Dining Out",
  "Entertainment",
  "Shopping",
  "Travel",
  "Personal Care",
  "Other",
] as const;
export const EXPENSE_CATEGORIES = [
  ...NEED_CAT_LIST,
  ...WANT_CAT_LIST,
  "Subscriptions",
] as const;
export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Transfer In",
  "Other Income",
] as const;
export const ALL_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
] as const;

export const NEED_CATEGORIES = new Set<string>(NEED_CAT_LIST);
export const INCOME_CAT_SET = new Set<string>(INCOME_CATEGORIES);

export function inferNeedType(
  category: string,
  txType: "income" | "expense",
): NeedType {
  if (txType === "income" || INCOME_CAT_SET.has(category)) return "income";
  if (category === "Subscriptions") return "subscription";
  if (NEED_CATEGORIES.has(category)) return "need";
  return "want";
}

// Map AI-generated categories to canonical ones
export const AI_CATEGORY_MAP: Record<string, string> = {
  Food: "Groceries",
  "Food & Groceries": "Groceries",
  Grocery: "Groceries",
  Transport: "Transport",
  Transportation: "Transport",
  Housing: "Housing",
  Rent: "Housing",
  Entertainment: "Entertainment",
  "Dining Out": "Dining Out",
  Dining: "Dining Out",
  Healthcare: "Healthcare",
  Medical: "Healthcare",
  Shopping: "Shopping",
  Utilities: "Utilities",
  Subscriptions: "Subscriptions",
  Subscription: "Subscriptions",
  Other: "Other",
  Miscellaneous: "Other",
};

export function mapCategory(cat: string): string {
  return AI_CATEGORY_MAP[cat] || cat;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  needType: NeedType;
  date?: string;
}

export interface MonthlyAnalysis {
  id: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
  uploadedAt: string;
}

interface AnalysisContextValue {
  analyses: MonthlyAnalysis[];
  addAnalysis: (data: Omit<MonthlyAnalysis, "id" | "uploadedAt">) => string;
  updateTransaction: (
    analysisId: string,
    txId: string,
    patch: Partial<Transaction>,
  ) => void;
  deleteTransaction: (analysisId: string, txId: string) => void;
  removeAnalysis: (id: string) => void;
  getLatestAnalysis: () => MonthlyAnalysis | null;
  getSummaryForAI: (currencySymbol: string) => string;
}

const AnalysisContext = createContext<AnalysisContextValue>({
  analyses: [],
  addAnalysis: () => "",
  updateTransaction: () => {},
  deleteTransaction: () => {},
  removeAnalysis: () => {},
  getLatestAnalysis: () => null,
  getSummaryForAI: () => "",
});

const STORAGE_KEY = "finadvisor_analysis_v2";

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analyses, setAnalyses] = useState<MonthlyAnalysis[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return JSON.parse(s) as MonthlyAnalysis[];
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    } catch {}
  }, [analyses]);

  const addAnalysis = useCallback(
    (data: Omit<MonthlyAnalysis, "id" | "uploadedAt">): string => {
      const id = `analysis_${Date.now()}`;
      setAnalyses((prev) => [
        ...prev,
        { ...data, id, uploadedAt: new Date().toISOString() },
      ]);
      return id;
    },
    [],
  );

  const updateTransaction = useCallback(
    (analysisId: string, txId: string, patch: Partial<Transaction>) => {
      setAnalyses((prev) =>
        prev.map((a) => {
          if (a.id !== analysisId) return a;
          const transactions = a.transactions.map((tx) => {
            if (tx.id !== txId) return tx;
            const updated = { ...tx, ...patch };
            if (patch.category)
              updated.needType = inferNeedType(updated.category, updated.type);
            return updated;
          });
          const totalIncome = transactions
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0);
          const totalExpenses = transactions
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + t.amount, 0);
          return { ...a, transactions, totalIncome, totalExpenses };
        }),
      );
    },
    [],
  );

  const deleteTransaction = useCallback((analysisId: string, txId: string) => {
    setAnalyses((prev) =>
      prev.map((a) => {
        if (a.id !== analysisId) return a;
        const transactions = a.transactions.filter((tx) => tx.id !== txId);
        const totalIncome = transactions
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0);
        const totalExpenses = transactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0);
        return { ...a, transactions, totalIncome, totalExpenses };
      }),
    );
  }, []);

  const removeAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getLatestAnalysis = useCallback((): MonthlyAnalysis | null => {
    return analyses.length > 0 ? analyses[analyses.length - 1] : null;
  }, [analyses]);

  const getSummaryForAI = useCallback(
    (sym: string): string => {
      const latest = analyses.length > 0 ? analyses[analyses.length - 1] : null;
      if (!latest) return "";
      const byCategory = latest.transactions
        .filter((t) => t.type === "expense")
        .reduce<Record<string, number>>((acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        }, {});
      const topCats = Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([k, v]) => `${k}:${sym}${v.toLocaleString()}`)
        .join(", ");
      const subTotal = latest.transactions
        .filter((t) => t.needType === "subscription")
        .reduce((s, t) => s + t.amount, 0);
      const net = latest.totalIncome - latest.totalExpenses;
      const sr =
        latest.totalIncome > 0
          ? ((net / latest.totalIncome) * 100).toFixed(1)
          : "0";
      return `\n[Bank statement on file — ${latest.period}]\nIncome:${sym}${latest.totalIncome.toLocaleString()} | Expenses:${sym}${latest.totalExpenses.toLocaleString()} | Net:${net >= 0 ? "+" : ""}${sym}${Math.abs(net).toLocaleString()} | Savings rate:${sr}%${subTotal > 0 ? ` | Subscriptions:${sym}${subTotal.toLocaleString()}/mo` : ""}\nTop spending: ${topCats}`;
    },
    [analyses],
  );

  return (
    <AnalysisContext.Provider
      value={{
        analyses,
        addAnalysis,
        updateTransaction,
        deleteTransaction,
        removeAnalysis,
        getLatestAnalysis,
        getSummaryForAI,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useFinancialAnalysis() {
  return useContext(AnalysisContext);
}
