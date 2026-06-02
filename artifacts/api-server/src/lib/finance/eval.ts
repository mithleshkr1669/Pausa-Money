/**
 * Evaluation suite for the Personal Finance Agent
 *
 * Tests domain routing accuracy, agent selection, and response quality.
 * Pass rate = percentage of tests where agent routing and domain detection are correct.
 */

import { detectDomains, selectAgent } from "./config.js";
import { runFinanceWorkflow } from "./workflow.js";
import { logger } from "../logger.js";

export interface EvalTestCase {
  id: string;
  category: string;
  query: string;
  expected_domain: string;
  expected_agent: string;
  keywords: string[];
}

export interface EvalTestResult {
  test_id: string;
  query: string;
  category: string;
  passed: boolean;
  score: number;
  expected_domain: string;
  actual_domain: string;
  expected_agent: string;
  actual_agent: string;
  response_preview: string;
  latency_ms: number;
  error: string | null;
}

export interface EvalRunResult {
  run_id: string;
  total_tests: number;
  passed: number;
  failed: number;
  pass_rate: number;
  avg_latency_ms: number;
  category_scores: Record<string, number>;
  results: EvalTestResult[];
  ran_at: string;
}

// ---------------------------------------------------------------------------
// Test cases covering all 8 domains
// ---------------------------------------------------------------------------

