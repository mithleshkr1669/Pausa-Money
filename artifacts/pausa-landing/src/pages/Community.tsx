import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { PenSquare, TrendingUp, Clock, Filter, AlertCircle, BookMarked, User, ThumbsUp, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PostCard } from "@/components/community/PostCard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  getPosts, getMyPosts, getLikedPosts, getParticipatedPosts,
  getSavedReplies, upsertProfile, POST_TAGS,
  type Post, type Answer,
} from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { RingBadge } from "@/components/community/RingBadge";
import { formatDistanceToNow } from "date-fns";

const TAG_LABELS: Record<string, string> = {
  "first-job": "First Job", debt: "Debt", investing: "Investing", tax: "Tax",
  insurance: "Insurance", home: "Home", retirement: "Retirement", freelance: "Freelance",
  salary: "Salary", "emergency-fund": "Emergency Fund", "women-finance": "Women & Finance",
  nri: "NRI", inheritance: "Inheritance",
};

type ViewTab = "all" | "mine" | "liked" | "participated" | "saved";

function SavedReplyCard({ reply }: { reply: Answer & { saved_note?: string; post_title?: string } }) {
  const ringTier = (reply.profiles?.ring_tier ?? 1) as 1 | 2 | 3 | 4 | 5;
  return (
    <div className="glass-panel rounded-xl p-4">
      {reply.post_title && (
        <p className="text-xs text-muted-foreground mb-2 font-mono truncate">
          📌 from: {reply.post_title}
        </p>
      )}
      <div className="flex items-center gap-2 mb-2">
        <RingBadge tier={ringTier} size="sm" />
        <span className="text-xs font-medium">{reply.profiles?.display_name ?? "Anonymous"}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">{reply.body}</p>
      {reply.saved_note && (
        <p className="mt-2 text-xs text-primary/70 bg-primary/5 border border-primary/15 rounded-lg px-3 py-1.5 italic">
          Note: {reply.saved_note}
        </p>
      )}
    </div>
  );
}

function CommunityInner() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedReplies, setSavedReplies] = useState<(Answer & { saved_note?: string; post_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [viewTab, setViewTab] = useState<ViewTab>("all");

  useEffect(() => {
    if (user) upsertProfile(user.id, user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User", user.imageUrl);
  }, [user]);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (viewTab === "saved") {
      const saved = await getSavedReplies(user.id);
      setSavedReplies(saved);
      setLoading(false);
      return;
    }

    let data: Post[] = [];
    if (viewTab === "all")          data = await getPosts(activeTag ?? undefined);
    else if (viewTab === "mine")    data = await getMyPosts(user.id);
    else if (viewTab === "liked")   data = await getLikedPosts(user.id);
    else if (viewTab === "participated") data = await getParticipatedPosts(user.id);

    const sorted = sort === "top" ? [...data].sort((a, b) => b.upvotes - a.upvotes) : data;
    setPosts(sorted);
    setLoading(false);
  }, [viewTab, activeTag, sort, user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "all",          label: "All Posts",    icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "mine",         label: "My Posts",     icon: <User className="w-3.5 h-3.5" /> },
    { id: "liked",        label: "Liked",        icon: <ThumbsUp className="w-3.5 h-3.5" /> },
    { id: "participated", label: "Participated", icon: <PenSquare className="w-3.5 h-3.5" /> },
    { id: "saved",        label: "Saved Replies",icon: <BookMarked className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Community Hub</h1>
              <p className="text-muted-foreground">Ask questions, share knowledge, grow together. 🌱</p>
            </div>
            <Link href="/community/ask">
              <button className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shrink-0">
                <PenSquare className="w-4 h-4" />Ask Question
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Setup banner */}
        {!isSupabaseConfigured && (
          <div className="mb-5 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-300 mb-0.5">Supabase not connected</p>
              <p className="text-xs text-yellow-400/70">
                Add <code className="font-mono bg-yellow-500/10 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-yellow-500/10 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your <code className="font-mono bg-yellow-500/10 px-1 rounded">.env</code> file. Then run <strong>001_community.sql → 002_goals_financial.sql → 003_extensions.sql</strong> in Supabase SQL Editor.
              </p>
            </div>
          </div>
        )}

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-card border border-white/5 rounded-xl p-1 mb-5 overflow-x-auto">
          {VIEW_TABS.map((t) => (
            <button key={t.id} onClick={() => setViewTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${viewTab === t.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Filters (only for "all" tab) */}
        {viewTab === "all" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex items-center gap-1 bg-card border border-white/5 rounded-xl p-1 w-fit">
              <button onClick={() => setSort("latest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === "latest" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Clock className="w-3.5 h-3.5" />Latest
              </button>
              <button onClick={() => setSort("top")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === "top" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <TrendingUp className="w-3.5 h-3.5" />Top
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <button onClick={() => setActiveTag(null)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!activeTag ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 text-muted-foreground hover:border-white/15"}`}>
                All
              </button>
              {POST_TAGS.slice(0, 8).map((tag) => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTag === tag ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 text-muted-foreground hover:border-white/15"}`}>
                  {TAG_LABELS[tag] ?? tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : viewTab === "saved" ? (
          savedReplies.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl">
              <p className="text-3xl mb-4">🔖</p>
              <h3 className="text-lg font-display font-semibold mb-2">No saved replies yet</h3>
              <p className="text-muted-foreground text-sm">Tap the bookmark icon on any answer in a post to save it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReplies.map((r) => <SavedReplyCard key={r.id} reply={r} />)}
            </div>
          )
        ) : posts.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <p className="text-4xl mb-4">
              {viewTab === "mine" ? "✍️" : viewTab === "liked" ? "💚" : viewTab === "participated" ? "💬" : "🌱"}
            </p>
            <h3 className="text-lg font-display font-semibold mb-2">
              {viewTab === "mine" ? "No posts yet" : viewTab === "liked" ? "No liked posts" : viewTab === "participated" ? "No activity yet" : "No posts yet"}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              {viewTab === "mine" ? "Ask your first question to the community." : viewTab === "liked" ? "Upvote posts you find helpful." : viewTab === "participated" ? "Answer questions to get started." : isSupabaseConfigured ? "Be the first to ask!" : "Connect Supabase to see posts."}
            </p>
            {(viewTab === "mine" || viewTab === "all") && isSupabaseConfigured && (
              <Link href="/community/ask">
                <button className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
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
      </main>
      <Footer />
    </div>
  );
}

export default function CommunityPage() {
  return <ProtectedRoute><CommunityInner /></ProtectedRoute>;
}
