import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronUp, MessageSquare, CheckCircle2 } from "lucide-react";
import { RingBadge } from "./RingBadge";
import type { Post } from "@/lib/community";
import { formatDistanceToNow } from "date-fns";

const TAG_COLORS: Record<string, string> = {
  "first-job": "text-green-400 bg-green-400/10 border-green-400/20",
  debt: "text-red-400 bg-red-400/10 border-red-400/20",
  investing: "text-primary bg-primary/10 border-primary/20",
  tax: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  insurance: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  home: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  retirement: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  freelance: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  salary: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "emergency-fund": "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "women-finance": "text-pink-400 bg-pink-400/10 border-pink-400/20",
  nri: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  inheritance: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const displayName = post.profiles?.display_name ?? "Anonymous";
  const ringTier = post.profiles?.ring_tier ?? 1;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/community/${post.id}`}>
        <div className="group glass-panel rounded-2xl p-5 hover:border-primary/20 transition-all duration-200 cursor-pointer">
          <div className="flex gap-4">
            {/* Upvote column */}
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <div className="flex flex-col items-center gap-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                <ChevronUp className="w-5 h-5" />
                <span className="text-sm font-bold font-mono">{post.upvotes}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap mb-2">
                {post.is_answered && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                )}
                <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {post.body}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {post.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] ?? "text-muted-foreground bg-muted/30 border-white/10"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.answer_count ?? 0}
                  </span>
                  <RingBadge tier={ringTier as 1 | 2 | 3 | 4 | 5} size="sm" />
                  <span className="hidden sm:block font-medium">{displayName}</span>
                  <span className="opacity-60">{timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
