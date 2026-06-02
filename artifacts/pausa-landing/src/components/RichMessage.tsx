import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useCurrency, fmtCurrency } from "@/hooks/useCurrency";
import {
  FinancialConfirmCard,
  TransactionConfirmCard,
} from "@/components/FinancialConfirmCard";
import type {
  FinancialConfirmData,
  TransactionConfirmData,
} from "@/components/FinancialConfirmCard";

interface ChartConfig {
  type: "bar" | "line" | "pie" | "area";
  title: string;
  data: Array<Record<string, unknown>>;
  xKey?: string;
  yKey?: string;
  color?: string;
  keys?: string[];
  colors?: string[];
}

type ParsedPart =
  | { type: "text"; value: string }
  | { type: "chart"; value: ChartConfig }
  | { type: "confirm-financials"; value: FinancialConfirmData }
  | { type: "confirm-transactions"; value: TransactionConfirmData };

const PALETTE = [
  "#00f5d4",
  "#40e0ff",
  "#a78bfa",
  "#f59e0b",
  "#34d399",
  "#f87171",
  "#60a5fa",
  "#fb923c",
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

/* ------------------------------------------------------------------ */
/* Chart Block                                                         */
/* ------------------------------------------------------------------ */
function ChartBlock({ config }: { config: ChartConfig }) {
  const { currency } = useCurrency();
  const color = config.color || PALETTE[0];

  const fmt = (v: number | string) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (isNaN(n)) return String(v);
    return fmtCurrency(n, currency);
  };

  // For XAxis: show max 7 ticks to avoid crowding
  const dataLen = config.data.length;
  const xInterval = dataLen > 8 ? Math.floor(dataLen / 6) : 0;

  return (
    <div className="my-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
      {config.title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          {config.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        {config.type === "pie" ? (
          <PieChart>
            <Pie
              data={config.data}
              dataKey={config.yKey || "value"}
              nameKey={config.xKey || "name"}
              cx="50%"
              cy="50%"
              outerRadius={85}
              innerRadius={30}
              paddingAngle={2}
            >
              {config.data.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    (config.colors && config.colors[i]) ||
                    PALETTE[i % PALETTE.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => fmt(v as number)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#888" }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        ) : config.type === "area" ? (
          <AreaChart
            data={config.data}
            margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
          >
            <defs>
              <linearGradient
                id={`grad-${config.title?.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey={config.xKey || "name"}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => fmt(v as number)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
            />
            {(config.keys || [config.yKey || "value"]).map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stroke={
                  (config.colors && config.colors[i]) ||
                  PALETTE[i % PALETTE.length]
                }
                fill={`url(#grad-${config.title?.replace(/\s/g, "")})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </AreaChart>
        ) : config.type === "line" ? (
          <LineChart
            data={config.data}
            margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey={config.xKey || "name"}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => fmt(v as number)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#888" }}
              iconType="circle"
              iconSize={8}
            />
            {(config.keys || [config.yKey || "value"]).map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={
                  (config.colors && config.colors[i]) ||
                  PALETTE[i % PALETTE.length]
                }
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart
            data={config.data}
            margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey={config.xKey || "name"}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={xInterval}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: "#666", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => fmt(v as number)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#888" }}
              iconType="circle"
              iconSize={8}
            />
            {(config.keys || [config.yKey || "value"]).map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                fill={
                  (config.colors && config.colors[i]) ||
                  PALETTE[i % PALETTE.length]
                }
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */
function parseContent(content: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  // Match ```chart blocks, :::confirm-financials blocks, :::confirm-transactions blocks
  const regex =
    /```chart\n([\s\S]*?)```|:::confirm-financials\n([\s\S]*?):::|:::confirm-transactions\n([\s\S]*?):::/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }
    if (match[1] !== undefined) {
      // chart block
      try {
        parts.push({
          type: "chart",
          value: JSON.parse(match[1]) as ChartConfig,
        });
      } catch {
        parts.push({ type: "text", value: match[0] });
      }
    } else if (match[2] !== undefined) {
      // confirm-financials block
      try {
        parts.push({
          type: "confirm-financials",
          value: JSON.parse(match[2]) as FinancialConfirmData,
        });
      } catch {
        parts.push({ type: "text", value: match[0] });
      }
    } else if (match[3] !== undefined) {
      // confirm-transactions block
      try {
        parts.push({
          type: "confirm-transactions",
          value: JSON.parse(match[3]) as TransactionConfirmData,
        });
      } catch {
        parts.push({ type: "text", value: match[0] });
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }
  return parts;
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
interface RichMessageProps {
  content: string;
  isLatest?: boolean;
  onConfirmAndAnalyze?: (summary: string, transactions: Transaction[]) => void;
}

export function RichMessage({
  content,
  isLatest = false,
  onConfirmAndAnalyze,
}: RichMessageProps) {
  const parts = useMemo(() => parseContent(content), [content]);

  return (
    <div className="ai-prose text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === "chart") {
          return <ChartBlock key={i} config={part.value} />;
        }
        if (part.type === "confirm-financials") {
          return <FinancialConfirmCard key={i} data={part.value} />;
        }
        if (part.type === "confirm-transactions") {
          return (
            <TransactionConfirmCard
              key={i}
              data={part.value}
              onConfirmAndAnalyze={isLatest ? onConfirmAndAnalyze : undefined}
            />
          );
        }
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {part.value as string}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
