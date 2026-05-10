import { ChevronUp, BadgeCheck, Bot } from "lucide-react";
import { RingBadge } from "./RingBadge";
import type { Answer } from "@/lib/community";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { upvoteAnswer } from "@/lib/community";
import { useUser } from "@clerk/clerk-react";

export function AnswerBlock({ answer }: { answer: Answer }) {
  const { user } = useUser();
  const [votes, setVotes] = useState(answer.upvotes);
  const [voted, setVoted] = useState(false);

  const displayName = answer.profiles?.display_name ?? (answer.is_ai ? "Pausa AI" : "Anonymous");
  const ringTier = answer.profiles?.ring_tier ?? 1;
  const timeAgo = formatDistanceToNow(new Date(answer.created_at), { addSuffix: true });

  const handleUpvote = async () => {
    if (!user || voted) return;
    setVoted(true);
    setVotes((v) => v + 1);
    await upvoteAnswer(answer.id, user.id);
  };

  return (
    <div className={`rounded-2xl p-5 border transition-colors ${answer.is_verified ? "border-primary/30 bg-primary/5" : "border-white/5 bg-card/40"}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
          <button onClick={handleUpvote} disabled={voted || !user}
            className={`flex flex-col items-center gap-0.5 transition-colors ${voted ? "text-primary" : "text-muted-foreground hover:text-primary"} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <ChevronUp className="w-5 h-5" />
            <span className="text-sm font-bold font-mono">{votes}</span>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {answer.is_ai ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Bot className="w-3.5 h-3.5" />Pausa AI Draft
              </span>
            ) : (
              <RingBadge tier={ringTier as 1 | 2 | 3 | 4 | 5} size="sm" />
            )}
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            {answer.is_verified && (
              <span className="inline-flex items-center gap-1 text-xs font-mono text-primary">
                <BadgeCheck className="w-3.5 h-3.5" />CFP Verified
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
          </div>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{answer.body}</div>
          {answer.is_ai && (
            <p className="mt-3 text-[11px] text-muted-foreground italic border-t border-white/5 pt-2">
              This is educational guidance — for personalised advice, consult a verified expert.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
