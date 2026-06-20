import { Router } from "express";

const router = Router();

interface InsuranceRequest {
  age: number;
  annualIncome: number;
  dependents?: number;
  existingCover?: number;
  hasHealthInsurance?: boolean;
  city?: string;
}

interface InsuranceProduct {
  type: "Term Life" | "Health" | "Emergency Fund";
  recommended: number;
  existing: number;
  gap: number;
  score: number; // 0-100
  status: "critical" | "low" | "adequate" | "good";
  rationale: string;
  affiliate: {
    name: string;
    url: string;
    tag: string;
  }[];
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

// POST /api/v1/insurance/calculate
router.post("/v1/insurance/calculate", (req, res) => {
  const { age, annualIncome, dependents = 1, existingCover = 0, hasHealthInsurance = false } = req.body as InsuranceRequest;

  if (!age || !annualIncome) {
    return res.status(400).json({ error: "age and annualIncome are required" });
  }

  // ── Term Life: 20× annual income, minus existing cover ──────────────────────
  const termRecommended = annualIncome * 20;
  const termGap = Math.max(0, termRecommended - existingCover);
  const termScore = clamp(((termRecommended - termGap) / termRecommended) * 100, 0, 100);

  // ── Health: ₹5L < 30, ₹10L 30-45, ₹25L 45+ ──────────────────────────────
  const healthBase = age < 30 ? 500000 : age < 45 ? 1000000 : 2500000;
  const healthFamilyBoost = dependents > 1 ? healthBase * 0.5 : 0;
  const healthRecommended = healthBase + healthFamilyBoost;
  const healthScore = hasHealthInsurance ? 80 : 10;

  // ── Emergency Fund: 6× monthly expenses (estimated ~50% of income) ─────────
  const monthlyExpenses = (annualIncome / 12) * 0.55;
  const emergencyRecommended = Math.round(monthlyExpenses * 6);

  // ── Overall Insurance Health Score ────────────────────────────────────────
  const overallScore = Math.round(
    termScore * 0.5 + healthScore * 0.4 + 10
  );
  const scoreLabel =
    overallScore >= 75 ? "Healthy" :
    overallScore >= 50 ? "Needs Attention" :
    overallScore >= 30 ? "At Risk" : "Critical";
  const scoreColor =
    overallScore >= 75 ? "#00E5CC" :
    overallScore >= 50 ? "#e0a040" :
    overallScore >= 30 ? "#e07050" : "#e05050";

  const products: InsuranceProduct[] = [
    {
      type: "Term Life",
      recommended: termRecommended,
      existing: existingCover,
      gap: termGap,
      score: Math.round(termScore),
      status: termGap === 0 ? "good" : termScore < 30 ? "critical" : termScore < 60 ? "low" : "adequate",
      rationale: `Based on 20× annual income rule — cover your family for ${Math.round(termRecommended / annualIncome)}× your earnings. ${existingCover > 0 ? `You already have ₹${(existingCover / 100000).toFixed(1)}L — gap is ₹${(termGap / 100000).toFixed(1)}L.` : "No existing cover detected."}`,
      affiliate: [
        { name: "PolicyBazaar", url: "https://www.policybazaar.com/life-insurance/term-insurance/?ref=pausa", tag: "Compare 20+ plans" },
        { name: "Acko", url: "https://www.acko.com/life-insurance/?ref=pausa", tag: "Instant online issuance" },
      ],
    },
    {
      type: "Health",
      recommended: healthRecommended,
      existing: hasHealthInsurance ? healthRecommended : 0,
      gap: hasHealthInsurance ? 0 : healthRecommended,
      score: healthScore,
      status: hasHealthInsurance ? "good" : "critical",
      rationale: `Recommended ₹${(healthRecommended / 100000).toFixed(0)}L family floater for age ${age} with ${dependents} dependent(s). Hospitalisation in metro cities averages ₹1.5–8L per incident.`,
      affiliate: [
        { name: "Niva Bupa", url: "https://www.nivabupa.com/?ref=pausa", tag: "Family floater plans" },
        { name: "Star Health", url: "https://www.starhealth.in/?ref=pausa", tag: "Pre-existing cover" },
      ],
    },
  ];

  res.json({
    overallScore,
    scoreLabel,
    scoreColor,
    products,
    termCoverFormula: `₹${(termRecommended / 100000).toFixed(0)}L = 20 × ₹${(annualIncome / 100000).toFixed(1)}L annual income`,
    emergencyFundTarget: emergencyRecommended,
    disclaimer:
      "Insurance calculations are indicative and educational only. Consult a SEBI-registered financial advisor or licensed insurance agent before purchasing any policy. Pausa is not an insurance broker.",
  });
});

export default router;
