import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, Upload, Building2, Sparkles, AlertCircle, FileText, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { sendChatMessage, analyzeFileContent, QUICK_PROMPTS, type ChatMessage } from "@/lib/ai";
import { getFinancialProfile } from "@/lib/financial";
import { getGoals } from "@/lib/goals";
import { useUser } from "@clerk/clerk-react";

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isLast }: { msg: ChatMessage & { provider?: string }; isLast: boolean }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUser ? "bg-primary/20 border border-primary/30" : "bg-card border border-white/10"}`}>
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "bg-primary/15 text-foreground rounded-tr-sm" : "bg-card border border-white/5 text-foreground/90 rounded-tl-sm"}`}>
          {msg.content}
        </div>
        {!isUser && (msg as any).provider && (
          <span className="text-[10px] text-muted-foreground font-mono px-1">via {(msg as any).provider}</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Chat Tab ──────────────────────────────────────────────────────────────────
function ChatTab({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<(ChatMessage & { provider?: string })[]>([
    { role: "assistant", content: "Hi! I'm Pausa AI, your personal finance advisor. I can help you with budgeting, investments, tax planning, debt management, and more — all tailored to the Indian financial system.\n\nWhat's on your mind? 🌱" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<{ income?: number; expenses?: number; goals?: string[] } | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load financial context for richer advice
    Promise.all([getFinancialProfile(userId), getGoals(userId)]).then(([fp, goals]) => {
      if (fp) {
        const expenses = fp.housing_expense + fp.food_expense + fp.transport_expense + fp.utilities_expense + fp.insurance_expense + fp.entertainment_expense + fp.other_expense;
        setUserContext({
          income: fp.monthly_income,
          expenses,
          goals: goals.filter((g) => !g.is_completed).map((g) => g.name),
        });
      }
    });
  }, [userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages, userMsg].filter((m) => m.role === "user" || m.role === "assistant") as ChatMessage[];
    const result = await sendChatMessage(history, userContext);
    setLoading(false);
    setMessages((prev) => [...prev, { role: "assistant", content: result.message, provider: result.provider }]);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {userContext?.income && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 mb-4 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          Financial context loaded — advice will be personalised to your profile.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isLast={i === messages.length - 1} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} onClick={() => send(p)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask anything about your finances..."
          className="flex-1 bg-card border border-white/8 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
          disabled={loading}
        />
        <button onClick={() => send()} disabled={!input.trim() || loading}
          className="w-10 h-10 flex items-center justify-center bg-primary rounded-xl text-[#0A0A0C] hover:bg-primary/90 transition-colors disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Upload Tab ────────────────────────────────────────────────────────────────
function UploadTab({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setError("");
    setAnalyzing(true);

    try {
      const text = await f.text();
      const res = await analyzeFileContent(f.name, text);
      if (res.error) setError(res.error);
      else setResult(res.message);
    } catch (e) {
      setError("Failed to read the file. Try a plain-text CSV or TXT statement.");
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Upload your bank statement (CSV or TXT format) and get instant AI analysis of your spending patterns.</p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
      >
        <input ref={inputRef} type="file" accept=".csv,.txt,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Drop your statement here</p>
        <p className="text-xs text-muted-foreground">Supports CSV, TXT (exported from net banking)</p>
        <p className="text-[11px] text-muted-foreground/50 mt-2">Your data never leaves your browser — analysis happens locally.</p>
      </div>

      {file && (
        <div className="flex items-center gap-3 bg-card border border-white/5 rounded-xl px-4 py-3">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm flex-1 truncate">{file.name}</span>
          <button onClick={() => { setFile(null); setResult(null); setError(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {analyzing && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Analyzing your statement with AI...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-card border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">AI Analysis</span>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

// ── Bank Link Tab ─────────────────────────────────────────────────────────────
function BankLinkTab() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
        <Building2 className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-display font-bold mb-2">Account Aggregator — Coming Soon</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed mb-6">
        Pausa will use India's RBI-regulated <strong>Account Aggregator (AA)</strong> framework to securely link your bank accounts — zero password sharing, consent-based data access.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
        {[
          { icon: "🏦", title: "Connect once", desc: "Link all accounts via AA in one flow" },
          { icon: "🔒", title: "You control data", desc: "Revoke access any time, no data stored" },
          { icon: "🤖", title: "Auto-analysis", desc: "AI reads transactions, builds your vitality score" },
        ].map((item) => (
          <div key={item.title} className="glass-panel rounded-xl p-4">
            <span className="text-2xl block mb-2">{item.icon}</span>
            <p className="text-sm font-semibold mb-1">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-card border border-white/5 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Integration in development — join the waitlist on the home page
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function AIAdvisorInner() {
  const { user } = useUser();
  const [tab, setTab] = useState<"chat" | "upload" | "bank">("chat");

  const TABS = [
    { id: "chat",   label: "💬 Chat",           desc: "Ask anything about money" },
    { id: "upload", label: "📁 Upload Statement", desc: "Analyze bank statement" },
    { id: "bank",   label: "🏦 Link Account",    desc: "Coming soon" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">Pausa AI Advisor</h1>
              <p className="text-muted-foreground text-sm">Your personal finance coach — powered by Gemini AI with Anthropic fallback.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-card border border-white/5 rounded-xl p-1 mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-panel rounded-2xl p-5 md:p-6">
          <AnimatePresence mode="wait">
            {tab === "chat"   && <motion.div key="chat"   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ChatTab userId={user!.id} /></motion.div>}
            {tab === "upload" && <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><UploadTab userId={user!.id} /></motion.div>}
            {tab === "bank"   && <motion.div key="bank"   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BankLinkTab /></motion.div>}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/50 text-center mt-4">
          Pausa AI provides educational guidance only, not regulated financial advice. Consult a SEBI-registered investment adviser for personalised recommendations.
        </p>
      </main>
      <Footer />
    </div>
  );
}

export default function AIAdvisorPage() {
  return <ProtectedRoute><AIAdvisorInner /></ProtectedRoute>;
}
