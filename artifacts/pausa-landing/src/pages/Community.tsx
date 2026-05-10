import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { PenSquare, TrendingUp, Clock, Filter, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PostCard } from "@/components/community/PostCard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getPosts, POST_TAGS, type Post } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { upsertProfile } from "@/lib/community";

const TAG_LABELS: Record<string, string> = {
  "first-job": "First Job",
  debt: "Debt",
  investing: "Investing",
  tax: "Tax",
  insurance: "Insurance",
  home: "Home",
  retirement: "Retirement",
  freelance: "Freelance",
  salary: "Salary",
  "emergency-fund": "Emergency Fund",
  "women-finance": "Women & Finance",
  nri: "NRI",
  inheritance: "Inheritance",
};

function CommunityInner() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<"latest" | "top">("latest");

  useEffect(() => {
    if (user) {
      upsertProfile(user.id, user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User", user.imageUrl);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    getPosts(activeTag ?? undefined).then((data) => {
      const sorted =
        sort === "top"
          ? [...data].sort((a, b) => b.upvotes - a.upvotes)
          : data;
      setPosts(sorted);
      setLoading(false);
    });
  }, [activeTag, sort]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                Community Hub
              </h1>
              <p className="text-muted-foreground">
                Ask questions, share knowledge, level up together.
              </p>
            </div>
            <Link href="/community/ask">
              <button className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shrink-0">
                <PenSquare className="w-4 h-4" />
                Ask Question
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Setup banner */}
        {!isSupabaseConfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4"
          >
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-300 mb-0.5">Supabase not connected</p>
              <p className="text-xs text-yellow-400/70">
                Add your <code className="font-mono bg-yellow-500/10 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
                <code className="font-mono bg-yellow-500/10 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in the{" "}
                <code className="font-mono bg-yellow-500/10 px-1 rounded">.env</code> file to enable posts &amp; answers.
              </p>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Sort */}
          <div className="flex items-center gap-1 bg-card border border-white/5 rounded-xl p-1 w-fit">
            <button
              onClick={() => setSort("latest")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === "latest" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Clock className="w-3.5 h-3.5" />
              Latest
            </button>
            <button
              onClick={() => setSort("top")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === "top" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Top
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <button
              onClick={() => setActiveTag(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!activeTag ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 text-muted-foreground hover:border-white/15"}`}
            >
              All
            </button>
            {POST_TAGS.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTag === tag ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 text-muted-foreground hover:border-white/15"}`}
              >
                {TAG_LABELS[tag] ?? tag}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
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
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🌱</p>
            <h3 className="text-lg font-display font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {isSupabaseConfigured
                ? "Be the first to ask a question!"
                : "Connect Supabase to see and create posts."}
            </p>
            {isSupabaseConfigured && (
              <Link href="/community/ask">
                <button className="inline-flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
                  <PenSquare className="w-4 h-4" />
                  Ask the first question
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityInner />
    </ProtectedRoute>
  );
}
