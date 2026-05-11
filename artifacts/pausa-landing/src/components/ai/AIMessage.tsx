import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Copy, Check, Bot, Zap } from "lucide-react";

export interface AIMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: "gemini" | "anthropic" | "fallback";
  isSaved?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface Props {
  message: AIMessageData;
  onSave?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  index?: number;
}

// Simple markdown renderer for bold, lists, headers
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Blank line
        if (!line.trim()) return <div key={i} className="h-2" />;
        // Heading ##
        if (line.startsWith("## ")) return <p key={i} className="text-sm font-bold text-primary/90 mt-2">{line.slice(3)}</p>;
        if (line.startsWith("# ")) return <p key={i} className="text-base font-bold mt-2">{line.slice(2)}</p>;
        // Bullet list
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-primary/60 shrink-0 mt-0.5">▸</span>
              <span className="text-foreground/85 leading-relaxed">{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-primary/70 font-bold font-mono shrink-0 w-5 text-right mt-0.5">{numMatch[1]}.</span>
              <span className="text-foreground/85 leading-relaxed">{renderInline(numMatch[2])}</span>
            </div>
          );
        }
        // Next Step callout
        if (line.startsWith("**Next Step") || line.startsWith("Next Step")) {
          return (
            <div key={i} className="mt-3 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2 text-sm">
              <span className="text-primary font-semibold">→ Next Step: </span>
              <span className="text-foreground/80">{renderInline(line.replace(/^\*?\*?Next Step:?\*?\*?\s*/, ""))}</span>
            </div>
          );
        }
        // Normal paragraph
        return <p key={i} className="text-sm text-foreground/85 leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Rupee amounts highlight
    return <span key={i}>{part.replace(/₹([\d,]+)/g, "₹$1")}</span>;
  });
}

export function AIMessage({ message, onSave, onLike, onDislike, index = 0 }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] bg-primary/15 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-foreground/90 leading-relaxed">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <div className="ai-card p-5 mb-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary">Pausa AI</span>
          {message.provider && message.provider !== "fallback" && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 bg-white/3 px-2 py-0.5 rounded-full border border-white/5">
              <Zap className="w-2.5 h-2.5" />
              {message.provider}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="pl-1">
          <RenderMarkdown text={message.content} />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Copy */}
        <button onClick={handleCopy} title="Copy"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>

        {/* Save */}
        {onSave && (
          <button onClick={onSave} title={message.isSaved ? "Saved" : "Save response"}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs ${message.isSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/5"}`}>
            {message.isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </button>
        )}

        {/* Like */}
        {onLike && (
          <button onClick={onLike} title="Helpful"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs ${message.isLiked ? "text-green-400 bg-green-400/10" : "text-muted-foreground hover:text-green-400 hover:bg-white/5"}`}>
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dislike */}
        {onDislike && (
          <button onClick={onDislike} title="Not helpful"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-xs ${message.isDisliked ? "text-red-400 bg-red-400/10" : "text-muted-foreground hover:text-red-400 hover:bg-white/5"}`}>
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Loading bubble
export function AITypingIndicator() {
  return (
    <div className="ai-card px-5 py-4 mb-1">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
