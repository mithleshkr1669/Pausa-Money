import { motion } from "framer-motion";

export interface Badge {
  key: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const ALL_BADGES: Badge[] = [
  { key: "newcomer",    label: "Newcomer",          emoji: "🌱", description: "Joined the Pausa community",          color: "#a3a3a3" },
  { key: "goal_setter", label: "Goal Setter",        emoji: "🎯", description: "Created your first savings goal",     color: "#7eb8e0" },
  { key: "saver",       label: "Saver",              emoji: "💰", description: "Completed your first savings goal",   color: "#00E5CC" },
  { key: "contributor", label: "Contributor",        emoji: "💬", description: "Asked your first community question", color: "#9b7fe8" },
  { key: "helper",      label: "Helper",             emoji: "🤝", description: "Received 5 upvotes on your answers",  color: "#7eb8e0" },
  { key: "planner",     label: "Financial Planner",  emoji: "📊", description: "Completed your financial profile",   color: "#e0a040" },
  { key: "guardian",    label: "Guardian",           emoji: "🛡️", description: "Reached Guardian ring tier",         color: "#9b7fe8" },
  { key: "founder",     label: "Founder",            emoji: "👑", description: "Reached Founder ring tier",          color: "#00E5CC" },
];

export function BadgeDisplay({ earned }: { earned: string[] }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-5">Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_BADGES.map((badge, i) => {
          const isEarned = earned.includes(badge.key);
          return (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              title={badge.description}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                isEarned
                  ? "border-white/10 bg-white/5"
                  : "border-white/5 bg-white/[0.02] opacity-35 grayscale"
              }`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <div>
                <p className="text-xs font-medium" style={{ color: isEarned ? badge.color : "#555" }}>
                  {badge.label}
                </p>
                {isEarned && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">{badge.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
