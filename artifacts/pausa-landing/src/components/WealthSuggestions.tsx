import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, ExternalLink, Shield, Zap, BarChart3 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface MFund {
  schemeCode: number;
  name: string;
  category: string;
  subcategory: string;
  risk: string;
  minSip: number;
  nav: number | null;
  navDate: string | null;
  return1Y: number | null;
}

const CATEGORY_META: Record<string, { color: string; icon: React.ReactNode; tip: string }> = {
  "Index":      { color: "#00E5D4", icon: <BarChart3 className="w-3.5 h-3.5" />, tip: "Tracks Nifty 50 — lowest cost, market returns" },
  "ELSS":       { color: "#a78bfa", icon: <Shield className="w-3.5 h-3.5" />, tip: "Save up to ₹1.5L tax under 80C + equity growth" },
  "Large Cap":  { color: "#34d399", icon: <TrendingUp className="w-3.5 h-3.5" />, tip: "Stable blue-chip stocks, moderate risk" },
  "Flexi Cap":  { color: "#f59e0b", icon: <Zap className="w-3.5 h-3.5" />, tip: "Flexible allocation across market caps" },
  "Mid Cap":    { color: "#f87171", icon: <TrendingUp className="w-3.5 h-3.5" />, tip: "Higher growth potential, higher volatility" },
  "Debt":       { color: "#60a5fa", icon: <Shield className="w-3.5 h-3.5" />, tip: "Capital preservation, low risk, better than FD" },
};

function RiskBadge({ risk }: { risk: string }) {
  const color = risk === "Low-Moderate" ? "#60a5fa"
    : risk === "Moderate" ? "#34d399"
    : risk === "Moderate-High" ? "#f59e0b"
    : "#f87171";
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border" style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
      {risk}
    </span>
  );
}

export function WealthSuggestions() {
  const { currency } = useCurrency();
  const [funds, setFunds] = useState<MFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const fetchFunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/mf/funds`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { funds: MFund[]; cachedAt: string };
      setFunds(data.funds);
      setLastUpdated(data.cachedAt ? new Date(data.cachedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null);
    } catch (e) {
      setError("Could not load fund data. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFunds(); }, []);

  const categories = ["All", ...Array.from(new Set(funds.map((f) => f.category)))];
  const filtered = activeCategory === "All" ? funds : funds.filter((f) => f.category === activeCategory);

  const bestReturn = filtered.reduce<MFund | null>((best, f) => {
    if (!best || (f.return1Y !== null && (best.return1Y === null || f.return1Y > best.return1Y))) return f;
    return best;
  }, null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Mutual Fund Explorer</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Data sourced from AMFI India · {lastUpdated ? `Updated ${lastUpdated}` : "Live NAV"}
          </p>
        </div>
        <button
          onClick={fetchFunds}
          disabled={loading}
          className="p-1.5 rounded-lg border border-border hover:bg-white/5 transition-colors"
          title="Refresh NAV data"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
              activeCategory === cat
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse" />
          ))}
          <p className="text-[11px] text-muted-foreground text-center">Fetching live NAV from AMFI…</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Best performer highlight */}
          {bestReturn?.return1Y !== null && bestReturn && (
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary truncate">Top Performer: {bestReturn.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  1Y Return: <span className="text-emerald-400 font-semibold">{bestReturn.return1Y?.toFixed(2)}%</span> · Min SIP: {currency.symbol}{bestReturn.minSip}
                </p>
              </div>
            </div>
          )}

          {/* Fund table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-white/[0.02] border-b border-border text-[10px] text-muted-foreground font-medium">
              <div className="col-span-5">Fund</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">NAV</div>
              <div className="col-span-2 text-right">1Y Ret.</div>
              <div className="col-span-1 text-right">SIP</div>
            </div>
            {filtered.map((fund) => {
              const meta = CATEGORY_META[fund.category];
              return (
                <div key={fund.schemeCode} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors group">
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${meta?.color ?? "#666"}15`, color: meta?.color ?? "#666" }}>
                      {meta?.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground leading-tight truncate">{fund.name}</p>
                      <RiskBadge risk={fund.risk} />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-[10px] font-medium" style={{ color: meta?.color ?? "#999" }}>
                      {fund.category}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-[11px] font-mono text-foreground">
                      {fund.nav ? `₹${fund.nav.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    {fund.return1Y !== null ? (
                      <span className={`text-[11px] font-bold ${fund.return1Y >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fund.return1Y >= 0 ? "+" : ""}{fund.return1Y.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <span className="text-[10px] text-muted-foreground">₹{fund.minSip}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category tips */}
          {activeCategory !== "All" && CATEGORY_META[activeCategory] && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/6">
              <span style={{ color: CATEGORY_META[activeCategory].color }}>{CATEGORY_META[activeCategory].icon}</span>
              <p className="text-xs text-muted-foreground">{CATEGORY_META[activeCategory].tip}</p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground">
            ⚠️ Past returns do not guarantee future results. Mutual fund investments are subject to market risks. 
            Data sourced from AMFI India. Not SEBI-registered investment advice.{" "}
            <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
              amfiindia.com <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </>
      )}
    </div>
  );
}
