import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Plus,
  Target,
  X,
  Loader2,
  AlertCircle,
  Sprout,
  TrendingUp,
  BarChart3,
  Users,
  Bot,
  ChevronUp,
  ChevronDown,
  UserCircle,
  ToolCase,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/Appshell";
import { RingProgress } from "@/components/dashboard/RingProgress";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { FinancialAdvisor } from "@/components/dashboard/FinancialAdvisor";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useUser } from "@clerk/clerk-react";
import {
  getProfile,
  upsertProfile,
  getUserPostCount,
  getUserUpvotesReceived,
  RING_CONFIG,
  type Profile,
  type RingTier,
} from "@/lib/community";
import {
  getGoals,
  createGoal,
  updateGoalProgress,
  deleteGoal,
  checkMilestoneUpgrade,
  GOAL_CATEGORIES,
  getCategoryMeta,
  type SavingsGoal,
} from "@/lib/goals";
import { getFinancialProfile, type FinancialProfile } from "@/lib/financial";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getPosts, type Post } from "@/lib/community";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import ProfilePage from "./Profile";
import { useProfile } from "@/hooks/useProfile";
import ToolsPageV2 from "./Tools_v2";
import { AnalysisPage } from "./Analysis";
import { ChatPageV2 } from "./ChatV2";
// ── Goals top bar ─────────────────────────────────────────────────────────────
function GoalsTopBar({
  goals,
  onAddGoal,
}: {
  goals: SavingsGoal[];
  onAddGoal: () => void;
}) {
  if (goals.length === 0)
    return (
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="text-xs text-muted-foreground">No goals yet —</span>
        <button
          onClick={onAddGoal}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="w-3 h-3" />
          Create your first goal
        </button>
      </div>
    );

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono shrink-0 mr-1">
        Goals
      </span>
      {goals.map((g) => {
        const meta = getCategoryMeta(g.category);
        const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
        return (
          <div
            key={g.id}
            className="flex items-center gap-2 bg-white/3 border border-white/6 rounded-lg px-2.5 py-1.5 shrink-0"
          >
            <span className="text-sm">{meta.emoji}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground/80 truncate max-w-[90px]">
                {g.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
            {g.is_completed && (
              <span className="text-[10px] text-primary shrink-0">✓</span>
            )}
          </div>
        );
      })}
      <button
        onClick={onAddGoal}
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-dashed border-white/15 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Create Goal Modal ─────────────────────────────────────────────────────────
function CreateGoalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (g: SavingsGoal) => void;
}) {
  const clerk = isClerkConfigured ? useClerkUser() : { user: null };
  const user = clerk.user;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("emergency");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError("Give your goal a name.");
      return;
    }
    if (!target || parseInt(target) <= 0) {
      setError("Set a target amount.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { data, error: err } = await createGoal(user.id, {
      name: name.trim(),
      category,
      target_amount: parseInt(target),
      current_amount: 0,
      monthly_contribution: parseInt(monthly) || 0,
      target_date: null,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (data) onCreated(data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-bold">New Savings Goal</h3>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. Emergency Medical Fund)"
            className="w-full bg-background border border-white/8 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          />
          <div className="grid grid-cols-2 gap-2">
            {GOAL_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${category === c.value ? "border-primary/40 bg-primary/10 text-primary" : "border-white/8 text-muted-foreground hover:border-white/15"}`}
              >
                <span>{c.emoji}</span>
                <span className="text-xs">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target ₹"
              className="w-full bg-background border border-white/8 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="Monthly save ₹"
              className="w-full bg-background border border-white/8 rounded-xl px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            {submitting ? "Creating..." : "Create Goal"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Upgrade Toast ─────────────────────────────────────────────────────────────
function UpgradeToast({
  tierName,
  ringIcon,
  onClose,
}: {
  tierName: string;
  ringIcon: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/30 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 max-w-sm"
    >
      <span className="text-2xl">{ringIcon}</span>
      <div>
        <p className="font-display font-bold text-sm">Ring Upgraded!</p>
        <p className="text-xs text-muted-foreground">
          You've reached{" "}
          <span className="text-primary font-semibold">{tierName}</span> 🎉
        </p>
      </div>
      <button
        onClick={onClose}
        className="ml-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({
  profile,
  goals,
  completedGoals,
  financialProfile,
  recentPosts,
  postCount,
  setActiveItem,
}: {
  profile: Profile | null;
  goals: SavingsGoal[];
  completedGoals: number;
  financialProfile: FinancialProfile | null;
  recentPosts: Post[];
  postCount: number;
  setActiveItem: (id: string) => void;
}) {
  const currentTier = (profile?.ring_tier ?? 1) as RingTier;
  const ring = RING_CONFIG[currentTier];
  const totalExpenses = financialProfile
    ? financialProfile.housing_expense +
      financialProfile.food_expense +
      financialProfile.transport_expense +
      financialProfile.utilities_expense +
      financialProfile.insurance_expense +
      financialProfile.entertainment_expense +
      financialProfile.other_expense
    : 0;
  const savings = financialProfile
    ? financialProfile.monthly_income - totalExpenses
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Goals",
            value: goals.length,
            sub: `${completedGoals} done`,
            icon: <Target className="w-4 h-4" />,
            color: "text-primary",
            onClick: () => setActiveItem("goals"),
          },
          {
            label: "Monthly Save",
            value: financialProfile
              ? `₹${savings.toLocaleString("en-IN")}`
              : "—",
            sub: "from your plan",
            icon: <TrendingUp className="w-4 h-4" />,
            color: "text-green-400",
            onClick: () => setActiveItem("finance"),
          },
          {
            label: "Community",
            value: postCount,
            sub: "posts asked",
            icon: <Users className="w-4 h-4" />,
            color: "text-blue-400",
            onClick: () => {},
          },
          {
            label: "Ring Level",
            value: ring.icon,
            sub: ring.name,
            icon: <Sprout className="w-4 h-4" />,
            color: "text-primary",
            onClick: () => setActiveItem("ring"),
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className="glass-panel rounded-2xl p-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </button>
        ))}
      </div> */}

      {/* Ring summary */}
      <RingProgress
        currentTier={currentTier}
        completedGoals={completedGoals}
        hasFinancialProfile={!!financialProfile}
      />

      {/* Recent community posts */}
      {recentPosts.length > 0 && (
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Recent Community
            </h3>
            <Link href="/community">
              <button className="text-xs text-primary hover:underline">
                View all →
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentPosts.slice(0, 3).map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <div className="p-3 rounded-xl bg-white/2 hover:bg-white/5 transition-colors cursor-pointer">
                  <p className="text-sm font-medium line-clamp-1">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.upvotes} upvotes · {post.tags?.slice(0, 2).join(", ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Goals Tab ─────────────────────────────────────────────────────────────────
function GoalsTab({
  goals,
  financialProfile,
  onUpdateProgress,
  onDelete,
  onContributionUpdated,
  onAddGoal,
}: {
  goals: SavingsGoal[];
  financialProfile: FinancialProfile | null;
  onUpdateProgress: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onContributionUpdated: (id: string, amount: number) => void;
  onAddGoal: () => void;
}) {
  const completedGoals = goals.filter((g) => g.is_completed).length;
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold">Savings Goals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {completedGoals}/{goals.length} completed
          </p>
        </div>
        <button
          onClick={onAddGoal}
          className="flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>
      {goals.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl">
          <p className="text-4xl mb-4">🎯</p>
          <h3 className="text-lg font-display font-semibold mb-2">
            No goals yet
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first savings goal — emergency fund, home, vacation.
          </p>
          <button
            onClick={onAddGoal}
            className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={i}
              financialProfile={financialProfile}
              onUpdateProgress={onUpdateProgress}
              onDelete={onDelete}
              onContributionUpdated={onContributionUpdated}
            />
          ))}
          <button
            onClick={onAddGoal}
            className="glass-panel rounded-2xl p-5 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors h-32"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm">Add Goal</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Ring Tab ──────────────────────────────────────────────────────────────────
function RingTab({
  profile,
  completedGoals,
  financialProfile,
}: {
  profile: Profile | null;
  completedGoals: number;
  financialProfile: FinancialProfile | null;
}) {
  const currentTier = (profile?.ring_tier ?? 1) as RingTier;
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-display font-bold">Your Growth Ring</h2>
      <RingProgress
        currentTier={currentTier}
        completedGoals={completedGoals}
        hasFinancialProfile={!!financialProfile}
      />
      {/* Full ring guide */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Complete Ring Guide
        </h3>
        <div className="space-y-3">
          {([1, 2, 3, 4, 5] as RingTier[]).map((tier) => {
            const cfg = RING_CONFIG[tier];
            const isActive = tier === currentTier;
            const isDone = tier < currentTier;
            return (
              <div
                key={tier}
                className={`rounded-xl p-4 border transition-all ${isActive ? "border-primary/30 bg-primary/5" : "border-white/5"}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{cfg.icon}</span>
                  <div>
                    <p
                      className="font-bold text-sm"
                      style={{ color: cfg.color }}
                    >
                      {cfg.name} {isDone ? "✓" : isActive ? "(current)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cfg.milestone}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/80 pl-8 leading-relaxed">
                  <span className="text-foreground/60 font-medium">How: </span>
                  {cfg.howTo}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function DashboardInner() {
  // const { user } = isClerkConfigured
  //   ? require("@clerk/clerk-react").useUser()
  //   : { user: null };
  const clerk = isClerkConfigured ? useClerkUser() : { user: null };
  const user = clerk.user;
  const { profile, loading: profileLoading } = useProfile();
  // const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [financialProfile, setFinancialProfile] =
    useState<FinancialProfile | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [upgradeToast, setUpgradeToast] = useState<{
    name: string;
    icon: string;
  } | null>(null);
  const [activeItem, setActiveItem] = useState("overview");

  // const loadData = useCallback(async () => {
  //   if (!user) return;
  //   setLoading(true);
  //   const [p, g, fp, posts, pc] = await Promise.all([
  //     upsertProfile(
  //       user.id,
  //       user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
  //       user.imageUrl ?? undefined,
  //     ),
  //     getGoals(user.id),
  //     getFinancialProfile(user.id),
  //     getPosts(),
  //     getUserPostCount(user.id),
  //   ]);
  //   const latest = await getProfile(user.id);
  //   // setProfile(latest ?? p);
  //   setGoals(g);
  //   setFinancialProfile(fp);
  //   setRecentPosts(posts.slice(0, 5));
  //   setPostCount(pc);
  //   setLoading(false);
  // }, [user]);
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [g, fp, posts, pc] = await Promise.all([
      getGoals(user.id),
      getFinancialProfile(user.id),
      getPosts(),
      getUserPostCount(user.id),
    ]);

    setGoals(g);
    setFinancialProfile(fp);
    setRecentPosts(posts.slice(0, 5));
    setPostCount(pc);
    setLoading(false);
  }, [user]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGoalCreated = (g: SavingsGoal) =>
    setGoals((prev) => [g, ...prev]);

  const handleUpdateProgress = async (goalId: string, amount: number) => {
    if (!user) return;
    const { completed, error } = await updateGoalProgress(
      goalId,
      amount,
      user.id,
    );
    if (!error) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, current_amount: amount, is_completed: completed }
            : g,
        ),
      );
      if (completed) {
        const { upgraded, newTier } = await checkMilestoneUpgrade(user.id);
        if (upgraded && newTier) {
          const cfg = RING_CONFIG[newTier];
          setUpgradeToast({ name: cfg.name, icon: cfg.icon });
          const latest = await getProfile(user.id);
          // if (latest) setProfile(latest);
        }
      }
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { deleteGoal } = await import("@/lib/goals");
    await deleteGoal(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const currentTier = (profile?.ring_tier ?? 1) as RingTier;
  const completedGoals = goals.filter((g) => g.is_completed).length;
  const activeGoals = goals.filter((g) => !g.is_completed);

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "goals",
      label: "Goals",
      icon: <Target className="w-4 h-4" />,
      badge: activeGoals.length,
    },
    {
      id: "finance",
      label: "Financial Plan",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "ring",
      label: "My Ring",
      icon: (
        <span className="text-base leading-none">
          {RING_CONFIG[currentTier].icon}
        </span>
      ),
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "ai advisor",
      label: "AI Advisor",
      icon: <Bot className="w-4 h-4" />,
    },
    // {
    //   id: "community",
    //   label: "Community",
    //   icon: <Users className="w-4 h-4" />,
    //   dividerAbove: true,
    //   href: "/community",
    // },
    // {
    //   id: "advisor",
    //   label: "AI Advisor",
    //   icon: <Bot className="w-4 h-4" />,
    //   href: "/advisor",
    // },
    {
      id: "tools",
      label: "Tools",
      icon: <ToolCase className="w-4 h-4" />,
      dividerAbove: true,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <UserCircle className="w-4 h-4" />, // or use a better icon like User, Settings, etc.
    },
  ];

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Connect Supabase to unlock dashboard features.
          </p>
          <div className="font-mono text-xs text-muted-foreground bg-card border border-white/5 rounded-xl p-4 text-left">
            <p className="text-primary/70"># .env</p>
            <p>VITE_SUPABASE_URL=...</p>
            <p>VITE_SUPABASE_ANON_KEY=...</p>
          </div>
          <Link href="/">
            <button className="mt-4 text-sm text-primary hover:underline">
              ← Back to landing
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      navItems={navItems}
      activeItem={activeItem}
      onNavSelect={setActiveItem}
      profile={profile}
      sectionTitle="Dashboard"
      topBar={
        <GoalsTopBar
          goals={goals}
          onAddGoal={() => {
            setShowGoalModal(true);
            setActiveItem("goals");
          }}
        />
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {activeItem === "overview" && (
            <OverviewTab
              profile={profile}
              goals={goals}
              completedGoals={completedGoals}
              financialProfile={financialProfile}
              recentPosts={recentPosts}
              postCount={postCount}
              setActiveItem={setActiveItem}
            />
          )}
          {activeItem === "goals" && (
            <GoalsTab
              goals={goals}
              financialProfile={financialProfile}
              onUpdateProgress={handleUpdateProgress}
              onDelete={handleDeleteGoal}
              onContributionUpdated={(id, amount) =>
                setGoals((prev) =>
                  prev.map((g) =>
                    g.id === id ? { ...g, monthly_contribution: amount } : g,
                  ),
                )
              }
              onAddGoal={() => setShowGoalModal(true)}
            />
          )}
          {activeItem === "finance" && (
            <div className="p-6">
              <h2 className="text-xl font-display font-bold mb-2">
                Financial Plan
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your monthly numbers to get your financial health score.
              </p>
              <FinancialAdvisor
                userId={user!.id}
                initialProfile={financialProfile}
                onSaved={() => {
                  getFinancialProfile(user!.id).then(setFinancialProfile);
                  checkMilestoneUpgrade(user!.id).then(
                    async ({ upgraded, newTier }) => {
                      if (upgraded && newTier) {
                        const cfg = RING_CONFIG[newTier];
                        setUpgradeToast({ name: cfg.name, icon: cfg.icon });
                        const latest = await getProfile(user!.id);
                        // if (latest) setProfile(latest);
                      }
                    },
                  );
                }}
              />
            </div>
          )}
          {activeItem === "ring" && (
            <RingTab
              profile={profile}
              completedGoals={completedGoals}
              financialProfile={financialProfile}
            />
          )}
          {activeItem === "tools" && <ToolsPageV2 />}
          {activeItem === "analysis" && <AnalysisPage />}
          {activeItem === "profile" && <ProfilePage isInsideDashboard={true} />}
          {activeItem === "ai advisor" && <ChatPageV2 />}
        </>
      )}
      {showGoalModal && (
        <CreateGoalModal
          onClose={() => setShowGoalModal(false)}
          onCreated={handleGoalCreated}
        />
      )}
      {upgradeToast && (
        <UpgradeToast
          tierName={upgradeToast.name}
          ringIcon={upgradeToast.icon}
          onClose={() => setUpgradeToast(null)}
        />
      )}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}
