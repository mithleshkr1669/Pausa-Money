import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryAgent, useAnalyzeQuery } from "@workspace/api-client-react";
import type { Message, AgentQueryResponse } from "@workspace/api-client-react";
import {
  Send,
  Plus,
  X,
  FileText,
  ImageIcon,
  Bot,
  ChevronRight,
  AlertCircle,
  Users,
  ToolCase,
  TrendingUp,
  BarChart3,
  Target,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RichMessage } from "@/components/RichMessage";
import { useCurrency } from "@/hooks/useCurrency";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { AppShell, NavItem } from "@/components/layout/Appshell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getProfile, upsertProfile } from "@/lib/community";
import { isClerkConfigured } from "@/lib/clerk-config";
import {
  Transaction,
  useFinancialAnalysis,
} from "@/hooks/useFinancialAnalysis";
import { useLocation } from "wouter";

const EXAMPLE_PROMPTS = [
  "My monthly salary is ₹60,000 and I spend about ₹35,000",
  "I want to save ₹5 lakhs for a car in 2 years",
  "Show me the SIP calculator",
  "Should I pay off debt or start investing?",
  "Create an emergency fund goal of ₹2 lakhs",
  "Analyze my spending and open analysis page",
];

interface AppAction {
  type:
    | "update_profile"
    | "create_goal"
    | "delete_goal"
    | "navigate"
    | "run_calculator"
    | "show_analysis";
  data: Record<string, unknown>;
  label?: string;
}

interface ChatMessage extends Message {
  attachment?: {
    type: "image" | "pdf";
    preview?: string;
    fileName?: string;
    fileSize?: number;
  };
  actions?: AppAction[];
}

interface AttachedFile {
  file: File;
  preview?: string;
}

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: "goals",
    label: "Goals",
    icon: <Target className="w-4 h-4" />,
  },
  {
    id: "finance",
    label: "Financial Plan",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: "analysis",
    label: "Analysis",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: "advisor",
    label: "AI Advisor",
    icon: <Bot className="w-4 h-4" />,
  },
  {
    id: "tools",
    label: "Tools",
    icon: <ToolCase className="w-4 h-4" />,
    dividerAbove: true,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <Users className="w-4 h-4" />,
  },
];