export const EVAL_TEST_CASES: EvalTestCase[] = [
  // Budget
  {
    id: "budget_001",
    category: "Budget",
    query: "How do I create a monthly budget on $4000 income?",
    expected_domain: "BUDGET",
    expected_agent: "budget_advisor",
    keywords: ["budget", "income", "expense", "saving"],
  },
  {
    id: "budget_002",
    category: "Budget",
    query: "What is the 50/30/20 budget rule and should I use it?",
    expected_domain: "BUDGET",
    expected_agent: "budget_advisor",
    keywords: ["50/30/20", "budget", "rule"],
  },
  {
    id: "budget_003",
    category: "Budget",
    query: "How much should I be saving from my paycheck each month?",
    expected_domain: "BUDGET",
    expected_agent: "budget_advisor",
    keywords: ["saving", "paycheck", "percent"],
  },

  // Investment
  {
    id: "invest_001",
    category: "Investment",
    query: "How do I start investing in index funds with $500?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["invest", "index fund", "portfolio"],
  },
  {
    id: "invest_002",
    category: "Investment",
    query: "What is the difference between a Roth IRA and traditional IRA?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["ira", "roth", "retirement", "tax"],
  },
  {
    id: "invest_003",
    category: "Investment",
    query: "Should I invest in stocks or bonds at age 30?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["stock", "bond", "invest", "allocation"],
  },

  // Debt
  {
    id: "debt_001",
    category: "Debt",
    query: "I have $15,000 in credit card debt. What is the best strategy?",
    expected_domain: "DEBT",
    expected_agent: "debt_manager",
    keywords: ["debt", "credit card", "payoff", "strategy"],
  },
  {
    id: "debt_002",
    category: "Debt",
    query: "What is the debt snowball vs debt avalanche method?",
    expected_domain: "DEBT",
    expected_agent: "debt_manager",
    keywords: ["snowball", "avalanche", "debt"],
  },
  {
    id: "debt_003",
    category: "Debt",
    query: "My credit score dropped. How do I improve it quickly?",
    expected_domain: "DEBT",
    expected_agent: "debt_manager",
    keywords: ["credit", "score", "improve"],
  },

  // Tax
  {
    id: "tax_001",
    category: "Tax",
    query: "How does contributing to my 401k reduce my taxes?",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["401k", "tax", "deduction", "reduce"],
  },
  {
    id: "tax_002",
    category: "Tax",
    query: "What tax deductions can I take as a freelancer?",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["tax", "deduction", "freelancer", "self-employed"],
  },
  {
    id: "tax_003",
    category: "Tax",
    query: "What is the difference between a tax deduction and a tax credit?",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["tax", "deduction", "credit", "difference"],
  },

  // Insurance
  {
    id: "ins_001",
    category: "Insurance",
    query: "How much life insurance do I need for my family?",
    expected_domain: "INSURANCE",
    expected_agent: "insurance_advisor",
    keywords: ["life insurance", "coverage", "family"],
  },
  {
    id: "ins_002",
    category: "Insurance",
    query: "Should I get a high-deductible health plan with an HSA?",
    expected_domain: "INSURANCE",
    expected_agent: "insurance_advisor",
    keywords: ["health insurance", "hsa", "deductible"],
  },

  // Housing
  {
    id: "house_001",
    category: "Housing",
    query: "Is it better to rent or buy a home right now?",
    expected_domain: "HOUSING",
    expected_agent: "housing_specialist",
    keywords: ["rent", "buy", "home", "mortgage"],
  },
  {
    id: "house_002",
    category: "Housing",
    query: "How much house can I afford on a $80,000 salary?",
    expected_domain: "HOUSING",
    expected_agent: "housing_specialist",
    keywords: ["afford", "house", "mortgage", "salary"],
  },

  // Career
  {
    id: "career_001",
    category: "Career",
    query: "How should I negotiate my salary at a new job?",
    expected_domain: "CAREER",
    expected_agent: "career_counselor",
    keywords: ["salary", "negotiate", "job", "compensation"],
  },
  {
    id: "career_002",
    category: "Career",
    query: "Is getting a masters degree worth the cost financially?",
    expected_domain: "CAREER",
    expected_agent: "career_counselor",
    keywords: ["education", "college", "earnings", "cost"],
  },

  // Fraud
  {
    id: "fraud_001",
    category: "Fraud",
    query: "Someone called claiming to be the IRS and wants gift cards. Is this a scam?",
    expected_domain: "FRAUD",
    expected_agent: "fraud_protector",
    keywords: ["scam", "fraud", "irs", "suspicious"],
  },
  {
    id: "fraud_002",
    category: "Fraud",
    query: "How do I protect myself from identity theft?",
    expected_domain: "FRAUD",
    expected_agent: "fraud_protector",
    keywords: ["identity", "fraud", "protection", "security"],
  },

  // -------------------------------------------------------------------------
  // CFP Exam Practice Questions
  // Based on the CFP Board exam topic areas:
  // Professional Conduct, Financial Planning Process, Investment, Tax,
  // Retirement, Estate Planning, Insurance, Education Planning
  // -------------------------------------------------------------------------

  // CFP — Retirement Planning
  {
    id: "cfp_ret_001",
    category: "CFP: Retirement",
    query: "A 45-year-old client wants to retire at 62. They have $200k in a 401k and save $1,500/month. Will they have enough at a 7% return?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["retirement", "401k", "compound", "save"],
  },
  {
    id: "cfp_ret_002",
    category: "CFP: Retirement",
    query: "What is the difference between a defined benefit and defined contribution retirement plan?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["defined benefit", "defined contribution", "pension", "retirement"],
  },
  {
    id: "cfp_ret_003",
    category: "CFP: Retirement",
    query: "When should my client start taking Social Security — at 62, full retirement age, or 70?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["social security", "retirement", "benefit", "age"],
  },
  {
    id: "cfp_ret_004",
    category: "CFP: Retirement",
    query: "What are Required Minimum Distributions and when must they begin?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["required minimum", "rmd", "distribution", "ira"],
  },

  // CFP — Investment Planning
  {
    id: "cfp_inv_001",
    category: "CFP: Investment",
    query: "Explain the Capital Asset Pricing Model and how it relates to portfolio risk and expected return.",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["risk", "return", "portfolio", "invest"],
  },
  {
    id: "cfp_inv_002",
    category: "CFP: Investment",
    query: "What is the difference between systematic and unsystematic risk in a diversified portfolio?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["risk", "diversif", "portfolio", "systematic"],
  },
  {
    id: "cfp_inv_003",
    category: "CFP: Investment",
    query: "How does dollar-cost averaging reduce investment risk for a long-term investor?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["invest", "average", "risk", "long-term"],
  },

  // CFP — Tax Planning
  {
    id: "cfp_tax_001",
    category: "CFP: Tax",
    query: "What is tax-loss harvesting and how can it reduce my client's capital gains tax?",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["tax", "capital gains", "harvest", "loss"],
  },
  {
    id: "cfp_tax_002",
    category: "CFP: Tax",
    query: "Explain the step-up in basis at death and its estate planning implications.",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["tax", "estate", "basis", "inheritance"],
  },
  {
    id: "cfp_tax_003",
    category: "CFP: Tax",
    query: "What are the income limits and contribution rules for a backdoor Roth IRA conversion?",
    expected_domain: "INVESTMENT",
    expected_agent: "investment_advisor",
    keywords: ["roth", "ira", "conversion", "income"],
  },

  // CFP — Insurance Planning
  {
    id: "cfp_ins_001",
    category: "CFP: Insurance",
    query: "How do I calculate the human life value approach to determine life insurance needs?",
    expected_domain: "INSURANCE",
    expected_agent: "insurance_advisor",
    keywords: ["life insurance", "coverage", "income", "human life value"],
  },
  {
    id: "cfp_ins_002",
    category: "CFP: Insurance",
    query: "What is the difference between own-occupation and any-occupation disability insurance definitions?",
    expected_domain: "INSURANCE",
    expected_agent: "insurance_advisor",
    keywords: ["disability", "insurance", "occupation", "income"],
  },

  // CFP — Education Planning
  {
    id: "cfp_edu_001",
    category: "CFP: Education",
    query: "What are the tax benefits of a 529 plan compared to a Coverdell Education Savings Account?",
    expected_domain: "CAREER",
    expected_agent: "career_counselor",
    keywords: ["529", "education", "tax", "college savings"],
  },

  // CFP — Estate Planning
  {
    id: "cfp_est_001",
    category: "CFP: Estate",
    query: "What is the annual gift tax exclusion and how can it be used in estate planning?",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["gift tax", "estate", "tax", "exclusion"],
  },
  {
    id: "cfp_est_002",
    category: "CFP: Estate",
    query: "Explain the difference between a revocable living trust and an irrevocable trust.",
    expected_domain: "TAX",
    expected_agent: "tax_specialist",
    keywords: ["trust", "estate", "revocable", "irrevocable"],
  },
];

