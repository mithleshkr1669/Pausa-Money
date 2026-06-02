import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Home, Wallet, Shield, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useCurrency, fmtCurrency, fmtCurrencyRaw } from "@/hooks/useCurrency";
import { AppShell, NavItem } from "@/components/layout/Appshell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const PALETTE = [
  "#00f5d4",
  "#40e0ff",
  "#a78bfa",
  "#f59e0b",
  "#34d399",
  "#f87171",
];

const TOOLTIP_STYLE = {
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 8,
  fontSize: 12,
  color: "#ffffff",
};
const TOOLTIP_LABEL = { color: "#ffffff", fontWeight: 600 };
const TOOLTIP_ITEM = { color: "#ffffff" };
type ToolId = "sip" | "budget" | "mortgage" | "debt" | "emergency";

interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}

const TOOLS: ToolDef[] = [
  {
    id: "sip",
    label: "SIP Calculator",
    icon: TrendingUp,
    tagline: "Investment growth",
  },
  {
    id: "budget",
    label: "Budget Planner",
    icon: Wallet,
    tagline: "Cash flow analysis",
  },
  {
    id: "mortgage",
    label: "Mortgage / EMI",
    icon: Home,
    tagline: "Home affordability",
  },
  {
    id: "debt",
    label: "Debt Payoff",
    icon: ArrowRight,
    tagline: "Payoff strategy",
  },
  {
    id: "emergency",
    label: "Emergency Fund",
    icon: Shield,
    tagline: "Safety net goal",
  },
];

