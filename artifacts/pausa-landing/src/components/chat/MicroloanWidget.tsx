import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Shield, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface PartnerOffer {
  partner: string;
  logo: string;
  maxAmount: number;
  interestRate: string;
  tenure: string;
  processingFee: string;
  eligibilityScore: number;
  affiliateUrl: string;
  tag: string;
}

interface MicroloanData {
  eligible: boolean;
  requestedAmount: number;
  foir: number;
  partners: PartnerOffer[];
  rbiNotice: string;
}

const LOGO_COLORS: Record<string, string> = {
  KB: "#6c5ce7",
  CA: "#00b894",
  MV: "#0984e3",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? "#00E5D4" : score >= 55 ? "#e0a040" : "#e07050";
  const label = score >= 75 ? "High" : score >= 55 ? "Medium" : "Low";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{label}</span>
    </div>
  );
}

export function MicroloanWidget({ data }: { data: MicroloanData }) {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-2xl border border-white/10 bg-[#13131e] overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#f0e8d8]">Microloan Partners</p>
          <p className="text-xs text-[#8c8070]">
            ₹{(data.requestedAmount / 1000).toFixed(0)}K requested · FOIR {data.foir}%
          </p>
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${data.eligible ? "bg-[#00E5D4]/15 text-[#00E5D4]" : "bg-red-500/15 text-red-400"}`}>
          {data.eligible ? "Eligible" : "Low match"}
        </div>
      </div>

      {/* Partners */}
      <div className="divide-y divide-white/6">
        {data.partners.map((p, i) => (
          <div key={p.partner} className={`px-4 py-3 flex items-center gap-3 ${i === 0 ? "bg-[#00E5D4]/3" : ""}`}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: LOGO_COLORS[p.logo] ?? "#444" }}
            >
              {p.logo}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-[#f0e8d8]">{p.partner}</span>
                {i === 0 && <span className="text-xs bg-[#00E5D4]/15 text-[#00E5D4] px-1.5 rounded font-mono">Best match</span>}
              </div>
              <p className="text-xs text-[#8c8070] truncate">{p.tag}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[#8c8070]">Rate: <span className="text-[#f0e8d8]">{p.interestRate}</span></span>
                <span className="text-xs text-[#8c8070]">Up to: <span className="text-[#f0e8d8]">₹{(p.maxAmount / 100000).toFixed(1)}L</span></span>
              </div>
              <ScoreBadge score={p.eligibilityScore} />
            </div>
            <a
              href={p.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #00E5D4, #00F5A0)", color: "#09090f" }}
            >
              Apply <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      {/* RBI Notice toggle */}
      <div className="px-4 py-2 border-t border-white/8">
        <button
          onClick={() => setShowNotice((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-[#8c8070] hover:text-[#f0e8d8] transition-colors"
        >
          <Shield className="w-3 h-3 text-[#00E5D4]" />
          RBI regulated partners
          {showNotice ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showNotice && (
          <p className="mt-2 text-xs text-[#8c8070]/80 leading-relaxed">
            {data.rbiNotice}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Loader helper — fetches partner data from backend
export async function fetchMicroloanOffers(params: {
  monthlyIncome: number;
  loanAmount?: number;
  employmentType?: string;
  city?: string;
}): Promise<MicroloanData | null> {
  try {
    const res = await fetch("/api/v1/leads/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch {
    return null;
  }
}