// ---------------------------------------------------------------------------
// Run a single test case (routing only — fast, no LLM call)
// ---------------------------------------------------------------------------

async function runRoutingTest(tc: EvalTestCase): Promise<EvalTestResult> {
  const start = Date.now();
  try {
    const detectedDomains = detectDomains(tc.query);
    const selectedAgent = selectAgent(detectedDomains);

    const domainMatch = detectedDomains.includes(tc.expected_domain);
    const agentMatch = selectedAgent.id === tc.expected_agent;
    const passed = domainMatch && agentMatch;
    const score = (domainMatch ? 0.5 : 0) + (agentMatch ? 0.5 : 0);

    return {
      test_id: tc.id,
      query: tc.query,
      category: tc.category,
      passed,
      score,
      expected_domain: tc.expected_domain,
      actual_domain: detectedDomains[0] || "GENERAL",
      expected_agent: tc.expected_agent,
      actual_agent: selectedAgent.id,
      response_preview: `Routed to: ${selectedAgent.name} (domains: ${detectedDomains.join(", ")})`,
      latency_ms: Date.now() - start,
      error: null,
    };
  } catch (err) {
    return {
      test_id: tc.id,
      query: tc.query,
      category: tc.category,
      passed: false,
      score: 0,
      expected_domain: tc.expected_domain,
      actual_domain: "ERROR",
      expected_agent: tc.expected_agent,
      actual_agent: "ERROR",
      response_preview: "",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Run a full LLM test (routing + response quality check)
// ---------------------------------------------------------------------------

async function runFullTest(tc: EvalTestCase): Promise<EvalTestResult> {
  const start = Date.now();
  try {
    const result = await runFinanceWorkflow(tc.query);
    const latency = Date.now() - start;

    const domainMatch = result.detectedDomains.includes(tc.expected_domain);
    const agentMatch = result.agentId === tc.expected_agent;

    // Check that response contains relevant keywords
    const responseLower = result.response.toLowerCase();
    const keywordHits = tc.keywords.filter((kw) =>
      responseLower.includes(kw.toLowerCase())
    );
    const keywordScore = tc.keywords.length > 0 ? keywordHits.length / tc.keywords.length : 1;

    const routingScore = (domainMatch ? 0.4 : 0) + (agentMatch ? 0.4 : 0);
    const score = routingScore + keywordScore * 0.2;
    const passed = domainMatch && agentMatch && keywordScore >= 0.3;

    return {
      test_id: tc.id,
      query: tc.query,
      category: tc.category,
      passed,
      score,
      expected_domain: tc.expected_domain,
      actual_domain: result.detectedDomains[0] || "GENERAL",
      expected_agent: tc.expected_agent,
      actual_agent: result.agentId,
      response_preview: result.response.slice(0, 200),
      latency_ms: latency,
      error: null,
    };
  } catch (err) {
    return {
      test_id: tc.id,
      query: tc.query,
      category: tc.category,
      passed: false,
      score: 0,
      expected_domain: tc.expected_domain,
      actual_domain: "ERROR",
      expected_agent: tc.expected_agent,
      actual_agent: "ERROR",
      response_preview: "",
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Run the eval suite
// ---------------------------------------------------------------------------

export async function runEvalSuite(options: {
  testIds?: string[];
  categories?: string[];
  maxTests?: number;
  fullLlm?: boolean;
}): Promise<EvalRunResult> {
  let testCases = EVAL_TEST_CASES;

  if (options.testIds?.length) {
    testCases = testCases.filter((tc) => options.testIds!.includes(tc.id));
  }

  if (options.categories?.length) {
    testCases = testCases.filter((tc) =>
      options.categories!.some(
        (c) => c.toLowerCase() === tc.category.toLowerCase()
      )
    );
  }

  if (options.maxTests && options.maxTests > 0) {
    testCases = testCases.slice(0, options.maxTests);
  }

  const runId = `eval_${Date.now()}`;
  logger.info({ runId, count: testCases.length, fullLlm: options.fullLlm }, "Starting eval suite");

  // Use routing-only tests by default (fast, no API cost)
  // fullLlm=true makes real LLM calls (slower, costs API credits)
  const runFn = options.fullLlm ? runFullTest : runRoutingTest;

  const results: EvalTestResult[] = [];
  for (const tc of testCases) {
    const result = await runFn(tc);
    results.push(result);
    logger.debug({ test_id: tc.id, passed: result.passed, score: result.score }, "Test done");
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const passRate = results.length > 0 ? (passed / results.length) * 100 : 0;
  const avgLatency =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length
      : 0;

  // Per-category scores
  const categoryMap: Record<string, { passed: number; total: number }> = {};
  for (const r of results) {
    if (!categoryMap[r.category]) categoryMap[r.category] = { passed: 0, total: 0 };
    categoryMap[r.category].total++;
    if (r.passed) categoryMap[r.category].passed++;
  }
  const categoryScores = Object.fromEntries(
    Object.entries(categoryMap).map(([cat, s]) => [
      cat,
      s.total > 0 ? (s.passed / s.total) * 100 : 0,
    ])
  );

  logger.info({ runId, passRate, passed, failed }, "Eval suite complete");

  return {
    run_id: runId,
    total_tests: results.length,
    passed,
    failed,
    pass_rate: passRate,
    avg_latency_ms: avgLatency,
    category_scores: categoryScores,
    results,
    ran_at: new Date().toISOString(),
  };
}

// Cache last result in memory
let _lastEvalResult: EvalRunResult | null = null;

export function cacheEvalResult(result: EvalRunResult): void {
  _lastEvalResult = result;
}

export function getLastEvalResult(): EvalRunResult | null {
  return _lastEvalResult;
}
