import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Shield, Info, TrendingUp } from "lucide-react";

interface InsuranceProduct {
  type: "Term Life" | "Health" | "Emergency Fund";
  recommended: number;
  existing: number;
  gap: number;
  score: number;
  status: "critical" | "low" | "adequate" | "good";
  rationale: string;
  affiliate: { name: string; url: string; tag: string }[];
}

interface InsuranceData {
  overallScore: number;
  scoreLabel: string;
  scoreColor: string;
  products: InsuranceProduct[];
  termCoverFormula: string;
  emergencyFundTarget: number;
  disclaimer: string;
}

const STATUS_CONFIG = {
  critical: { label: "Critical", color: "#e05050" },
  low: { label: "Low", color: "#e07050" },
  adequate: { label: "Adequate", color: "#e0a040" },
  good: { label: "Good", color: "#00E5D4" },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-xl font-black" style={{ color }}>{score}</div>
        <div className="text-[9px] text-[#8c8070] font-mono uppercase">/100</div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function InsuranceWidget({ data }: { data: InsuranceData }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-2xl border border-white/10 bg-[#13131e] overflow-hidden"
    >
      {/* Header — Insurance Health Score */}
      <div className="px-4 py-4 border-b border-white/8 flex items-center gap-4">
        <ScoreRing score={data.overallScore} color={data.scoreColor} />
        <div>
          <p className="text-xs text-[#8c8070] font-mono uppercase tracking-wider mb-0.5">Insurance Health Score</p>
          <p className="text-lg font-black" style={{ color: data.scoreColor }}>{data.scoreLabel}</p>
          <p className="text-xs text-[#8c8070] mt-0.5">{data.termCoverFormula}</p>
        </div>
      </div>

      {/* Products */}
      <div className="divide-y divide-white/6">
        {data.products.map((product) => {
          const cfg = STATUS_CONFIG[product.status];
          const isOpen = expanded === product.type;
          return (
            <div key={product.type}>
              <button
                onClick={() => setExpanded(isOpen ? null : product.type)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/2 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#f0e8d8]">{product.type}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: `${cfg.color}20`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#8c8070]">
                      Recommended: <span className="text-[#f0e8d8]">{fmt(product.recommended)}</span>
                    </span>
                    {product.gap > 0 && (
                      <span className="text-xs" style={{ color: cfg.color }}>
                        Gap: {fmt(product.gap)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Score bar */}
                <div className="w-16 text-right">
                  <div className="text-xs font-bold mb-1" style={{ color: cfg.color }}>{product.score}%</div>
                  <div className="w-full h-1 rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${product.score}%`, background: cfg.color }} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-[#8c8070] leading-relaxed">{product.rationale}</p>
                  {product.affiliate.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.affiliate.map((aff) => (
                        <a
                          key={aff.name}
                          href={aff.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#00E5D4]/25 text-[#00E5D4] hover:bg-[#00E5D4]/8 transition-colors"
                        >
                          {aff.name} · {aff.tag}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency fund */}
      {data.emergencyFundTarget > 0 && (
        <div className="px-4 py-3 border-t border-white/8 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00E5D4] shrink-0" />
          <p className="text-xs text-[#8c8070]">
            Emergency fund target: <span className="text-[#f0e8d8] font-medium">{fmt(data.emergencyFundTarget)}</span> (6× monthly expenses)
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-4 py-2 border-t border-white/8 flex items-start gap-1.5">
        <Shield className="w-3 h-3 text-[#8c8070] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#8c8070]/70 leading-relaxed">{data.disclaimer}</p>
      </div>
    </motion.div>
  );
}

// Loader helper
export async function fetchInsuranceScore(params: {
  age: number;
  annualIncome: number;
  dependents?: number;
  existingCover?: number;
  hasHealthInsurance?: boolean;
}): Promise<InsuranceData | null> {
  try {
    const res = await fetch("/api/v1/insurance/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch {
    return null;
  }
}
