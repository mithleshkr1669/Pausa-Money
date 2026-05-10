import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, Target, MessageSquare, X, Loader2, AlertCircle, Trophy, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RingProgress } from "@/components/dashboard/RingProgress";
import { BadgeDisplay } from "@/components/dashboard/BadgeDisplay";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { FinancialAdvisor } from "@/components/dashboard/FinancialAdvisor";
import { useUser } from "@clerk/clerk-react";
import {
  getProfile, upsertProfile, getUserPostCount, getUserUpvotesReceived,
  type Profile, type RingTier,
} from "@/lib/community";
import {
  getGoals, createGoal, updateGoalProgress, deleteGoal, checkMilestoneUpgrade,
  GOAL_CATEGORIES, type SavingsGoal,
} from "@/lib/goals";
import { getFinancialProfile, type FinancialProfile } from "@/lib/financial";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getPosts, type Post } from "@/lib/community";

// ── Badge helper ─────────────────────────────────────────────────────────────
function computeEarnedBadges(
  profile: Profile | null,
  goals: SavingsGoal[],
  postCount: number,
  upvotes: number,
  hasFinancialProfile: boolean
): string[] {
  const badges: string[] = ["newcomer"];
  if (goals.length > 0) badges.push("goal_setter");
  if (goals.some((g) => g.is_completed)) badges.push("saver");
  if (postCount > 0) badges.push("contributor");
  if (upvotes >= 5) badges.push("helper");
  if (hasFinancialProfile) badges.push("planner");
  if ((profile?.ring_tier ?? 1) >= 3) badges.push("guardian");
  if ((profile?.ring_tier ?? 1) >= 5) badges.push("founder");
  return badges;
}

