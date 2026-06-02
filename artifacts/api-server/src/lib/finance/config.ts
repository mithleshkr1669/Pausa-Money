/**
 * Domain detection with weighted keyword scoring
 * Scoring: longer/more-specific keywords score higher (word-count based)
 */

export const AGENT_DOMAINS: Record<string, string[]> = {
  BUDGET: [
    "budget",
    "budgeting",
    "spending",
    "expense",
    "monthly expenses",
    "cash flow",
    "50/30/20",
    "zero-based",
    "envelope budget",
    "frugal",
    "net worth",
    "financial plan",
    "cost of living",
    "cut costs",
    "overspending",
    "allowance",
    "saving",
    "savings habit",
    "emergency fund",
    "save money",
  ],
  INVESTMENT: [
    "invest",
    "stock",
    "bond",
    "mutual fund",
    "etf",
    "portfolio",
    "wealth",
    "returns",
    "trading",
    "dividend",
    "index fund",
    "roth",
    "brokerage",
    "retirement",
    "retire",
    "401k",
    "403b",
    "ira",
    "pension",
    "social security",
    "annuity",
    "rmd",
    "required minimum",
    "rebalance",
    "asset allocation",
    "time value",
    "compound",
    "diversif",
    "target date",
    "sep ira",
    "simple ira",
    "defined benefit",
    "defined contribution",
    "dollar-cost",
    "systematic risk",
    "unsystematic risk",
    "capm",
    "capital asset pricing",
    "backdoor roth",
    "roth conversion",
    "contribution rules",
    "ira contribution",
  ],
  DEBT: [
    "debt",
    "loan",
    "credit card",
    "bankruptcy",
    "defaulting",
    "collection agency",
    "snowball",
    "avalanche",
    "consolidate",
    "refinance",
    "student loan",
    "pslf",
    "income-driven",
    "credit score",
    "credit report",
    "credit utilization",
    "pay off debt",
    "payoff",
    "minimum payment",
  ],
  TAX: [
    "tax",
    "taxes",
    "taxable",
    "tax-free",
    "pre-tax",
    "pretax",
    "tax-advantaged",
    "after-tax",
    "deduction",
    "irs",
    "filing",
    "withholding",
    "refund",
    "bracket",
    "capital gains",
    "estate tax",
    "gift tax",
    "charitable",
    "donor advised",
    "qualified charitable",
    "inheritance",
    "step-up basis",
    "tax-loss harvesting",
    "harvest",
    "alternative minimum",
    "amt",
    "pass-through",
    "qualified business",
    "qbi",
    "trust",
    "estate planning",
    "revocable",
    "irrevocable",
    "living trust",
    "will",
    "probate",
    "beneficiary",
    "estate",
    "w-2",
    "1099",
    "hsa",
    "tax credit",
    "tax deduction",
    "tax bracket",
    "tax return",
    "tax savings",
    "tax loss",
    "annual gift",
    "exclusion",
  ],
  INSURANCE: [
    "insurance",
    "health coverage",
    "life insurance",
    "property insurance",
    "disability insurance",
    "long term care",
    "premium",
    "deductible",
    "high-deductible",
    "hdhp",
    "copay",
    "umbrella",
    "term life",
    "whole life",
    "universal life",
    "variable life",
    "liability",
    "medigap",
    "medicare",
    "medicaid",
    "ltc",
    "long-term care",
    "cobra",
    "human life value",
    "own-occupation",
    "any-occupation",
    "coverage needs",
    "health plan",
  ],
  HOUSING: [
    "house",
    "home",
    "mortgage",
    "rent",
    "lease",
    "real estate",
    "buying a home",
    "renting vs",
    "apartment",
    "down payment",
    "hoa",
    "landlord",
    "escrow",
    "title",
    "heloc",
    "home equity",
    "property tax",
    "homeowner",
    "home purchase",
    "home price",
    "foreclosure",
  ],
  CAREER: [
    "career",
    "education",
    "salary",
    "compensation",
    "college",
    "earnings",
    "job",
    "raise",
    "negotiate",
    "paycheck",
    "w4",
    "529",
    "coverdell",
    "tuition",
    "college savings",
    "student debt",
    "income protection",
    "vesting",
    "stock option",
    "rsu",
    "equity compensation",
    "professional development",
    "masters degree",
    "degree worth",
    "employee benefits",
    "side hustle",
    "gig economy",
    "freelance income",
    "self-employed",
    "quarterly estimated",
    "schedule c",
  ],
  FRAUD: [
    "fraud",
    "scam",
    "identity theft",
    "security breach",
    "phishing",
    "pyramid scheme",
    "suspicious",
    "stolen identity",
    "ponzi",
    "affinity fraud",
    "elder financial",
    "wire transfer scam",
    "advance fee",
    "gift card",
    "gift cards",
    "claiming to be",
    "impersonating",
  ],
};

