import { motion } from "framer-motion";
import { Trash2, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { getCategoryMeta, monthsToGoal, type SavingsGoal } from "@/lib/goals";

interface GoalCardProps {
  goal: SavingsGoal;
  onUpdateProgress: (goalId: string, amount: number) => void;
  onDelete: (goalId: string) => void;
  index?: number;
}

export function GoalCard({ goal, onUpdateProgress, onDelete, index = 0 }: GoalCardProps) {
  const meta = getCategoryMeta(goal.category);
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const months = monthsToGoal(goal.target_amount, goal.current_amount, goal.monthly_contribution);
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`glass-panel rounded-2xl p-5 border transition-colors ${goal.is_completed ? "border-primary/20 bg-primary/5" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{meta.emoji}</div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-sm text-foreground">{goal.name}</h4>
              {goal.is_completed && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{meta.label}</p>
          </div>
        </div>
        <button onClick={() => onDelete(goal.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground font-mono">
            ₹{goal.current_amount.toLocaleString("en-IN")} / ₹{goal.target_amount.toLocaleString("en-IN")}
          </span>
          <span className="text-xs font-bold font-mono" style={{ color: pct >= 100 ? "#00E5CC" : "#7C7C7C" }}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        {goal.monthly_contribution > 0 && (
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            ₹{goal.monthly_contribution.toLocaleString("en-IN")}/mo
          </span>
        )}
        {months !== null && months > 0 && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            ~{months} months to go
          </span>
        )}
        {remaining > 0 && (
          <span className="ml-auto font-mono">₹{remaining.toLocaleString("en-IN")} left</span>
        )}
      </div>

      {/* Update amount */}
      {!goal.is_completed && (
        <div className="mt-4 flex gap-2">
          <input
            type="number"
            placeholder="Add ₹ amount"
            className="flex-1 bg-background border border-white/8 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = parseInt((e.target as HTMLInputElement).value);
                if (!isNaN(val) && val > 0) {
                  onUpdateProgress(goal.id, goal.current_amount + val);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <span className="text-xs text-muted-foreground self-center">↵ Enter</span>
        </div>
      )}
    </motion.div>
  );
}
