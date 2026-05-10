import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createPost, POST_TAGS } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";

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

function AskQuestionInner() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 3 ? [...prev, tag] : prev
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!body.trim()) { setError("Please describe your question."); return; }
    if (selectedTags.length === 0) { setError("Pick at least one tag."); return; }
    if (!isSupabaseConfigured) { setError("Supabase is not configured. Add your keys to .env first."); return; }

    setError("");
    setSubmitting(true);
    const post = await createPost(user.id, title.trim(), body.trim(), selectedTags);
    if (post) {
      setLocation(`/community/${post.id}`);
    } else {
      setError("Failed to create post. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <Link href="/community">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Ask a Question</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Be specific. Include your income range, goals, and any current investments.
          </p>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How much should I invest in PPF vs ELSS as a 26-year-old?"
                maxLength={200}
                className="w-full bg-card border border-white/8 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1.5 text-right">{title.length}/200</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Details <span className="text-primary">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your situation in detail — employment type, city, income range (no need to be exact), current savings, debts, and your goal..."
                rows={7}
                className="w-full bg-card border border-white/8 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-y transition-colors"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tags <span className="text-primary">*</span>
                <span className="text-muted-foreground font-normal ml-2">(pick up to 3)</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {POST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-card/50 border border-white/5 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Reminder:</span> Community answers are educational only and not personalised financial advice. For regulated advice, consult a SEBI-registered investment adviser.
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Posting..." : "Post Question"}
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default function AskQuestionPage() {
  return (
    <ProtectedRoute>
      <AskQuestionInner />
    </ProtectedRoute>
  );
}
