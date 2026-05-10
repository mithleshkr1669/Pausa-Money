import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, TrendingUp, Calendar, CheckCircle2, Sun, Edit3, Check } from "lucide-react";
import { getCategoryMeta, monthsToGoal, updateGoalContribution, type SavingsGoal } from "@/lib/goals";
import type { FinancialProfile } from "@/lib/financial";

interface GoalCardProps {
  goal: SavingsGoal;
  financialProfile?: FinancialProfile | null;
  onUpdateProgress: (goalId: string, amount: number) => void;
  onDelete: (goalId: string) => void;
  onContributionUpdated?: (goalId: string, amount: number) => void;
  index?: number;
}

export function GoalCard({ goal, financialProfile, onUpdateProgress, onDelete, onContributionUpdated, index = 0 }: GoalCardProps) {
  const meta = getCategoryMeta(goal.category);
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const months = monthsToGoal(goal.target_amount, goal.current_amount, goal.monthly_contribution);
  const remaining = goal.target_amount - goal.current_amount;
  const [editingContrib, setEditingContrib] = useState(false);
  const [newContrib, setNewContrib] = useState(String(goal.monthly_contribution));
  const [savingContrib, setSavingContrib] = useState(false);

  // Daily budget analysis
  let dailyBudget: number | null = null;
  let dailyContrib: number | null = null;
  if (financialProfile && financialProfile.monthly_income > 0) {
    const monthlyExpenses = financialProfile.housing_expense + financialProfile.food_expense + financialProfile.transport_expense + financialProfile.utilities_expense + financialProfile.insurance_expense + financialProfile.entertainment_expense + financialProfile.other_expense;
    dailyBudget = Math.round(monthlyExpenses / 30);
    dailyContrib = goal.monthly_contribution > 0 ? Math.round(goal.monthly_contribution / 30) : null;
  }

  const handleSaveContrib = async () => {
    const val = parseInt(newContrib);
    if (isNaN(val) || val < 0) return;
    setSavingContrib(true);
    await updateGoalContribution(goal.id, val);
    setSavingContrib(false);
    setEditingContrib(false);
    onContributionUpdated?.(goal.id, val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`glass-panel rounded-2xl p-5 border transition-colors ${goal.is_completed ? "border-primary/20 bg-primary/5" : ""}`}
    >
      {/* Header */}
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

      {/* Progress */}
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

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-3">
        {/* Editable monthly contribution */}
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {editingContrib ? (
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground font-mono">₹</span>
              <input
                type="number"
                value={newContrib}
                onChange={(e) => setNewContrib(e.target.value)}
                className="w-20 bg-background border border-white/10 rounded px-1 py-0.5 text-xs font-mono focus:outline-none focus:border-primary/40"
                autoFocus
              />
              <button onClick={handleSaveContrib} disabled={savingContrib} className="text-primary hover:text-primary/80">
                <Check className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : (
            <button onClick={() => setEditingContrib(true)} className="flex items-center gap-1 hover:text-primary transition-colors group">
              ₹{goal.monthly_contribution.toLocaleString("en-IN")}/mo
              <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {months !== null && months > 0 && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />~{months} months
          </span>
        )}

        {remaining > 0 && (
          <span className="ml-auto font-mono">₹{remaining.toLocaleString("en-IN")} left</span>
        )}
      </div>

      {/* Daily budget insight */}
      {dailyBudget !== null && !goal.is_completed && (
        <div className="bg-background/50 border border-white/5 rounded-xl px-3 py-2 mb-3">
          <div className="flex items-start gap-2">
            <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Daily budget: </span>
              ₹{dailyBudget.toLocaleString("en-IN")}/day from expenses.
              {dailyContrib !== null && dailyContrib > 0 && (
                <> Saving ₹{dailyContrib.toLocaleString("en-IN")}/day toward this goal.</>
              )}
              {months && months > 0 && dailyContrib !== null && (
                <> Staying under budget each day shortens your timeline.</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add amount */}
      {!goal.is_completed && (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Add ₹ today"
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
          <span className="text-xs text-muted-foreground self-center whitespace-nowrap">↵ Enter</span>
        </div>
      )}
    </motion.div>
  );
}
