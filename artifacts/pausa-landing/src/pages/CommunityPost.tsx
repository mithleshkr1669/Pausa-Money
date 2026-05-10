import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronUp, ArrowLeft, Tag, Send, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnswerBlock } from "@/components/community/AnswerBlock";
import { RingBadge } from "@/components/community/RingBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getPost, getAnswers, createAnswer, upvotePost, type Post, type Answer } from "@/lib/community";
import { useUser } from "@clerk/clerk-react";
import { formatDistanceToNow } from "date-fns";

function CommunityPostInner() {
  const [, params] = useRoute("/community/:id");
  const { user } = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(0);

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([getPost(params.id), getAnswers(params.id)]).then(([p, a]) => {
      setPost(p);
      setLocalVotes(p?.upvotes ?? 0);
      setAnswers(a);
      setLoading(false);
    });
  }, [params?.id]);

  const handleUpvote = async () => {
    if (!post || !user || upvoted) return;
    setUpvoted(true);
    setLocalVotes((v) => v + 1);
    await upvotePost(post.id, user.id);
  };

  const handleSubmitAnswer = async () => {
    if (!post || !user || !answerBody.trim()) return;
    setSubmitting(true);
    const newAnswer = await createAnswer(post.id, user.id, answerBody.trim());
    if (newAnswer) {
      setAnswers((prev) => [...prev, newAnswer]);
      setAnswerBody("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-24 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-3/4 mb-4" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Post not found.</p>
          <Link href="/community">
            <button className="mt-4 text-primary hover:underline text-sm">← Back to community</button>
          </Link>
        </div>
      </div>
    );
  }

  const ringTier = (post.profiles?.ring_tier ?? 1) as 1 | 2 | 3 | 4 | 5;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Back link */}
        <Link href="/community">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </button>
        </Link>

        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-6 mb-6"
        >
          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {post.tags.map((t) => (
                <span key={t} className="text-[11px] font-mono text-primary/70 bg-primary/5 border border-primary/15 px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-xl md:text-2xl font-display font-bold mb-3">{post.title}</h1>

          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-5">{post.body}</p>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-white/5">
            {/* Author */}
            <div className="flex items-center gap-2">
              <RingBadge tier={ringTier} size="sm" />
              <span className="text-sm font-medium">{post.profiles?.display_name ?? "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>

            {/* Upvote */}
            <button
              onClick={handleUpvote}
              disabled={upvoted || !user}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                upvoted
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary"
              } disabled:opacity-40`}
            >
              <ChevronUp className="w-4 h-4" />
              {localVotes} upvotes
            </button>
          </div>
        </motion.div>

        {/* Answers */}
        <div className="mb-8">
          <h2 className="text-lg font-display font-semibold mb-4">
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>
          {answers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-2xl mb-2">💭</p>
              <p className="text-sm">No answers yet. Be the first to help!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <AnswerBlock key={answer.id} answer={answer} />
              ))}
            </div>
          )}
        </div>

        {/* Write answer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold mb-4">Your Answer</h3>
          <textarea
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            placeholder="Share your knowledge... Be specific with Indian financial instruments (PPF, SIP, NPS, etc.)"
            rows={5}
            className="w-full bg-background/60 border border-white/8 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-colors"
          />
          <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
            <p className="text-xs text-muted-foreground italic">
              Educational guidance only — not personalised financial advice.
            </p>
            <button
              onClick={handleSubmitAnswer}
              disabled={submitting || !answerBody.trim()}
              className="flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post Answer
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default function CommunityPostPage() {
  return (
    <ProtectedRoute>
      <CommunityPostInner />
    </ProtectedRoute>
  );
}
