import { Router } from "express";

const router = Router();

interface LeadRequest {
  monthlyIncome: number;
  city?: string;
  employmentType?: "salaried" | "self-employed" | "student" | "other";
  loanAmount?: number;
  creditScore?: number;
  age?: number;
}

interface PartnerOffer {
  partner: string;
  logo: string;
  maxAmount: number;
  interestRate: string;
  tenure: string;
  processingFee: string;
  eligibilityScore: number; // 0-100
  affiliateUrl: string;
  tag: string;
}

function evaluateEligibility(lead: LeadRequest, maxAmount: number): number {
  let score = 50;
  if (lead.monthlyIncome >= 25000) score += 20;
  else if (lead.monthlyIncome >= 15000) score += 10;
  if (lead.employmentType === "salaried") score += 20;
  else if (lead.employmentType === "self-employed") score += 10;
  if (lead.creditScore && lead.creditScore >= 700) score += 15;
  else if (lead.creditScore && lead.creditScore >= 600) score += 5;
  if (lead.loanAmount && lead.loanAmount <= maxAmount) score += 10;
  return Math.min(100, Math.max(10, score));
}

// POST /api/v1/leads/evaluate
router.post("/v1/leads/evaluate", (req, res) => {
  const lead = req.body as LeadRequest;

  if (!lead.monthlyIncome || lead.monthlyIncome <= 0) {
    return res.status(400).json({ error: "monthlyIncome is required" });
  }

  const partners: PartnerOffer[] = [
    {
      partner: "KreditBee",
      logo: "KB",
      maxAmount: 400000,
      interestRate: "12–29.95% p.a.",
      tenure: "3–24 months",
      processingFee: "2–6%",
      eligibilityScore: evaluateEligibility(lead, 400000),
      affiliateUrl: "https://www.kreditbee.in/?ref=pausa",
      tag: "Instant disbursal · No collateral",
    },
    {
      partner: "CASHe",
      logo: "CA",
      maxAmount: 400000,
      interestRate: "27–33% p.a.",
      tenure: "1–18 months",
      processingFee: "1.75%",
      eligibilityScore: evaluateEligibility(lead, 400000),
      affiliateUrl: "https://www.cashe.co.in/?ref=pausa",
      tag: "Social credit score · Quick",
    },
    {
      partner: "MoneyView",
      logo: "MV",
      maxAmount: 1000000,
      interestRate: "16–39% p.a.",
      tenure: "3–60 months",
      processingFee: "2%",
      eligibilityScore: evaluateEligibility(lead, 1000000),
      affiliateUrl: "https://moneyview.in/?ref=pausa",
      tag: "Flexible tenure · Higher limits",
    },
  ];

  // Sort by eligibility score descending
  partners.sort((a, b) => b.eligibilityScore - a.eligibilityScore);

  const requestedAmount = lead.loanAmount || 50000;
  const foir = lead.monthlyIncome > 0 ? Math.min(50, (requestedAmount / 12 / lead.monthlyIncome) * 100) : 50;

  res.json({
    eligible: partners.some((p) => p.eligibilityScore >= 60),
    requestedAmount,
    foir: Math.round(foir),
    partners,
    rbiNotice:
      "All lending partners are registered Non-Banking Financial Companies (NBFCs) regulated by the Reserve Bank of India under the Digital Lending Directions 2022. Pausa does not facilitate or guarantee loan disbursal. APR and eligibility depend on individual credit assessment by the partner NBFC.",
  });
});

export default router;
