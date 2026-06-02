/**
 * Financial calculation tools
 */

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
  format: (result: Record<string, unknown>) => string;
}

export const FINANCIAL_TOOLS: Record<string, ToolDefinition> = {
  calculate_budget: {
    name: "calculate_budget",
    description: "Calculate monthly budget breakdown and savings rate",
    category: "Budget",
    parameters: {
      monthly_income: { type: "number", description: "Total monthly income ($)" },
      housing: { type: "number", description: "Housing costs (rent/mortgage) ($)" },
      food: { type: "number", description: "Food and groceries ($)" },
      transportation: { type: "number", description: "Transportation costs ($)" },
      utilities: { type: "number", description: "Utilities and bills ($)" },
      entertainment: { type: "number", description: "Entertainment and dining ($)" },
      other: { type: "number", description: "Other expenses ($)" },
    },
    execute: async (p) => {
      const income = Number(p.monthly_income) || 0;
      const expenses = {
        housing: Number(p.housing) || 0,
        food: Number(p.food) || 0,
        transportation: Number(p.transportation) || 0,
        utilities: Number(p.utilities) || 0,
        entertainment: Number(p.entertainment) || 0,
        other: Number(p.other) || 0,
      };
      const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
      const savings = income - totalExpenses;
      const savingsRate = income > 0 ? (savings / income) * 100 : 0;
      const expenseRate = income > 0 ? (totalExpenses / income) * 100 : 0;

      const categories = Object.entries(expenses).map(([k, v]) => ({
        name: k,
        amount: v,
        pct: income > 0 ? ((v / income) * 100).toFixed(1) : "0.0",
      }));

      return {
        monthly_income: income,
        total_expenses: totalExpenses,
        savings,
        savings_rate: savingsRate.toFixed(1),
        expense_rate: expenseRate.toFixed(1),
        categories,
        recommendation:
          savingsRate >= 20
            ? "Excellent! You are saving over 20% of your income."
            : savingsRate >= 10
            ? "Good. Try to increase savings toward the 20% goal."
            : savings < 0
            ? "Warning: Expenses exceed income. Review and cut costs."
            : "Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      };
    },
    format: (r) =>
      `Budget Summary: Income $${r.monthly_income}, Expenses $${r.total_expenses}, Savings $${r.savings} (${r.savings_rate}% rate). ${r.recommendation}`,
  },

  calculate_debt_payoff: {
    name: "calculate_debt_payoff",
    description: "Calculate debt payoff timeline and total interest paid",
    category: "Debt",
    parameters: {
      total_debt: { type: "number", description: "Total debt amount ($)" },
      interest_rate: { type: "number", description: "Annual interest rate (%)" },
      monthly_payment: { type: "number", description: "Monthly payment amount ($)" },
    },
    execute: async (p) => {
      const debt = Number(p.total_debt) || 0;
      const annualRate = Number(p.interest_rate) || 0;
      const payment = Number(p.monthly_payment) || 0;
      const monthlyRate = annualRate / 100 / 12;

      if (payment <= 0 || debt <= 0) {
        return { error: "Invalid inputs" };
      }

      let remaining = debt;
      let months = 0;
      let totalInterest = 0;

      while (remaining > 0 && months < 600) {
        const interest = remaining * monthlyRate;
        totalInterest += interest;
        remaining = remaining + interest - payment;
        months++;
        if (remaining < 0) remaining = 0;
      }

      const minPayment = debt * monthlyRate;
      const extraPayment = 500;
      let remainingFast = debt;
      let monthsFast = 0;
      let interestFast = 0;
      while (remainingFast > 0 && monthsFast < 600) {
        const interest = remainingFast * monthlyRate;
        interestFast += interest;
        remainingFast = remainingFast + interest - (payment + extraPayment);
        monthsFast++;
        if (remainingFast < 0) remainingFast = 0;
      }

      return {
        total_debt: debt,
        interest_rate: annualRate,
        monthly_payment: payment,
        months_to_payoff: months,
        years_to_payoff: (months / 12).toFixed(1),
        total_interest: totalInterest.toFixed(2),
        total_paid: (debt + totalInterest).toFixed(2),
        minimum_payment: minPayment.toFixed(2),
        faster_payoff: {
          extra_monthly: extraPayment,
          months: monthsFast,
          interest_saved: (totalInterest - interestFast).toFixed(2),
        },
      };
    },
    format: (r) => {
      const fp = r.faster_payoff as { extra_monthly: number; months: number; interest_saved: string } | undefined;
      return `Debt Payoff: $${r.total_debt} at ${r.interest_rate}% — paid off in ${r.years_to_payoff} years with $${r.total_interest} interest ($${r.total_paid} total). Pay $${fp ? Number(fp.extra_monthly) + Number(r.monthly_payment) : "more"}/mo to save $${fp?.interest_saved ?? "0"}.`;
    },
  },

  calculate_investment_returns: {
    name: "calculate_investment_returns",
    description: "Calculate compound investment growth over time",
    category: "Investment",
    parameters: {
      initial_investment: { type: "number", description: "Initial investment amount ($)" },
      monthly_contribution: { type: "number", description: "Monthly contribution ($)" },
      annual_return: { type: "number", description: "Expected annual return (%)" },
      years: { type: "number", description: "Investment horizon (years)" },
    },
    execute: async (p) => {
      const principal = Number(p.initial_investment) || 0;
      const monthly = Number(p.monthly_contribution) || 0;
      const annualReturn = Number(p.annual_return) || 7;
      const years = Number(p.years) || 10;
      const monthlyRate = annualReturn / 100 / 12;
      const months = years * 12;

      let balance = principal;
      for (let i = 0; i < months; i++) {
        balance = balance * (1 + monthlyRate) + monthly;
      }

      const totalContributed = principal + monthly * months;
      const totalGain = balance - totalContributed;

      const milestones = [5, 10, 20, 30].filter((y) => y <= years).map((y) => {
        let b = principal;
        for (let i = 0; i < y * 12; i++) {
          b = b * (1 + monthlyRate) + monthly;
        }
        return { year: y, balance: b.toFixed(0) };
      });

      return {
        initial_investment: principal,
        monthly_contribution: monthly,
        annual_return: annualReturn,
        years,
        final_balance: balance.toFixed(2),
        total_contributed: totalContributed.toFixed(2),
        total_gain: totalGain.toFixed(2),
        gain_pct: totalContributed > 0 ? ((totalGain / totalContributed) * 100).toFixed(1) : "0",
        milestones,
        rule_of_72: (72 / annualReturn).toFixed(1),
      };
    },
    format: (r) =>
      `Investment Growth: $${r.initial_investment} + $${r.monthly_contribution}/mo at ${r.annual_return}% for ${r.years}yr → $${r.final_balance} (${r.gain_pct}% gain on $${r.total_contributed} contributed).`,
  },

  calculate_mortgage: {
    name: "calculate_mortgage",
    description: "Calculate mortgage payment, total interest, and affordability",
    category: "Housing",
    parameters: {
      home_price: { type: "number", description: "Home purchase price ($)" },
      down_payment: { type: "number", description: "Down payment amount ($)" },
      annual_interest_rate: { type: "number", description: "Annual interest rate (%)" },
      loan_term_years: { type: "number", description: "Loan term (years)" },
      annual_income: { type: "number", description: "Annual household income ($)" },
    },
    execute: async (p) => {
      const price = Number(p.home_price) || 0;
      const down = Number(p.down_payment) || 0;
      const rate = Number(p.annual_interest_rate) || 6.5;
      const termYears = Number(p.loan_term_years) || 30;
      const income = Number(p.annual_income) || 0;

      const principal = price - down;
      const monthlyRate = rate / 100 / 12;
      const nPayments = termYears * 12;

      const monthlyPayment =
        principal *
        ((monthlyRate * Math.pow(1 + monthlyRate, nPayments)) /
          (Math.pow(1 + monthlyRate, nPayments) - 1));

      const totalPaid = monthlyPayment * nPayments;
      const totalInterest = totalPaid - principal;
      const downPct = price > 0 ? (down / price) * 100 : 0;
      const monthlyIncome = income / 12;
      const dtiRatio = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0;

      return {
        home_price: price,
        down_payment: down,
        down_payment_pct: downPct.toFixed(1),
        loan_amount: principal,
        monthly_payment: monthlyPayment.toFixed(2),
        total_paid: totalPaid.toFixed(2),
        total_interest: totalInterest.toFixed(2),
        interest_rate: rate,
        loan_term_years: termYears,
        dti_ratio: dtiRatio.toFixed(1),
        affordable: dtiRatio <= 28,
        pmi_required: downPct < 20,
        recommendation:
          dtiRatio <= 28
            ? "Mortgage is within the recommended 28% DTI ratio."
            : `DTI of ${dtiRatio.toFixed(1)}% exceeds the 28% guideline. Consider a larger down payment or lower price.`,
      };
    },
    format: (r) =>
      `Mortgage: $${r.home_price} home, $${r.down_payment} down (${r.down_payment_pct}%) → $${r.monthly_payment}/mo for ${r.loan_term_years}yr. Total interest: $${r.total_interest}. ${r.recommendation}`,
  },

  calculate_emergency_fund: {
    name: "calculate_emergency_fund",
    description: "Calculate your recommended emergency fund target and savings timeline",
    category: "Budget",
    parameters: {
      monthly_expenses: { type: "number", description: "Total monthly expenses ($)" },
      current_savings: { type: "number", description: "Current emergency savings ($)" },
      monthly_savings_capacity: { type: "number", description: "Amount you can save monthly ($)" },
      months_coverage: { type: "number", description: "Months of coverage goal (3-12)" },
    },
    execute: async (p) => {
      const expenses = Number(p.monthly_expenses) || 0;
      const current = Number(p.current_savings) || 0;
      const capacity = Number(p.monthly_savings_capacity) || 0;
      const coverage = Math.min(Math.max(Number(p.months_coverage) || 6, 1), 12);

      const target = expenses * coverage;
      const gap = Math.max(target - current, 0);
      const monthsToGoal = capacity > 0 ? Math.ceil(gap / capacity) : null;

      return {
        monthly_expenses: expenses,
        current_savings: current,
        target_3_months: (expenses * 3).toFixed(0),
        target_6_months: (expenses * 6).toFixed(0),
        target_12_months: (expenses * 12).toFixed(0),
        recommended_target: target.toFixed(0),
        coverage_months: coverage,
        gap: gap.toFixed(0),
        months_to_goal: monthsToGoal,
        on_track: current >= target,
        current_coverage_months: expenses > 0 ? (current / expenses).toFixed(1) : "0",
        recommendation:
          current >= target
            ? `Great! You have ${(current / expenses).toFixed(1)} months covered. Consider investing surplus.`
            : monthsToGoal
            ? `Save $${capacity}/mo to reach your ${coverage}-month goal in ${monthsToGoal} months.`
            : "Set up automatic transfers to build your emergency fund.",
      };
    },
    format: (r) =>
      `Emergency Fund: Target $${r.recommended_target} (${r.coverage_months}mo). Currently $${r.current_savings} → gap $${r.gap}. ${r.recommendation}`,
  },

  calculate_tax_savings: {
    name: "calculate_tax_savings",
    description: "Estimate tax savings from contributing to tax-advantaged accounts",
    category: "Tax",
    parameters: {
      annual_income: { type: "number", description: "Annual gross income ($)" },
      filing_status: { type: "string", description: "Filing status (single/married)" },
      traditional_401k: { type: "number", description: "Annual 401k contribution ($)" },
      traditional_ira: { type: "number", description: "Annual traditional IRA contribution ($)" },
      hsa: { type: "number", description: "Annual HSA contribution ($)" },
    },
    execute: async (p) => {
      const income = Number(p.annual_income) || 0;
      const status = String(p.filing_status || "single").toLowerCase();
      const k401 = Math.min(Number(p.traditional_401k) || 0, 23000);
      const ira = Math.min(Number(p.traditional_ira) || 0, 7000);
      const hsa = Math.min(Number(p.hsa) || 0, 4150);

      const totalDeductions = k401 + ira + hsa;
      const taxableIncome = Math.max(income - totalDeductions, 0);

      const brackets2024Single = [
        { limit: 11600, rate: 0.1 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
      ];
      const brackets2024Married = [
        { limit: 23200, rate: 0.1 },
        { limit: 94300, rate: 0.12 },
        { limit: 201050, rate: 0.22 },
        { limit: 383900, rate: 0.24 },
        { limit: 487450, rate: 0.32 },
        { limit: 731200, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
      ];

      const brackets = status === "married" ? brackets2024Married : brackets2024Single;

      function calcTax(inc: number) {
        let tax = 0;
        let prev = 0;
        for (const bracket of brackets) {
          if (inc <= prev) break;
          tax += Math.min(inc - prev, bracket.limit - prev) * bracket.rate;
          prev = bracket.limit;
        }
        return tax;
      }

      const taxBefore = calcTax(income);
      const taxAfter = calcTax(taxableIncome);
      const savings = taxBefore - taxAfter;
      const effectiveRateBefore = income > 0 ? (taxBefore / income) * 100 : 0;
      const effectiveRateAfter = taxableIncome > 0 ? (taxAfter / taxableIncome) * 100 : 0;

      return {
        annual_income: income,
        total_deductions: totalDeductions,
        taxable_income: taxableIncome,
        tax_before: taxBefore.toFixed(2),
        tax_after: taxAfter.toFixed(2),
        tax_savings: savings.toFixed(2),
        effective_rate_before: effectiveRateBefore.toFixed(1),
        effective_rate_after: effectiveRateAfter.toFixed(1),
        breakdown: {
          "401k": k401,
          ira,
          hsa,
        },
        max_contributions: {
          "401k_limit": 23000,
          ira_limit: 7000,
          hsa_limit: 4150,
        },
      };
    },
    format: (r) =>
      `Tax Savings: $${r.total_deductions} in deductions reduces taxes by $${r.tax_savings} (from ${r.effective_rate_before}% to ${r.effective_rate_after}% effective rate). Taxable income: $${r.taxable_income}.`,
  },
};

export function getAllTools(): ToolDefinition[] {
  return Object.values(FINANCIAL_TOOLS);
}

export function getTool(name: string): ToolDefinition | undefined {
  return FINANCIAL_TOOLS[name];
}