// ── Create Goal Modal ─────────────────────────────────────────────────────────
function CreateGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: SavingsGoal) => void }) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("emergency");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Give your goal a name."); return; }
    if (!target || parseInt(target) <= 0) { setError("Set a target amount."); return; }
    setError(""); setSubmitting(true);
    const { data, error: err } = await createGoal(user.id, {
      name: name.trim(),
      category,
      target_amount: parseInt(target),
      current_amount: 0,
      monthly_contribution: parseInt(monthly) || 0,
      target_date: null,
    });
    setSubmitting(false);
    if (err) { setError(err); return; }
    if (data) onCreated(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-bold">New Savings Goal</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Goal Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Medical Fund" className="w-full bg-background border border-white/8 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${category === c.value ? "border-primary/40 bg-primary/10 text-primary" : "border-white/8 text-muted-foreground hover:border-white/15"}`}>
                  <span>{c.emoji}</span><span className="text-xs">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Target Amount (₹)</label>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 100000" className="w-full bg-background border border-white/8 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Monthly Save (₹)</label>
              <input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="e.g. 5000" className="w-full bg-background border border-white/8 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {submitting ? "Creating..." : "Create Goal"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Upgrade Toast ─────────────────────────────────────────────────────────────
function UpgradeToast({ tierName, onClose }: { tierName: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/30 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 max-w-sm"
    >
      <Trophy className="w-6 h-6 text-primary shrink-0" />
      <div>
        <p className="font-display font-bold text-sm text-foreground">Ring Upgraded!</p>
        <p className="text-xs text-muted-foreground">You've reached <span className="text-primary font-semibold">{tierName}</span></p>
      </div>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function DashboardInner() {
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [financialProfile, setFinancialProfile] = useState<Partial<FinancialProfile> | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [upvotes, setUpvotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [upgradeToast, setUpgradeToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "finance" | "community">("overview");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [p, g, fp, posts, pc, uv] = await Promise.all([
      upsertProfile(user.id, user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User", user.imageUrl ?? undefined),
      getGoals(user.id),
      getFinancialProfile(user.id),
      getPosts(),
      getUserPostCount(user.id),
      getUserUpvotesReceived(user.id),
    ]);
    // Re-fetch profile to get latest tier
    const latest = await getProfile(user.id);
    setProfile(latest ?? p);
    setGoals(g);
    setFinancialProfile(fp);
    setRecentPosts(posts.slice(0, 5));
    setPostCount(pc);
    setUpvotes(uv);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGoalCreated = (g: SavingsGoal) => setGoals((prev) => [g, ...prev]);

  const handleUpdateProgress = async (goalId: string, amount: number) => {
    if (!user) return;
    const { completed, error } = await updateGoalProgress(goalId, amount, user.id);
    if (!error) {
      setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, current_amount: amount, is_completed: completed } : g));
      if (completed) {
        const { upgraded, newTier } = await checkMilestoneUpgrade(user.id);
        if (upgraded && newTier) {
          const { RING_CONFIG } = await import("@/lib/community");
          setUpgradeToast(RING_CONFIG[newTier].name);
          const latest = await getProfile(user.id);
          if (latest) setProfile(latest);
        }
      }
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const earnedBadges = computeEarnedBadges(profile, goals, postCount, upvotes, !!financialProfile);
  const currentTier = (profile?.ring_tier ?? 1) as RingTier;
  const completedGoals = goals.filter((g) => g.is_completed).length;

  const TABS = [
    { id: "overview",   label: "Overview" },
    { id: "goals",      label: `Goals (${goals.length})` },
    { id: "finance",    label: "Financial Advisor" },
    { id: "community",  label: "Community" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">
                Welcome back, {user?.firstName ?? "Explorer"} 👋
              </h1>
              <p className="text-muted-foreground text-sm">Your financial command center.</p>
            </div>
            {!isSupabaseConfigured && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-xs">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span className="text-yellow-400/80">Add Supabase keys to <code className="font-mono bg-yellow-500/10 px-1 rounded">.env</code> to enable all features.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 bg-card border border-white/5 rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Stats */}
                  {[
                    { label: "Goals Created",   value: goals.length,    sub: `${completedGoals} completed`, color: "text-primary" },
                    { label: "Community Posts",  value: postCount,       sub: "questions asked",             color: "text-blue-400" },
                    { label: "Badges Earned",    value: earnedBadges.length, sub: `of ${8}`,                color: "text-purple-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-panel rounded-2xl p-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">{stat.label}</p>
                      <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <RingProgress currentTier={currentTier} completedGoals={completedGoals} hasFinancialProfile={!!financialProfile} />
                <BadgeDisplay earned={earnedBadges} />

                {/* Quick goals preview */}
                {goals.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Goals</h3>
                      <button onClick={() => setActiveTab("goals")} className="text-xs text-primary hover:underline">View all →</button>
                    </div>
                    <div className="space-y-3">
                      {goals.slice(0, 2).map((goal) => {
                        const meta = GOAL_CATEGORIES.find((c) => c.value === goal.category);
                        const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                        return (
                          <div key={goal.id} className="flex items-center gap-3">
                            <span className="text-xl shrink-0">{meta?.emoji ?? "🎯"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate">{goal.name}</span>
                                <span className="text-xs font-mono text-muted-foreground ml-2">{pct.toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Next milestone hint */}
                {currentTier < 5 && (
                  <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="text-foreground font-medium">Next milestone: </span>
                      <span className="text-muted-foreground">
                        {currentTier === 1 && "Complete 1 savings goal + fill your Financial Advisor to reach Companion."}
                        {currentTier === 2 && `Complete ${Math.max(0, 3 - completedGoals)} more goal(s) to reach Guardian.`}
                        {currentTier === 3 && `Complete ${Math.max(0, 6 - completedGoals)} more goal(s) to reach Director.`}
                        {currentTier === 4 && "Founder tier is by selection. Keep contributing!"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GOALS */}
            {activeTab === "goals" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold">Savings Goals</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{completedGoals}/{goals.length} completed</p>
                  </div>
                  <button onClick={() => setShowGoalModal(true)}
                    className="flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" />New Goal
                  </button>
                </div>

                {goals.length === 0 ? (
                  <div className="text-center py-16 glass-panel rounded-2xl">
                    <p className="text-4xl mb-4">🎯</p>
                    <h3 className="text-lg font-display font-semibold mb-2">No goals yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">Create your first savings goal — from emergency fund to home down payment.</p>
                    <button onClick={() => setShowGoalModal(true)}
                      className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                      <Plus className="w-4 h-4" />Create First Goal
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {goals.map((goal, i) => (
                      <GoalCard key={goal.id} goal={goal} index={i}
                        financialProfile={financialProfile}
                        onUpdateProgress={handleUpdateProgress}
                        onDelete={handleDeleteGoal}
                        onContributionUpdated={(id, amount) => {
                          setGoals((prev) => prev.map((g) => g.id === id ? { ...g, monthly_contribution: amount } : g));
                        }} />
                    ))}
                    <button onClick={() => setShowGoalModal(true)}
                      className="glass-panel rounded-2xl p-5 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors h-32">
                      <Plus className="w-6 h-6" />
                      <span className="text-sm">Add Goal</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FINANCIAL ADVISOR */}
            {activeTab === "finance" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-display font-bold">Financial Advisor</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Enter your monthly numbers to get your financial health score and personalized advice.</p>
                </div>
                <FinancialAdvisor
                  userId={user!.id}
                  initialProfile={financialProfile}
                  onSaved={() => {
                    getFinancialProfile(user!.id).then(setFinancialProfile);
                    checkMilestoneUpgrade(user!.id).then(async ({ upgraded, newTier }) => {
                      if (upgraded && newTier) {
                        const { RING_CONFIG } = await import("@/lib/community");
                        setUpgradeToast(RING_CONFIG[newTier].name);
                        const latest = await getProfile(user!.id);
                        if (latest) setProfile(latest);
                      }
                    });
                  }}
                />
              </div>
            )}

            {/* COMMUNITY */}
            {activeTab === "community" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold">Community Activity</h2>
                  <Link href="/community/ask">
                    <button className="flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                      <MessageSquare className="w-4 h-4" />Ask Question
                    </button>
                  </Link>
                </div>

                <div className="glass-panel rounded-2xl p-5 mb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-background/50">
                      <p className="text-2xl font-display font-bold text-primary">{postCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">Posts</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-background/50">
                      <p className="text-2xl font-display font-bold text-secondary">{upvotes}</p>
                      <p className="text-xs text-muted-foreground mt-1">Upvotes Received</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Recent Community Posts</h3>
                {recentPosts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">No posts yet. <Link href="/community/ask"><span className="text-primary hover:underline cursor-pointer">Be first to ask!</span></Link></div>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map((post) => (
                      <Link key={post.id} href={`/community/${post.id}`}>
                        <div className="glass-panel rounded-xl p-4 hover:border-primary/20 transition-colors cursor-pointer">
                          <p className="text-sm font-medium text-foreground mb-1 line-clamp-1">{post.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{post.upvotes} upvotes</span>
                            <span className="opacity-40">·</span>
                            <span>{post.tags?.slice(0, 2).join(", ")}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-center">
                  <Link href="/community"><button className="text-sm text-primary hover:underline">View all community posts →</button></Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Goal modal */}
      {showGoalModal && <CreateGoalModal onClose={() => setShowGoalModal(false)} onCreated={handleGoalCreated} />}

      {/* Upgrade toast */}
      {upgradeToast && <UpgradeToast tierName={upgradeToast} onClose={() => setUpgradeToast(null)} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}
