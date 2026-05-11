import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Building2, Sparkles, AlertCircle, X,
  Bookmark, BookmarkCheck, Trash2, Bot, Plus, FileText, PenSquare, BookOpen,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { AIMessage, AITypingIndicator, type AIMessageData } from "@/components/ai/AIMessage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { sendChatMessage, QUICK_PROMPTS } from "@/lib/ai";
import { getFinancialProfile } from "@/lib/financial";
import { getGoals } from "@/lib/goals";
import { getProfile, createStory, type Profile, type CommunityStory, type RingTier } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isClerkConfigured } from "@/lib/clerk-config";
import { supabase } from "@/lib/supabase";

// ── Chat Tab ──────────────────────────────────────────────────────────────────
function ChatTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<AIMessageData[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Pausa AI, your personal finance advisor.\n\nI can help you with budgeting, investments (SIP, ELSS, PPF, NPS), tax planning, emergency funds, debt management, and more — all tailored for India.\n\n**What's on your mind today?** 🌱",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileAnalyzing, setFileAnalyzing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [userContext, setUserContext] = useState<{ income?: number; expenses?: number; goals?: string[] }>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    Promise.all([getFinancialProfile(userId), getGoals(userId)]).then(([fp, goals]) => {
      if (fp) {
        const expenses = fp.housing_expense + fp.food_expense + fp.transport_expense + fp.utilities_expense + fp.insurance_expense + fp.entertainment_expense + fp.other_expense;
        setUserContext({ income: fp.monthly_income, expenses, goals: goals.filter((g) => !g.is_completed).map((g) => g.name) });
      }
    });
  }, [userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const recordTraining = async (msg: AIMessageData, label: "liked" | "disliked" | null, saved = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    const prompt = messages.findLast((m) => m.role === "user")?.content ?? "";
    await supabase.from("ai_training_data").upsert({
      user_id: userId, session_id: sessionId.current,
      prompt, response: msg.content, provider: msg.provider,
      label, saved, context: userContext ?? {},
    }, { onConflict: "id" });
  };

  const handleSave = async (msg: AIMessageData) => {
    if (savedIds.has(msg.id)) {
      setSavedIds((prev) => { const s = new Set(prev); s.delete(msg.id); return s; });
    } else {
      setSavedIds((prev) => new Set([...prev, msg.id]));
      if (isSupabaseConfigured && supabase) {
        const prompt = messages.findLast((m) => m.role === "user")?.content ?? "";
        await supabase.from("ai_saved_responses").insert({
          user_id: userId, session_id: sessionId.current,
          prompt, response: msg.content, provider: msg.provider,
        });
      }
      await recordTraining(msg, null, true);
    }
  };

  const handleLike = async (msg: AIMessageData) => {
    if (likedIds.has(msg.id)) { setLikedIds((prev) => { const s = new Set(prev); s.delete(msg.id); return s; }); return; }
    setLikedIds((prev) => new Set([...prev, msg.id]));
    setDislikedIds((prev) => { const s = new Set(prev); s.delete(msg.id); return s; });
    await recordTraining(msg, "liked");
  };

  const handleDislike = async (msg: AIMessageData) => {
    if (dislikedIds.has(msg.id)) { setDislikedIds((prev) => { const s = new Set(prev); s.delete(msg.id); return s; }); return; }
    setDislikedIds((prev) => new Set([...prev, msg.id]));
    setLikedIds((prev) => { const s = new Set(prev); s.delete(msg.id); return s; });
    await recordTraining(msg, "disliked");
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && !attachedFile) || loading) return;
    setInput("");

    let finalContent = content;
    if (attachedFile) {
      setFileAnalyzing(true);
      const fileText = await attachedFile.text().catch(() => "");
      finalContent = content
        ? `${content}\n\n[Attached: ${attachedFile.name}]\n${fileText.slice(0, 3000)}`
        : `Please analyze this financial document: ${attachedFile.name}\n\n${fileText.slice(0, 3000)}`;
      setAttachedFile(null);
      setFileAnalyzing(false);
    }

    const userMsg: AIMessageData = { id: `u_${Date.now()}`, role: "user", content: finalContent };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setLoading(true);

    const history = allMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const result = await sendChatMessage(history, userContext);
    const aiMsg: AIMessageData = {
      id: `a_${Date.now()}`, role: "assistant", content: result.message, provider: result.provider,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5 MB."); return; }
    setAttachedFile(file);
  };

  return (
    <div className="flex flex-col h-full">
      {userContext?.income && (
        <div className="flex items-center gap-2 bg-primary/5 border-b border-primary/10 px-5 py-2 text-xs text-muted-foreground shrink-0">
          <Sparkles className="w-3 h-3 text-primary" />
          Advice personalised to your ₹{userContext.income.toLocaleString("en-IN")}/mo profile
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1">
        {messages.map((msg, i) => (
          <AIMessage key={msg.id} message={{ ...msg, isSaved: savedIds.has(msg.id), isLiked: likedIds.has(msg.id), isDisliked: dislikedIds.has(msg.id) }}
            index={i}
            onSave={msg.role === "assistant" ? () => handleSave(msg) : undefined}
            onLike={msg.role === "assistant" ? () => handleLike(msg) : undefined}
            onDislike={msg.role === "assistant" ? () => handleDislike(msg) : undefined}
          />
        ))}
        {(loading || fileAnalyzing) && <AITypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.slice(0, 4).map((p) => (
            <button key={p} onClick={() => sendMessage(p)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Attached file chip */}
      {attachedFile && (
        <div className="px-5 pb-1">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 text-xs text-primary">
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate max-w-[180px]">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-5 pb-5 pt-2 shrink-0">
        <input ref={fileInputRef} type="file" accept=".csv,.txt,.pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
        <div className="flex items-end gap-2 bg-card border border-white/8 rounded-2xl px-3 py-2.5 focus-within:border-primary/30 transition-colors">
          {/* + file attach */}
          <button onClick={() => fileInputRef.current?.click()}
            className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0 mb-0.5">
            <Plus className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Ask anything about your finances..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed max-h-32"
            style={{ minHeight: "24px" }}
          />
          <button onClick={() => sendMessage()} disabled={(!input.trim() && !attachedFile) || loading}
            className="p-1.5 bg-primary rounded-lg text-[#0A0A0C] hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
          Educational guidance only · Not regulated financial advice · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ── Bank Link Tab ─────────────────────────────────────────────────────────────
function BankLinkTab() {
  return (
    <div className="p-6 text-center flex flex-col items-center justify-center h-full max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Building2 className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-display font-bold mb-2">Account Aggregator — Coming Soon</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        Pausa will use India's RBI-regulated Account Aggregator framework to securely read your bank data — zero password sharing, consent-based.
      </p>
      <div className="grid grid-cols-1 gap-3 w-full text-left">
        {[
          { icon: "🏦", title: "Link once", desc: "Connect all accounts via AA in one flow" },
          { icon: "🔒", title: "You control everything", desc: "Revoke access any time. No data stored." },
          { icon: "🤖", title: "Auto-analysis", desc: "AI reads transactions, builds your plan" },
        ].map((item) => (
          <div key={item.title} className="glass-panel rounded-xl p-4 flex gap-3 items-start">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div><p className="text-sm font-semibold mb-0.5">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-card border border-white/5 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />In development — join waitlist on landing page
        </span>
      </div>
    </div>
  );
}

// ── Story Tab ─────────────────────────────────────────────────────────────────
function StoryTab({ userId, profile }: { userId: string; profile: Profile | null }) {
  const [form, setForm] = useState({ title: "", situation: "", challenge: "", action: "", result: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.situation || !form.challenge || !form.action || !form.result) {
      setError("Fill all fields to complete your story."); return;
    }
    setSubmitting(true);
    const { error: err } = await createStory(userId, { ...form, ring_tier: (profile?.ring_tier ?? 1) as RingTier, tags: [] });
    setSubmitting(false);
    if (err) { setError(err); return; }
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <span className="text-5xl mb-4">🌱</span>
      <h3 className="text-xl font-display font-bold mb-2">Story Shared!</h3>
      <p className="text-muted-foreground text-sm">Your story will inspire others in the community.</p>
    </div>
  );

  const fields = [
    { key: "title" as const,     label: "Story Title",    placeholder: "e.g. How I paid off ₹3L in 18 months" },
    { key: "situation" as const, label: "My Situation",   placeholder: "I was 26, earning ₹45k, with credit card debt..." },
    { key: "challenge" as const, label: "The Challenge",  placeholder: "The hardest part was..." },
    { key: "action" as const,    label: "What I Did",     placeholder: "I started by..." },
    { key: "result" as const,    label: "The Result",     placeholder: "Now I... and I feel..." },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-lg">
        <div className="mb-6">
          <h2 className="text-xl font-display font-bold mb-1">Share Your Story</h2>
          <p className="text-sm text-muted-foreground">Stories in 4 acts: Situation → Challenge → Action → Result. Be specific. Be honest. It helps others.</p>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
              {f.key === "title" ? (
                <input value={form[f.key]} onChange={update(f.key)} placeholder={f.placeholder}
                  className="w-full bg-card border border-white/8 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
              ) : (
                <textarea value={form[f.key]} onChange={update(f.key)} placeholder={f.placeholder} rows={3}
                  className="w-full bg-card border border-white/8 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none" />
              )}
            </div>
          ))}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-[#0A0A0C] font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenSquare className="w-4 h-4" />}
            Share My Story
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Saved Responses Tab ───────────────────────────────────────────────────────
function SavedResponsesTab({ userId }: { userId: string }) {
  const [saved, setSaved] = useState<{ id: string; prompt: string; response: string; provider: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setLoading(false); return; }
    supabase.from("ai_saved_responses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setSaved((data as any) ?? []); setLoading(false); });
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    await supabase.from("ai_saved_responses").delete().eq("id", id);
    setSaved((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  if (saved.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <Bookmark className="w-12 h-12 text-muted-foreground/30 mb-3" />
      <h3 className="font-display font-bold mb-1">No saved responses yet</h3>
      <p className="text-sm text-muted-foreground">Hover any AI response and click the bookmark icon to save it here.</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      <h2 className="text-base font-display font-bold text-muted-foreground uppercase tracking-widest">Saved Responses</h2>
      {saved.map((r) => (
        <div key={r.id} className="glass-panel rounded-2xl p-4">
          {r.prompt && <p className="text-xs text-muted-foreground/70 mb-2 line-clamp-1">Q: {r.prompt}</p>}
          <p className="text-sm text-foreground/85 leading-relaxed line-clamp-5">{r.response}</p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
            <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main AI Advisor ───────────────────────────────────────────────────────────
function AIAdvisorInner() {
  const { user } = isClerkConfigured ? require("@clerk/clerk-react").useUser() : { user: null };
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeItem, setActiveItem] = useState("chat");

  useEffect(() => {
    if (user) getProfile(user.id).then(setProfile);
  }, [user]);

  const navItems: NavItem[] = [
    { id: "chat",   label: "Chat",           icon: <Bot className="w-4 h-4" /> },
    { id: "story",  label: "My Story",       icon: <PenSquare className="w-4 h-4" />, dividerAbove: true },
    { id: "saved",  label: "Saved Responses",icon: <Bookmark className="w-4 h-4" /> },
    { id: "bank",   label: "Link Account",   icon: <Building2 className="w-4 h-4" />, dividerAbove: true },
  ];

  return (
    <AppShell
      navItems={navItems}
      activeItem={activeItem}
      onNavSelect={setActiveItem}
      profile={profile}
      sectionTitle="AI Advisor"
    >
      <div className="h-full flex flex-col">
        <AnimatePresence mode="wait">
          {activeItem === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0 h-full">
              <ChatTab userId={user?.id ?? "guest"} />
            </motion.div>
          )}
          {activeItem === "story" && (
            <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
              <StoryTab userId={user?.id ?? "guest"} profile={profile} />
            </motion.div>
          )}
          {activeItem === "saved" && (
            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
              <SavedResponsesTab userId={user?.id ?? "guest"} />
            </motion.div>
          )}
          {activeItem === "bank" && (
            <motion.div key="bank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
              <BankLinkTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

export default function AIAdvisorPage() {
  return <ProtectedRoute><AIAdvisorInner /></ProtectedRoute>;
}
