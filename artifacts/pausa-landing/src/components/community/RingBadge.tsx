import { RING_CONFIG, type RingTier } from "@/lib/community";

const SIZES = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

export function RingBadge({ tier, size = "sm" }: { tier: RingTier; size?: "sm" | "md" | "lg" }) {
  const cfg = RING_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium font-mono ${SIZES[size]}`}
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.name}</span>
    </span>
  );
}
