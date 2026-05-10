import type { RingTier } from "@/lib/community";

const RING_CONFIG: Record<RingTier, { name: string; hindi: string; icon: string; color: string; bg: string }> = {
  1: { name: "Beej", hindi: "बीज", icon: "🌱", color: "#a3a3a3", bg: "rgba(163,163,163,0.10)" },
  2: { name: "Saathi", hindi: "साथी", icon: "🤝", color: "#7eb8e0", bg: "rgba(126,184,224,0.12)" },
  3: { name: "Sevak", hindi: "सेवक", icon: "🛡️", color: "#9b7fe8", bg: "rgba(155,127,232,0.12)" },
  4: { name: "Sutradhaar", hindi: "सूत्रधार", icon: "🎭", color: "#e07878", bg: "rgba(224,120,120,0.12)" },
  5: { name: "Nirmata", hindi: "निर्माता", icon: "👑", color: "#00E5CC", bg: "rgba(0,229,204,0.12)" },
};

const SIZES = {
  sm: "text-[11px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

export function RingBadge({
  tier,
  size = "sm",
  showHindi = false,
}: {
  tier: RingTier;
  size?: "sm" | "md" | "lg";
  showHindi?: boolean;
}) {
  const cfg = RING_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium font-mono ${SIZES[size]}`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        borderColor: `${cfg.color}40`,
      }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.name}</span>
      {showHindi && <span className="opacity-60">{cfg.hindi}</span>}
    </span>
  );
}