type ViewTab = "all" | "mine" | "liked" | "participated" | "saved" | "stories" | "tools";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function ChatPageV2() {
  const clerk = isClerkConfigured ? useClerkUser() : { user: null };
  const user = clerk.user;
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const { addAnalysis } = useFinancialAnalysis();
  const { updateProfile, profile } = useFinancialProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState<AgentQueryResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [executedActions, setExecutedActions] = useState<AppAction[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeItem, setActiveItem] = useState<ViewTab>("all");
  const { currency } = useCurrency();
  const [profiles, setProfile] = useState<ReturnType<typeof getProfile> extends Promise<infer T> ? T : never>(null);
  const queryAgent = useQueryAgent();
  const analyzeQuery = useAnalyzeQuery();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, queryAgent.isPending]);

  useEffect(() => {
    if (user) {
      upsertProfile(
        user.id,
        user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
        user.imageUrl,
      );
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setAttachedFile({ file, preview: ev.target?.result as string });
      reader.readAsDataURL(file);
    } else {
      setAttachedFile({ file });
    }
    e.target.value = "";
  };

  const removeFile = () => setAttachedFile(null);

  /** Execute AI actions returned from the API */
  const executeActions = useCallback(
    async (actions: AppAction[]) => {
      if (!actions || actions.length === 0) return;

      for (const action of actions) {
        try {
          if (action.type === "update_profile") {
            const data = action.data as Record<string, unknown>;
            const patch: Record<string, unknown> = {};
            if (data.name !== undefined) patch.name = String(data.name);
            if (data.age !== undefined) patch.age = Number(data.age);
            if (data.occupation !== undefined) patch.occupation = String(data.occupation);
            if (data.monthlyIncome !== undefined) patch.monthlyIncome = Number(data.monthlyIncome);
            if (data.monthlyExpenses !== undefined) patch.monthlyExpenses = Number(data.monthlyExpenses);
            if (data.riskTolerance !== undefined) patch.riskTolerance = data.riskTolerance as "low" | "medium" | "high";
            if (data.goals !== undefined) patch.goals = data.goals as string[];
            updateProfile(patch as Parameters<typeof updateProfile>[0]);
            await apiPost("/api/profile", patch);
          }

          if (action.type === "create_goal") {
            await apiPost("/api/goals", action.data);
          }

          if (action.type === "navigate") {
            const page = (action.data.page as string) || "";
            const pageMap: Record<string, string> = {
              tools: "/tools",
              analysis: "/analysis",
              dashboard: "/dashboard",
              community: "/community",
              profile: "/profile",
            };
            if (pageMap[page]) {
              setTimeout(() => navigate(pageMap[page]), 600);
            }
          }

          if (action.type === "show_analysis") {
            setTimeout(() => navigate("/analysis"), 600);
          }

          if (action.type === "run_calculator") {
            setTimeout(() => navigate("/tools"), 600);
          }
        } catch (err) {
          console.error("Action execution failed:", action.type, err);
        }
      }

      setExecutedActions((prev) => [...prev, ...actions]);
    },
    [updateProfile, navigate],
  );

  const buildEnrichedQuery = useCallback(
    (text: string): string => {
      const lines: string[] = [text, "", "[AI CONTEXT — not from user]"];
      lines.push(`Currency: ${currency.name} (${currency.symbol}, ${currency.code})`);
      if (profile.name) lines.push(`User name: ${profile.name}`);
      if (profile.monthlyIncome)
        lines.push(`Monthly income: ${currency.symbol}${profile.monthlyIncome.toLocaleString()}`);
      if (profile.monthlyExpenses)
        lines.push(`Monthly expenses: ${currency.symbol}${profile.monthlyExpenses.toLocaleString()}`);
      if (profile.age) lines.push(`Age: ${profile.age}`);
      if (profile.occupation) lines.push(`Occupation: ${profile.occupation}`);
      if (profile.goals?.length) lines.push(`Goals: ${profile.goals.join(", ")}`);
      if (profile.riskTolerance) lines.push(`Risk tolerance: ${profile.riskTolerance}`);
      if (!profile.profileComplete)
        lines.push("Note: User profile not fully set up — gather their financial details naturally");
      return lines.join("\n");
    },
    [currency, profile],
  );

  const [isFileLoading, setIsFileLoading] = useState(false);

  const handleSend = useCallback(
    async (text: string = input) => {
      const trimmed = text.trim();
      if ((!trimmed && !attachedFile) || queryAgent.isPending) return;

      setApiError(null);
      const userMessage: ChatMessage = {
        role: "user",
        content: trimmed || "Uploaded a file",
        attachment: attachedFile
          ? {
              type: attachedFile.file.type.startsWith("image/") ? "image" : "pdf",
              preview: attachedFile.preview,
              fileName: attachedFile.file.name,
              fileSize: attachedFile.file.size,
            }
          : undefined,
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      const fileToSend = attachedFile;
      setAttachedFile(null);

      if (fileToSend) {
        setIsFileLoading(true);
        try {
          const formData = new FormData();
          const queryText = trimmed || "Please analyze this file and provide financial insights.";
          formData.append("query", buildEnrichedQuery(queryText));
          formData.append("conversation_history", JSON.stringify(messages));
          formData.append("file", fileToSend.file);
          formData.append("user_profile", JSON.stringify(profile));
          formData.append("currency", JSON.stringify(currency));

          const start = Date.now();
          const res = await fetch(`${BASE_URL}/api/agents/query-file`, {
            method: "POST",
            body: formData,
          });
          const data = (await res.json()) as AgentQueryResponse & {
            error?: string;
            actions?: AppAction[];
          };

          if (!res.ok) throw new Error(data.error || "File analysis failed");

          const elapsed = Date.now() - start;
          setCurrentResponse({ ...data, processing_time_ms: elapsed });
          const lastMsg = data.conversation_history[data.conversation_history.length - 1];
          const updatedHistory: ChatMessage[] = [
            ...data.conversation_history.slice(0, -1),
            { ...lastMsg, actions: data.actions },
          ];
          setMessages(updatedHistory);
          if (data.actions?.length) await executeActions(data.actions);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "File analysis failed";
          setApiError(msg);
          setMessages((prev) => prev.slice(0, -1));
        } finally {
          setIsFileLoading(false);
        }
        return;
      }

      if (trimmed) {
        analyzeQuery.mutate({ data: { query: trimmed } });
        queryAgent.mutate(
          {
            data: {
              query: buildEnrichedQuery(trimmed),
              conversation_history: messages,
            } as Parameters<typeof queryAgent.mutate>[0]["data"],
          },
          {
            onSuccess: async (data: AgentQueryResponse & { actions?: AppAction[] }) => {
              setCurrentResponse(data);
              const lastMsg = data.conversation_history[data.conversation_history.length - 1];
              const updatedHistory: ChatMessage[] = [
                ...data.conversation_history.slice(0, -1),
                { ...lastMsg, actions: (data as any).actions },
              ];
              setMessages(updatedHistory);
              if ((data as any).actions?.length) await executeActions((data as any).actions);
            },
            onError: (err: any) => {
              const msg =
                err?.response?.data?.error ||
                "Something went wrong. Check that your GEMINI_API_KEY is configured in Secrets.";
              setApiError(msg);
              setMessages((prev) => prev.slice(0, -1));
            },
          },
        );
      }
    },
    [
      input, attachedFile, messages, queryAgent, analyzeQuery,
      currency, profile, buildEnrichedQuery, executeActions,
    ],
  );

  const handleConfirmAndAnalyze = useCallback(
    (summary: string, transactions?: Transaction[]) => {
      if (transactions && transactions.length > 0) {
        const totalIncome = transactions
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0);
        const totalExpenses = transactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0);

        addAnalysis({
          period: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
          totalIncome,
          totalExpenses,
          transactions,
        });

        if (totalIncome > 0) {
          updateProfile({ monthlyIncome: totalIncome, monthlyExpenses: totalExpenses });
        }
      }
      handleSend(summary);
    },
    [handleSend, addAnalysis, updateProfile],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const isPending = queryAgent.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5 pb-4">
          {messages.length === 0 && !isPending && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-8">
              <div>
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,245,212,0.15), rgba(64,224,255,0.1))",
                    border: "1px solid rgba(0,245,212,0.2)",
                  }}
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold font-lora mb-2">
                  {profile.name ? `Welcome back, ${profile.name}!` : "Hi, I'm FinAdvisor"}
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {profile.profileComplete
                    ? `I know your finances — just chat and I'll take action for you.`
                    : "Tell me your income, goals, or anything financial. I'll update your profile and take real actions as we chat."}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Zap className="w-3 h-3 text-primary" />
                  <span>I can update your profile, create goals, open tools — all through chat</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="flex items-start gap-2 text-left text-xs px-3.5 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-white/3 transition-all duration-150 group"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    <span className="leading-snug text-muted-foreground group-hover:text-foreground transition-colors">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLatestAssistant = msg.role === "assistant" && i === messages.length - 1;
            return (
              <div
                key={i}
                className={`flex message-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" ? (
                  <div className="w-full space-y-2">
                    <div className="ai-card w-full px-6 py-5">
                      <RichMessage
                        content={msg.content}
                        isLatest={isLatestAssistant}
                        onConfirmAndAnalyze={isLatestAssistant ? handleConfirmAndAnalyze : undefined}
                      />
                      {isLatestAssistant && currentResponse && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 text-xs">
                          {(currentResponse.detected_domains as string[]).map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 rounded-full text-primary bg-primary/10 border border-primary/15 font-medium"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action chips — show what the AI did */}
                    {(msg as ChatMessage).actions && (msg as ChatMessage).actions!.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {(msg as ChatMessage).actions!.map((action, ai) => (
                          <div
                            key={ai}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: "rgba(0,245,212,0.08)",
                              border: "1px solid rgba(0,245,212,0.2)",
                              color: "hsl(173 100% 65%)",
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{action.label || action.type.replace(/_/g, " ")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[75%] flex flex-col items-end gap-1.5">
                    {(msg as ChatMessage).attachment &&
                      ((msg as ChatMessage).attachment!.type === "image" &&
                      (msg as ChatMessage).attachment!.preview ? (
                        <div
                          className="rounded-xl rounded-br-sm overflow-hidden"
                          style={{ border: "1px solid rgba(0,245,212,0.25)" }}
                        >
                          <img
                            src={(msg as ChatMessage).attachment!.preview}
                            alt="uploaded"
                            className="max-w-[260px] max-h-[180px] object-cover block"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl rounded-br-sm"
                          style={{
                            background: "rgba(64,224,255,0.08)",
                            border: "1px solid rgba(64,224,255,0.2)",
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "rgba(64,224,255,0.12)" }}
                          >
                            <FileText className="w-4 h-4 text-sky-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground truncate max-w-[180px]">
                              {(msg as ChatMessage).attachment!.fileName}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              PDF ·{" "}
                              {(((msg as ChatMessage).attachment!.fileSize || 0) / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    {msg.content && msg.content !== "Uploaded a file" && (
                      <div
                        className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
                        style={{
                          background: "linear-gradient(135deg, rgba(0,245,212,0.18), rgba(64,224,255,0.12))",
                          border: "1px solid rgba(0,245,212,0.25)",
                          color: "hsl(43 17% 93%)",
                        }}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {(isPending || isFileLoading) && (
            <div className="flex justify-start message-in">
              <div className="ai-card px-6 py-5 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((n) => (
                      <div
                        key={n}
                        className="pulse-dot w-2 h-2 rounded-full bg-primary"
                        style={{ animationDelay: `${n * 0.2}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isFileLoading
                      ? "Reading your file..."
                      : analyzeQuery.data
                      ? `Working on it with ${analyzeQuery.data.recommended_agent}...`
                      : "Thinking..."}
                  </span>
                </div>
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          )}

          {apiError && (
            <div className="flex justify-start message-in">
              <div
                className="max-w-[90%] px-4 py-3 rounded-xl flex items-start gap-3 text-sm"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border">
        <div className="max-w-3xl mx-auto">
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/6 w-fit">
              {attachedFile.preview ? (
                <img src={attachedFile.preview} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground truncate max-w-44">
                  {attachedFile.file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {attachedFile.file.type.startsWith("image/") ? (
                    <><ImageIcon className="w-2.5 h-2.5 inline mr-1" />Image</>
                  ) : (
                    <><FileText className="w-2.5 h-2.5 inline mr-1" />PDF</>
                  )}
                  {" · "}{(attachedFile.file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                onClick={removeFile}
                className="ml-1 p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all"
            style={{
              background: "hsl(0 0% 10%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150 shrink-0 mb-0.5"
              title="Attach image or PDF"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                profile.name
                  ? `Tell ${profile.name}'s advisor what to do...`
                  : "Tell me your income, a goal, or ask anything financial..."
              }
              className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground min-h-6 max-h-30 leading-relaxed py-0.5"
              rows={1}
              disabled={isPending}
              data-testid="input-chat-message"
            />
            <button
              className="p-1.5 rounded-lg shrink-0 mb-0.5 transition-all duration-150 disabled:opacity-40"
              style={{
                background:
                  (!input.trim() && !attachedFile) || isPending
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, #00f5d4, #40e0ff)",
                color:
                  (!input.trim() && !attachedFile) || isPending
                    ? "rgba(255,255,255,0.3)"
                    : "#0a0a0a",
              }}
              disabled={(!input.trim() && !attachedFile) || isPending}
              onClick={() => handleSend()}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-1.5">
            <Zap className="w-2.5 h-2.5 inline mr-1 text-primary" />
            FinAdvisor can update your profile, create goals, and open tools — all from this chat
          </p>
        </div>
      </div>
    </div>
  );
}