/**
 * Weighted domain detection — count matching keyword hits per domain,
 * pick the domain(s) with the most specific/numerous matches.
 * Longer keywords score more (word-count based).
 * Returns domains sorted by score DESC.
 */
export function detectDomains(query: string): string[] {
  const lower = query.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [domain, keywords] of Object.entries(AGENT_DOMAINS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.split(" ").length;
      }
    }
    if (score > 0) scores[domain] = score;
  }

  if (Object.keys(scores).length === 0) return ["GENERAL"];

  const maxScore = Math.max(...Object.values(scores));
  const threshold = maxScore * 0.4;

  // Sort by score descending, then by domain name for deterministic ties
  return Object.entries(scores)
    .filter(([, s]) => s >= threshold)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      // For equal scores, prefer alphabetically earlier (deterministic)
      return a[0].localeCompare(b[0]);
    })
    .map(([d]) => d);
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  domains: string[];
  priority: number;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: "budget_advisor",
    name: "Budget & Savings Advisor",
    description: "Expert in budgeting, saving strategies, expense tracking, and cash flow management",
    domains: ["BUDGET"],
    priority: 1,
  },
  {
    id: "investment_advisor",
    name: "Investment & Retirement Advisor",
    description: "Specialist in investments, portfolio allocation, retirement planning, and wealth building",
    domains: ["INVESTMENT"],
    priority: 2,
  },
  {
    id: "debt_manager",
    name: "Debt Management Specialist",
    description: "Expert in debt payoff strategies, credit improvement, and financial recovery",
    domains: ["DEBT"],
    priority: 3,
  },
  {
    id: "tax_specialist",
    name: "Tax Planning Specialist",
    description: "Tax consultant for income taxes, deductions, credits, and tax-advantaged accounts",
    domains: ["TAX"],
    priority: 4,
  },
  {
    id: "insurance_advisor",
    name: "Insurance & Risk Advisor",
    description: "Insurance specialist for health, life, property, and risk management",
    domains: ["INSURANCE"],
    priority: 5,
  },
  {
    id: "housing_specialist",
    name: "Housing & Real Estate Advisor",
    description: "Housing expert for mortgages, renting vs buying, and real estate decisions",
    domains: ["HOUSING"],
    priority: 6,
  },
  {
    id: "career_counselor",
    name: "Career & Education Advisor",
    description: "Career and education advisor for salary negotiation, student loans, and career planning",
    domains: ["CAREER"],
    priority: 7,
  },
  {
    id: "fraud_protector",
    name: "Fraud Prevention Specialist",
    description: "Consumer protection expert for scams, identity theft, and financial fraud",
    domains: ["FRAUD"],
    priority: 8,
  },
];

/**
 * Select agent based on detected domains.
 * Domains are pre-sorted by score descending from detectDomains.
 * We pick the first matching agent — highest-scoring domain wins.
 */
export function selectAgent(domains: string[]): AgentConfig {
  if (domains.includes("GENERAL") || domains.length === 0) {
    return AGENT_CONFIGS[0];
  }

  // domains are sorted score-descending; pick the first agent that matches
  for (const domain of domains) {
    const agent = AGENT_CONFIGS.find((a) => a.domains.includes(domain));
    if (agent) return agent;
  }

  return AGENT_CONFIGS[0];
}
