import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PenSquare, Filter, AlertCircle, BookMarked, User, ThumbsUp, MessageSquare, BookOpen, ChevronUp, Send, X, Loader2 } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { PostCard } from "@/components/community/PostCard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  getPosts, getMyPosts, getLikedPosts, getParticipatedPosts,
  getSavedReplies, getStories, createStory, upsertProfile,
  POST_TAGS, RING_CONFIG, type Post, type Answer, type CommunityStory, type RingTier,
} from "@/lib/community";
import { getProfile } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isClerkConfigured } from "@/lib/clerk-config";
import { RingBadge } from "@/components/community/RingBadge";
import { formatDistanceToNow } from "date-fns";

const TAG_LABELS: Record<string, string> = {
  "first-job": "First Job", debt: "Debt", investing: "Investing", tax: "Tax",
  insurance: "Insurance", home: "Home", retirement: "Retirement", freelance: "Freelance",
  salary: "Salary", "emergency-fund": "Emergency Fund", "women-finance": "Women & Finance",
  nri: "NRI", inheritance: "Inheritance",
};

// ── Story Card ────────────────────────────────────────────────────────────────
function StoryCard({ story }: { story: CommunityStory }) {
  const [expanded, setExpanded] = useState(false);
  const ringTier = (story.profiles?.ring_tier ?? 1) as RingTier;
  const ring = RING_CONFIG[ringTier];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-5 hover:border-white/10 transition-colors">
      {story.is_featured && (
        <div className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/70 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mb-3">
          ✨ Featured
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: ring.bg, border: `1px solid ${ring.border}` }}>
          {ring.icon}
        </div>
        <div>
          <h3 className="font-display font-semibold text-base leading-snug">{story.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-mono" style={{ color: ring.color }}>{ring.name}</span>
            {story.city && <span className="text-xs text-muted-foreground">{story.city}</span>}
            {story.income_range && <span className="text-xs text-muted-foreground">{story.income_range}</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 text-muted-foreground">
          <ChevronUp className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{story.upvotes}</span>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="bg-white/2 rounded-xl p-3">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Situation</p>
          <p className="text-foreground/80 leading-relaxed">{story.situation}</p>
        </div>
        {expanded && (
          <>
            <div className="bg-white/2 rounded-xl p-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Challenge</p>
              <p className="text-foreground/80 leading-relaxed">{story.challenge}</p>
            </div>
            <div className="bg-white/2 rounded-xl p-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">What I Did</p>
              <p className="text-foreground/80 leading-relaxed">{story.action}</p>
            </div>
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
              <p className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-1">Result</p>
              <p className="text-foreground/85 leading-relaxed">{story.result}</p>
            </div>
          </>
        )}
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors">
        {expanded ? "Show less ↑" : "Read full story ↓"}
      </button>
    </motion.div>
  );
}

// ── Share Story Modal ─────────────────────────────────────────────────────────
function ShareStoryModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", situation: "", challenge: "", action: "", result: "", city: "", income_range: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.situation || !form.challenge || !form.action || !form.result) {
      setError("Please fill all story sections."); return;
    }
    setSubmitting(true);
    const { error: err } = await createStory(userId, { ...form, ring_tier: 1, tags: [] });
    setSubmitting(false);
    if (err) { setError(err); return; }
    onCreated();
    onClose();
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string; textarea: boolean }[] = [
    { key: "title",      label: "Story Title",    placeholder: "e.g. How I escaped debt at 26",     textarea: false },
    { key: "situation",  label: "My Situation",   placeholder: "I was 24, earning ₹38k, confused...", textarea: true },
    { key: "challenge",  label: "The Challenge",  placeholder: "The hardest part was...",            textarea: true },
    { key: "action",     label: "What I Did",     placeholder: "So I started by...",                 textarea: true },
    { key: "result",     label: "The Result",     placeholder: "Now I have... and I feel...",        textarea: true },
    { key: "city",       label: "City (optional)", placeholder: "e.g. Indore",                      textarea: false },
    { key: "income_range", label: "Income Range (optional)", placeholder: "e.g. ₹40k–₹75k",       textarea: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-card border border-white/10 rounded-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-display font-bold">Share Your Story</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Stories inspire. Be specific and honest.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
              {f.textarea ? (
                <textarea value={form[f.key]} onChange={update(f.key)} placeholder={f.placeholder} rows={3}
                  className="w-full bg-background border border-white/8 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none" />
              ) : (
                <input type="text" value={form[f.key]} onChange={update(f.key)} placeholder={f.placeholder}
                  className="w-full bg-background border border-white/8 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
              )}
            </div>
          ))}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-2.5 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Share My Story
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Community ────────────────────────────────────────────────────────────
type ViewTab = "all" | "mine" | "liked" | "participated" | "saved" | "stories";

