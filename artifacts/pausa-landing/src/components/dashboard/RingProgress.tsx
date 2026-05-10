import { motion } from "framer-motion";
import { RING_CONFIG, type RingTier } from "@/lib/community";
import { ChevronRight, Lock } from "lucide-react";

const MILESTONES: Record<RingTier, { label: string; criteria: string }> = {
  1: { label: "Newcomer",   criteria: "You're here! Start your journey." },
  2: { label: "Companion",  criteria: "Complete 1 goal + fill your Financial Profile" },
  3: { label: "Guardian",   criteria: "Complete 3 savings goals" },
  4: { label: "Director",   criteria: "Complete 6 savings goals" },
  5: { label: "Founder",    criteria: "Founder-selected — top community contributors" },
};

export function RingProgress({
  currentTier,
  completedGoals,
  hasFinancialProfile,
}: {
  currentTier: RingTier;
  completedGoals: number;
  hasFinancialProfile: boolean;
}) {
  const current = RING_CONFIG[currentTier];
  const nextTier = Math.min(currentTier + 1, 5) as RingTier;
  const next = RING_CONFIG[nextTier];
  const isMaxTier = currentTier === 5;

  // Progress toward next tier
  let progressPct = 100;
  let progressLabel = "";
  if (!isMaxTier) {
    if (currentTier === 1) {
      const goalsDone = hasFinancialProfile ? 1 : 0;
      const profileDone = hasFinancialProfile ? 1 : 0;
      progressPct = ((goalsDone + profileDone) / 2) * 100;
      progressLabel = `${goalsDone + profileDone}/2 criteria met`;
    } else if (currentTier === 2) {
      progressPct = Math.min((completedGoals / 3) * 100, 100);
      progressLabel = `${Math.min(completedGoals, 3)}/3 goals completed`;
    } else if (currentTier === 3) {
      progressPct = Math.min((completedGoals / 6) * 100, 100);
      progressLabel = `${Math.min(completedGoals, 6)}/6 goals completed`;
    } else {
      progressPct = 0;
      progressLabel = "Founder-selected";
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-5">Your Ring Status</h3>

      {/* Current ring */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border"
          style={{ background: current.bg, borderColor: current.border }}
        >
          {current.icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-0.5">Current Ring</p>
          <p className="text-2xl font-display font-bold" style={{ color: current.color }}>{current.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{MILESTONES[currentTier].label}</p>
        </div>
      </div>

      {/* All tiers */}
      <div className="flex items-center justify-between mb-6">
        {([1, 2, 3, 4, 5] as RingTier[]).map((tier) => {
          const cfg = RING_CONFIG[tier];
          const done = tier <= currentTier;
          const active = tier === currentTier;
          return (
            <div key={tier} className="flex flex-col items-center gap-1.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all"
                style={{
                  background: done ? cfg.bg : "rgba(255,255,255,0.03)",
                  borderColor: done ? cfg.border : "rgba(255,255,255,0.08)",
                  transform: active ? "scale(1.15)" : "scale(1)",
                }}
              >
                {done ? cfg.icon : <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />}
              </div>
              <span className="text-[10px] font-mono" style={{ color: done ? cfg.color : "rgba(255,255,255,0.2)" }}>
                {cfg.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress to next */}
      {!isMaxTier && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progress to <span style={{ color: next.color }}>{next.name}</span></span>
            <span className="text-xs font-mono text-muted-foreground">{progressLabel}</span>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${current.color}, ${next.color})` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {MILESTONES[nextTier].criteria}
          </p>
        </div>
      )}
      {isMaxTier && (
        <div className="text-center py-2">
          <p className="text-sm font-display font-semibold" style={{ color: current.color }}>
            👑 You've reached the highest ring!
          </p>
        </div>
      )}
    </div>
  );
}