export default function ToolsPageV2() {
  const [activeTool, setActiveTool] = useState<ToolId>("sip");

  return (
    <div className="flex h-full flex-col">
      {/* Internal Tools Selector */}
      <div className="border-b border-white/10 bg-card px-6 py-3">
        <div className="flex gap-10 overflow-x-auto pb-1 justify-center items-start">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-primary text-black font-medium"
                    : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold font-display">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {activeTool === "sip" && <SIPCalculator />}
          {activeTool === "budget" && <BudgetCalculator />}
          {activeTool === "mortgage" && <MortgageCalculator />}
          {activeTool === "debt" && <DebtPayoffCalculator />}
          {activeTool === "emergency" && <EmergencyFundCalculator />}
        </div>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <span className="text-sm font-semibold text-primary">
          {format(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-white/7 bg-white/2">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function SIPCalculator() {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);
  const fmtR = (v: number) => fmtCurrencyRaw(v, currency);
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(20);

  const { chartData, finalBalance, totalInvested, totalGain, gainPct } =
    useMemo(() => {
      const data = [];
      let balance = 0;
      const mr = rate / 100 / 12;
      for (let y = 1; y <= years; y++) {
        for (let m = 0; m < 12; m++) balance = balance * (1 + mr) + monthly;
        const invested = monthly * 12 * y;
        data.push({
          year: `Y${y}`,
          invested: Math.round(invested),
          total: Math.round(balance),
        });
      }
      const final = data[data.length - 1];
      const ti = monthly * 12 * years;
      const gain = (final?.total || 0) - ti;
      return {
        chartData: data,
        finalBalance: final?.total || 0,
        totalInvested: ti,
        totalGain: gain,
        gainPct: ti > 0 ? ((gain / ti) * 100).toFixed(0) : "0",
      };
    }, [monthly, rate, years]);

  const pieData = [
    { name: "Invested", value: totalInvested },
    { name: "Returns", value: totalGain },
  ];
  const xInterval = Math.max(0, Math.floor(years / 7));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold font-lora mb-0.5">
          SIP Investment Calculator
        </h2>
        <p className="text-xs text-muted-foreground">
          Systematic Investment Plan — monthly compounding
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultCard
          label="Final Value"
          value={fmt(finalBalance)}
          sub="After all growth"
        />
        <ResultCard
          label="Total Invested"
          value={fmt(totalInvested)}
          sub={`${years * 12} payments`}
        />
        <ResultCard
          label="Total Returns"
          value={fmt(totalGain)}
          sub={`${gainPct}% gain`}
        />
      </div>
      <div className="p-5 rounded-xl border border-border bg-card space-y-5">
        <SliderField
          label="Monthly Investment"
          value={monthly}
          min={500}
          max={100000}
          step={500}
          format={fmtR}
          onChange={setMonthly}
        />
        <SliderField
          label="Expected Annual Return"
          value={rate}
          min={4}
          max={20}
          step={0.5}
          format={(v) => `${v}%`}
          onChange={setRate}
        />
        <SliderField
          label="Investment Duration"
          value={years}
          min={1}
          max={40}
          step={1}
          format={(v) => `${v} yr`}
          onChange={setYears}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Growth Over Time
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="sipI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40e0ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#40e0ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sipG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f5d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="year"
                tick={{ fill: "#555", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={xInterval}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fill: "#555", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(v) => fmt(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, color: "#666" }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="invested"
                name="Invested"
                stroke="#40e0ff"
                fill="url(#sipI)"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Value"
                stroke="#00f5d4"
                fill="url(#sipG)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Composition
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={28}
                paddingAngle={3}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#40e0ff" : "#00f5d4"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmt(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, color: "#666" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function BudgetCalculator() {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);
  const fmtR = (v: number) => fmtCurrencyRaw(v, currency);
  const [income, setIncome] = useState(50000);
  const [housing, setHousing] = useState(15000);
  const [food, setFood] = useState(8000);
  const [transport, setTransport] = useState(5000);
  const [utilities, setUtilities] = useState(3000);
  const [entertainment, setEntertainment] = useState(4000);

  const totalExpenses = housing + food + transport + utilities + entertainment;
  const actualSavings = Math.max(0, income - totalExpenses);
  const savingsRate =
    income > 0 ? ((actualSavings / income) * 100).toFixed(1) : "0";

  const pieData = [
    { name: "Housing", value: housing },
    { name: "Food", value: food },
    { name: "Transport", value: transport },
    { name: "Utilities", value: utilities },
    { name: "Entertainment", value: entertainment },
    { name: "Savings", value: actualSavings },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold font-lora mb-0.5">
          Budget Planner
        </h2>
        <p className="text-xs text-muted-foreground">
          Visualize your monthly cash flow in real-time
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultCard label="Monthly Income" value={fmtR(income)} />
        <ResultCard
          label="Savings"
          value={fmtR(actualSavings)}
          sub={`${savingsRate}% savings rate`}
        />
        <ResultCard
          label="Status"
          value={
            Number(savingsRate) >= 20
              ? "Excellent"
              : Number(savingsRate) >= 10
                ? "Good"
                : "Needs work"
          }
          sub={`${savingsRate}% saved`}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-5 rounded-xl border border-border bg-card space-y-4">
          <SliderField
            label="Monthly Income"
            value={income}
            min={5000}
            max={500000}
            step={1000}
            format={fmtR}
            onChange={setIncome}
          />
          <SliderField
            label="Housing / Rent"
            value={housing}
            min={0}
            max={Math.max(Math.round(income * 0.6), 1000)}
            step={500}
            format={fmtR}
            onChange={setHousing}
          />
          <SliderField
            label="Food & Groceries"
            value={food}
            min={0}
            max={30000}
            step={500}
            format={fmtR}
            onChange={setFood}
          />
          <SliderField
            label="Transportation"
            value={transport}
            min={0}
            max={20000}
            step={500}
            format={fmtR}
            onChange={setTransport}
          />
          <SliderField
            label="Utilities"
            value={utilities}
            min={0}
            max={15000}
            step={250}
            format={fmtR}
            onChange={setUtilities}
          />
          <SliderField
            label="Entertainment"
            value={entertainment}
            min={0}
            max={20000}
            step={500}
            format={fmtR}
            onChange={setEntertainment}
          />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Allocation
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={28}
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmtR(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, color: "#666" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MortgageCalculator() {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);
  const [homePrice, setHomePrice] = useState(5000000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const { monthly, totalInterest, totalPaid, barData } = useMemo(() => {
    const down = homePrice * (downPct / 100);
    const loan = homePrice - down;
    const mr = rate / 100 / 12;
    const n = years * 12;
    const mp =
      n > 0 && mr > 0
        ? (loan * (mr * Math.pow(1 + mr, n))) / (Math.pow(1 + mr, n) - 1)
        : loan / n;
    const tp = mp * n;
    const ti = tp - loan;
    return {
      monthly: mp,
      totalInterest: ti,
      totalPaid: tp,
      loanAmount: loan,
      barData: [
        { name: "Down Payment", value: Math.round(down) },
        { name: "Principal", value: Math.round(loan) },
        { name: "Interest", value: Math.round(ti) },
      ],
    };
  }, [homePrice, downPct, rate, years]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold font-lora mb-0.5">
          Mortgage / Home Loan Calculator
        </h2>
        <p className="text-xs text-muted-foreground">
          Monthly EMI and total cost breakdown
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultCard
          label="Monthly EMI"
          value={fmt(monthly)}
          sub="Principal + interest"
        />
        <ResultCard
          label="Total Interest"
          value={fmt(totalInterest)}
          sub={`Over ${years} years`}
        />
        <ResultCard
          label="Total Cost"
          value={fmt(totalPaid + homePrice * (downPct / 100))}
          sub="Including down payment"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <SliderField
            label="Home Price"
            value={homePrice}
            min={500000}
            max={50000000}
            step={100000}
            format={fmt}
            onChange={setHomePrice}
          />
          <SliderField
            label="Down Payment"
            value={downPct}
            min={3}
            max={50}
            step={1}
            format={(v) => `${v}%`}
            onChange={setDownPct}
          />
          <SliderField
            label="Annual Interest Rate"
            value={rate}
            min={5}
            max={18}
            step={0.1}
            format={(v) => `${v.toFixed(1)}%`}
            onChange={setRate}
          />
          <SliderField
            label="Loan Term"
            value={years}
            min={5}
            max={30}
            step={5}
            format={(v) => `${v} yr`}
            onChange={setYears}
          />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Cost Breakdown
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 4, right: 8, bottom: 4, left: 85 }}
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
                {barData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DebtPayoffCalculator() {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);
  const [debt, setDebt] = useState(500000);
  const [rate, setRate] = useState(18);
  const [payment, setPayment] = useState(20000);

  const {
    months,
    totalInterest,
    extra500Months,
    interestSaved,
    chartData,
    extraPayment,
  } = useMemo(() => {
    const mr = rate / 100 / 12;
    const extra = Math.max(Math.round(payment * 0.1), 1000);
    const calc = (pmt: number) => {
      let rem = debt,
        mo = 0,
        ti = 0;
      while (rem > 0 && mo < 600) {
        const int = rem * mr;
        ti += int;
        rem = rem + int - pmt;
        mo++;
        if (rem < 0) rem = 0;
      }
      return { mo, ti };
    };
    const { mo, ti } = calc(payment);
    const { mo: moFast, ti: tiFast } = calc(payment + extra);
    const data = [];
    let b = debt;
    for (let m = 1; m <= mo && m <= 60; m++) {
      b = Math.max(0, b + b * mr - payment);
      if (m % Math.max(1, Math.floor(mo / 8)) === 0 || m === mo)
        data.push({ label: `M${m}`, balance: Math.round(b) });
    }
    return {
      months: mo,
      totalInterest: ti,
      extra500Months: moFast,
      interestSaved: ti - tiFast,
      chartData: data,
      extraPayment: extra,
    };
  }, [debt, rate, payment]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold font-lora mb-0.5">
          Debt Payoff Calculator
        </h2>
        <p className="text-xs text-muted-foreground">
          See how quickly you can become debt-free
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultCard
          label="Payoff Time"
          value={`${(months / 12).toFixed(1)} yr`}
          sub={`${months} months`}
        />
        <ResultCard
          label="Total Interest"
          value={fmt(totalInterest)}
          sub="At current payment"
        />
        <ResultCard
          label={`Save with +${fmt(extraPayment)}/mo`}
          value={fmt(interestSaved)}
          sub={`Done in ${(extra500Months / 12).toFixed(1)} yr`}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <SliderField
            label="Total Debt"
            value={debt}
            min={10000}
            max={5000000}
            step={10000}
            format={fmt}
            onChange={setDebt}
          />
          <SliderField
            label="Annual Interest Rate"
            value={rate}
            min={1}
            max={36}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={setRate}
          />
          <SliderField
            label="Monthly Payment"
            value={payment}
            min={1000}
            max={200000}
            step={1000}
            format={fmt}
            onChange={setPayment}
          />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Balance Over Time
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#555", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fill: "#555", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(v) => fmt(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#f87171"
                fill="url(#debtGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EmergencyFundCalculator() {
  const { currency } = useCurrency();
  const fmt = (v: number) => fmtCurrency(v, currency);
  const [expenses, setExpenses] = useState(30000);
  const [current, setCurrent] = useState(50000);
  const [capacity, setCapacity] = useState(10000);
  const [targetMonths, setTargetMonths] = useState(6);

  const target = expenses * targetMonths;
  const gap = Math.max(0, target - current);
  const monthsToGoal = capacity > 0 ? Math.ceil(gap / capacity) : null;
  const currentCoverage = expenses > 0 ? current / expenses : 0;
  const onTrack = current >= target;

  const barData = [
    { name: "Current", value: current },
    { name: "3-mo", value: expenses * 3 },
    { name: "6-mo", value: expenses * 6 },
    { name: `${targetMonths}-mo`, value: target },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold font-lora mb-0.5">
          Emergency Fund Calculator
        </h2>
        <p className="text-xs text-muted-foreground">
          How long until your safety net is ready
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultCard
          label="Target"
          value={fmt(target)}
          sub={`${targetMonths} months coverage`}
        />
        <ResultCard
          label="Current Coverage"
          value={`${currentCoverage.toFixed(1)} mo`}
          sub={fmt(current)}
        />
        <ResultCard
          label={onTrack ? "Status" : "Months to Goal"}
          value={
            onTrack
              ? "Fully Funded"
              : monthsToGoal
                ? `${monthsToGoal} months`
                : "Set savings"
          }
          sub={
            onTrack
              ? "Consider investing surplus"
              : gap > 0
                ? `Gap: ${fmt(gap)}`
                : undefined
          }
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <SliderField
            label="Monthly Expenses"
            value={expenses}
            min={5000}
            max={200000}
            step={1000}
            format={fmt}
            onChange={setExpenses}
          />
          <SliderField
            label="Current Savings"
            value={current}
            min={0}
            max={Math.max(target * 2, 100000)}
            step={5000}
            format={fmt}
            onChange={setCurrent}
          />
          <SliderField
            label="Monthly Savings Capacity"
            value={capacity}
            min={0}
            max={100000}
            step={1000}
            format={fmt}
            onChange={setCapacity}
          />
          <SliderField
            label="Target Coverage"
            value={targetMonths}
            min={1}
            max={12}
            step={1}
            format={(v) => `${v} mo`}
            onChange={setTargetMonths}
          />
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Fund Targets
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={barData}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#666", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fill: "#555", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(v) => fmt(v as number)}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL}
                itemStyle={TOOLTIP_ITEM}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === 0
                        ? onTrack
                          ? "#00f5d4"
                          : "#f87171"
                        : PALETTE[i % PALETTE.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