function CommunityInner() {
  const { user } = isClerkConfigured ? require("@clerk/clerk-react").useUser() : { user: null };
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<ReturnType<typeof getProfile> extends Promise<infer T> ? T : never>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [savedReplies, setSavedReplies] = useState<(Answer & { saved_note?: string; post_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ViewTab>("all");
  const [showStoryModal, setShowStoryModal] = useState(false);

  useEffect(() => {
    if (user) {
      upsertProfile(user.id, user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User", user.imageUrl);
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  const loadContent = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (activeItem === "saved") { setSavedReplies(await getSavedReplies(user.id)); }
    else if (activeItem === "stories") { setStories(await getStories()); }
    else if (activeItem === "all") { setPosts(await getPosts(activeTag ?? undefined)); }
    else if (activeItem === "mine") { setPosts(await getMyPosts(user.id)); }
    else if (activeItem === "liked") { setPosts(await getLikedPosts(user.id)); }
    else if (activeItem === "participated") { setPosts(await getParticipatedPosts(user.id)); }
    setLoading(false);
  }, [activeItem, activeTag, user]);

  useEffect(() => { loadContent(); }, [loadContent]);

  const navItems: NavItem[] = [
    { id: "all",          label: "All Posts",     icon: <MessageSquare className="w-4 h-4" /> },
    { id: "mine",         label: "My Posts",      icon: <User className="w-4 h-4" /> },
    { id: "liked",        label: "Liked",         icon: <ThumbsUp className="w-4 h-4" /> },
    { id: "participated", label: "Participated",  icon: <PenSquare className="w-4 h-4" /> },
    { id: "saved",        label: "Saved Replies", icon: <BookMarked className="w-4 h-4" />, dividerAbove: true },
    { id: "stories",      label: "Stories",       icon: <BookOpen className="w-4 h-4" /> },
  ];

  const actionButton = (
    <Link href="/community/ask">
      <button className="w-full flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-3 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors">
        <PenSquare className="w-3.5 h-3.5" />Ask Question
      </button>
    </Link>
  );

  return (
    <AppShell
      navItems={navItems}
      activeItem={activeItem}
      onNavSelect={(id) => setActiveItem(id as ViewTab)}
      profile={profile as any}
      sectionTitle="Community"
      actionButton={actionButton}
    >
      <div className="p-6 max-w-3xl">
        {/* Supabase banner */}
        {!isSupabaseConfigured && (
          <div className="mb-5 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-300 mb-0.5">Supabase not connected</p>
              <p className="text-xs text-yellow-400/70">Run migrations 001 → 002 → 003 → 004 in Supabase SQL Editor, then add keys to .env</p>
            </div>
          </div>
        )}

        {/* Stories header with share button */}
        {activeItem === "stories" && (
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-display font-bold">Community Stories</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Real journeys. Real transformations.</p>
            </div>
            <button onClick={() => setShowStoryModal(true)}
              className="flex items-center gap-2 bg-primary/15 text-primary border border-primary/25 px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
              <PenSquare className="w-3.5 h-3.5" />Share Mine
            </button>
          </div>
        )}

        {/* Tag filter (all posts only) */}
        {activeItem === "all" && (
          <div className="flex items-center gap-1.5 flex-wrap mb-5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <button onClick={() => setActiveTag(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!activeTag ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 text-muted-foreground hover:border-white/15"}`}>
              All
            </button>
            {POST_TAGS.slice(0, 9).map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTag === tag ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 text-muted-foreground hover:border-white/15"}`}>
                {TAG_LABELS[tag] ?? tag}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : activeItem === "stories" ? (
          stories.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl">
              <p className="text-4xl mb-4">📖</p>
              <h3 className="text-lg font-display font-semibold mb-2">No stories yet</h3>
              <p className="text-muted-foreground text-sm mb-5">Be the first to share your financial journey.</p>
              <button onClick={() => setShowStoryModal(true)} className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-5 py-2.5 rounded-xl text-sm">
                <PenSquare className="w-4 h-4" />Share My Story
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((s) => <StoryCard key={s.id} story={s} />)}
            </div>
          )
        ) : activeItem === "saved" ? (
          savedReplies.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl">
              <p className="text-4xl mb-4">🔖</p>
              <h3 className="text-lg font-display font-semibold mb-2">No saved replies yet</h3>
              <p className="text-muted-foreground text-sm">Tap the bookmark icon on any answer to save it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReplies.map((r) => (
                <div key={r.id} className="glass-panel rounded-xl p-4">
                  {r.post_title && <p className="text-xs text-muted-foreground mb-2 truncate">📌 from: {r.post_title}</p>}
                  <div className="flex items-center gap-2 mb-2">
                    <RingBadge tier={(r.profiles?.ring_tier ?? 1) as RingTier} size="sm" />
                    <span className="text-xs font-medium">{r.profiles?.display_name ?? "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-4">{r.body}</p>
                </div>
              ))}
            </div>
          )
        ) : posts.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <p className="text-4xl mb-4">
              {activeItem === "mine" ? "✍️" : activeItem === "liked" ? "💚" : activeItem === "participated" ? "💬" : "🌱"}
            </p>
            <h3 className="text-lg font-display font-semibold mb-2">
              {activeItem === "mine" ? "No posts yet" : activeItem === "liked" ? "No liked posts" : "No activity yet"}
            </h3>
            {(activeItem === "mine" || activeItem === "all") && isSupabaseConfigured && (
              <Link href="/community/ask">
                <button className="mt-4 inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-5 py-2.5 rounded-xl text-sm">
                  <PenSquare className="w-4 h-4" />Ask the first question
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          </div>
        )}
      </div>

      {showStoryModal && user && (
        <ShareStoryModal userId={user.id} onClose={() => setShowStoryModal(false)} onCreated={() => loadContent()} />
      )}
    </AppShell>
  );
}

export default function CommunityPage() {
  return <ProtectedRoute><CommunityInner /></ProtectedRoute>;
}
