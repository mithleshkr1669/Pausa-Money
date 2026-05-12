import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ArrowLeft,
  Tag,
  Send,
  Loader2,
  AlertCircle,
  MessageCircle,
  BookMarked,
  BookmarkCheck,
  Users,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RingBadge } from "@/components/community/RingBadge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  getPost,
  getAnswers,
  getComments,
  createAnswer,
  createComment,
  upvotePost,
  upsertProfile,
  saveReply,
  unsaveReply,
  isReplySaved,
  updatePost,
  deletePost,
  type Post,
  type Answer,
  type Comment,
  type RingTier,
} from "@/lib/community";
import { upvoteAnswer } from "@/lib/community";
import { isClerkConfigured } from "@/lib/clerk-config";
import { formatDistanceToNow } from "date-fns";
import { ChevronUp as UpIcon, BadgeCheck, Bot } from "lucide-react";
import { useUser as useClerkUser } from "@clerk/clerk-react";

const RELATION_LABELS: Record<string, string> = {
  parents: "Parents",
  spouse: "Spouse",
  children: "Children",
  sibling: "Sibling",
  other: "Other",
};

// ── Answer with integrated save button ───────────────────────────────────────
function AnswerCard({
  answer,
  isSaved,
  onToggleSave,
  canSave,
  currentUserId,
}: {
  answer: Answer;
  isSaved: boolean;
  onToggleSave: () => void;
  canSave: boolean;
  currentUserId?: string;
}) {
  const [votes, setVotes] = useState(answer.upvotes);
  const [voted, setVoted] = useState(false);
  const ringTier = (answer.profiles?.ring_tier ?? 1) as RingTier;
  const displayName =
    answer.profiles?.display_name ?? (answer.is_ai ? "Pausa AI" : "Anonymous");
  const timeAgo = formatDistanceToNow(new Date(answer.created_at), {
    addSuffix: true,
  });

  const handleUpvote = async () => {
    if (!currentUserId || voted) return;
    setVoted(true);
    setVotes((v) => v + 1);
    await upvoteAnswer(answer.id, currentUserId);
  };

  return (
    <div
      className={`rounded-2xl p-5 border ${answer.is_verified ? "border-primary/30 bg-primary/5" : "border-white/5 bg-card/40"}`}
    >
      {/* Header row: author info + actions on same line */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {answer.is_ai ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Bot className="w-3.5 h-3.5" />
            Pausa AI
          </span>
        ) : (
          <RingBadge tier={ringTier} size="sm" />
        )}
        <span className="text-sm font-medium">{displayName}</span>
        {answer.is_verified && (
          <span className="inline-flex items-center gap-1 text-xs font-mono text-primary">
            <BadgeCheck className="w-3.5 h-3.5" />
            CFP Verified
          </span>
        )}
        {/* Time — separate from save button to avoid overlap */}
        <span className="text-xs text-muted-foreground">{timeAgo}</span>

        {/* Actions pushed right */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Save button */}
          {canSave && (
            <button
              onClick={onToggleSave}
              title={isSaved ? "Saved" : "Save reply"}
              className={`p-1.5 rounded-lg transition-colors ${isSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <BookMarked className="w-4 h-4" />
              )}
            </button>
          )}
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            disabled={voted || !currentUserId}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${voted ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"} disabled:opacity-40`}
          >
            <UpIcon className="w-3.5 h-3.5" />
            {votes}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap pl-0.5">
        {answer.body}
      </div>
    </div>
  );
}

// ── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: Comment }) {
  const ringTier = (comment.profiles?.ring_tier ?? 1) as RingTier;
  return (
    <div className="flex gap-2.5 py-2.5 border-b border-white/4 last:border-0">
      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
        {(comment.profiles?.display_name ?? "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <RingBadge tier={ringTier} size="sm" />
          <span className="text-xs font-medium">
            {comment.profiles?.display_name ?? "Anonymous"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm text-foreground/75">{comment.body}</p>
      </div>
    </div>
  );
}

// ── Main post page ────────────────────────────────────────────────────────────
function CommunityPostInner() {
  const [, params] = useRoute("/community/:id");
  const clerk = isClerkConfigured ? useClerkUser() : { user: null };
  const user = clerk.user;
  const [, setLocation] = useLocation();
  const [post, setPost] = useState<Post | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [answerError, setAnswerError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [upvoted, setUpvoted] = useState(false);
  const [localVotes, setLocalVotes] = useState(0);
  const [showComments, setShowComments] = useState(false);
  // Edit / delete state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([
      getPost(params.id),
      getAnswers(params.id),
      getComments(params.id),
    ]).then(([p, a, c]) => {
      setPost(p);
      setLocalVotes(p?.upvotes ?? 0);
      setAnswers(a);
      setComments(c);
      setLoading(false);
      if (p) {
        setEditTitle(p.title);
        setEditBody(p.body);
      }
    });
  }, [params?.id]);

  useEffect(() => {
    if (!user || !answers.length) return;
    Promise.all(answers.map((a) => isReplySaved(user.id, a.id))).then(
      (results) => {
        const saved = new Set<string>();
        results.forEach((isSaved, i) => {
          if (isSaved) saved.add(answers[i].id);
        });
        setSavedAnswers(saved);
      },
    );
  }, [user, answers]);

  const isOwner = user && post && user.id === post.user_id;

  const handleUpvote = async () => {
    if (!post || !user || upvoted) return;
    setUpvoted(true);
    setLocalVotes((v) => v + 1);
    await upvotePost(post.id, user.id);
  };

  const handleSubmitAnswer = async () => {
    if (!post || !user || !answerBody.trim()) return;
    setAnswerError("");
    setSubmittingAnswer(true);
    await upsertProfile(
      user.id,
      user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
      user.imageUrl,
    );
    const { data: newAnswer, error } = await createAnswer(
      post.id,
      user.id,
      answerBody.trim(),
    );
    setSubmittingAnswer(false);
    if (error || !newAnswer) {
      setAnswerError(error ?? "Failed to post.");
      return;
    }
    setAnswers((prev) => [...prev, newAnswer]);
    setAnswerBody("");
  };

  const handleSubmitComment = async () => {
    if (!post || !user || !commentBody.trim()) return;
    setCommentError("");
    setSubmittingComment(true);
    await upsertProfile(
      user.id,
      user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
      user.imageUrl,
    );
    const { data: newComment, error } = await createComment(
      post.id,
      user.id,
      commentBody.trim(),
    );
    setSubmittingComment(false);
    if (error || !newComment) {
      setCommentError(error ?? "Failed to post.");
      return;
    }
    setComments((prev) => [...prev, newComment]);
    setCommentBody("");
  };

  const handleToggleSave = async (answerId: string) => {
    if (!user) return;
    if (savedAnswers.has(answerId)) {
      await unsaveReply(user.id, answerId);
      setSavedAnswers((prev) => {
        const s = new Set(prev);
        s.delete(answerId);
        return s;
      });
    } else {
      await saveReply(user.id, answerId);
      setSavedAnswers((prev) => new Set([...prev, answerId]));
    }
  };

  const handleSaveEdit = async () => {
    if (!post || !user) return;
    setSavingEdit(true);
    const { error } = await updatePost(post.id, user.id, {
      title: editTitle.trim(),
      body: editBody.trim(),
    });
    setSavingEdit(false);
    if (!error) {
      setPost((p) =>
        p ? { ...p, title: editTitle.trim(), body: editBody.trim() } : p,
      );
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !user) return;
    setDeleting(true);
    await deletePost(post.id, user.id);
    setDeleting(false);
    setLocation("/community");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-24 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-6 animate-pulse h-24"
            />
          ))}
        </div>
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Post not found.</p>
          <Link href="/community">
            <button className="mt-4 text-primary hover:underline text-sm">
              ← Back
            </button>
          </Link>
        </div>
      </div>
    );

  const ringTier = (post.profiles?.ring_tier ?? 1) as RingTier;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-24">
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
          className="glass-panel rounded-2xl p-6 mb-5"
        >
          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-mono text-primary/70 bg-primary/5 border border-primary/15 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Title — editable for owner */}
          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl md:text-2xl font-display font-bold bg-background border border-white/15 rounded-xl px-4 py-2 mb-3 focus:outline-none focus:border-primary/40"
            />
          ) : (
            <h1 className="text-xl md:text-2xl font-display font-bold mb-3">
              {post.title}
            </h1>
          )}

          {/* Body — editable for owner */}
          {editing ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="w-full bg-background border border-white/15 rounded-xl px-4 py-3 text-sm text-foreground mb-4 focus:outline-none focus:border-primary/40 resize-y"
            />
          ) : (
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">
              {post.body}
            </p>
          )}

          {/* Family members */}
          {post.family_members && post.family_members.length > 0 && (
            <div className="mb-4 pb-4 border-b border-white/5 flex items-center gap-2 flex-wrap">
              <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Supporting:</span>
              {post.family_members.map((m) => (
                <span
                  key={m.relation}
                  className="text-xs font-mono bg-white/5 border border-white/8 px-2 py-0.5 rounded-full"
                >
                  {RELATION_LABELS[m.relation] ?? m.relation} ×{m.count}
                </span>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <RingBadge tier={ringTier} size="sm" />
              <span className="text-sm font-medium">
                {post.profiles?.display_name ?? "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Owner controls */}
              {isOwner && !editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border border-white/8"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors border border-white/8"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </>
              )}
              {editing && (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-primary bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-colors"
                  >
                    {savingEdit ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-white/5 border border-white/8"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-muted-foreground text-sm hover:border-primary/30 hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {comments.length}
              </button>
              <button
                onClick={handleUpvote}
                disabled={upvoted || !user}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${upvoted ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary"} disabled:opacity-40`}
              >
                <ChevronUp className="w-4 h-4" />
                {localVotes}
              </button>
            </div>
          </div>

          {/* Delete confirm */}
          {showDeleteConfirm && (
            <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400 flex-1">
                Delete this post permanently?
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </motion.div>

        {/* Comments */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-5 mb-5"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Comments ({comments.length})
            </h3>
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}
            <div className="flex gap-2 mt-3">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSubmitComment())
                }
                placeholder="Add a comment..."
                className="flex-1 bg-background border border-white/8 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={handleSubmitComment}
                disabled={submittingComment || !commentBody.trim()}
                className="px-3 py-2 bg-primary/15 text-primary rounded-xl text-sm disabled:opacity-40"
              >
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {commentError && (
              <p className="text-xs text-red-400 mt-2">{commentError}</p>
            )}
          </motion.div>
        )}

        {/* Answers */}
        <div className="mb-6">
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
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  isSaved={savedAnswers.has(answer.id)}
                  onToggleSave={() => handleToggleSave(answer.id)}
                  canSave={!!user}
                  currentUserId={user?.id}
                />
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
            rows={5}
            placeholder="Share your knowledge... Be specific with Indian financial instruments."
            className="w-full bg-background/60 border border-white/8 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
          />
          {answerError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{answerError}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
            <p className="text-xs text-muted-foreground italic">
              Educational only — not personalised financial advice.
            </p>
            <button
              onClick={handleSubmitAnswer}
              disabled={submittingAnswer || !answerBody.trim()}
              className="flex items-center gap-2 bg-primary text-[#0A0A0C] font-semibold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {submittingAnswer ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
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
