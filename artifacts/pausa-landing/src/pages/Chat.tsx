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
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout";
import { RichMessage } from "@/components/RichMessage";
import { useCurrency } from "@/hooks/useCurrency";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";

const EXAMPLE_PROMPTS = [
  "How much should I save each month on a ₹50,000 income?",
  "Should I pay off debt or start investing?",
  "Calculate my SIP returns: ₹10k/mo for 20 years at 12%",
  "Explain mutual funds vs fixed deposits",
  "How do I build a 6-month emergency fund?",
  "Analyze my tax deductions as a salaried employee",
];

interface AttachedFile {
  file: File;
  preview?: string;
}

export function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] =
    useState<AgentQueryResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currency } = useCurrency();
  const { profile } = useFinancialProfile();

  const queryAgent = useQueryAgent();
  const analyzeQuery = useAnalyzeQuery();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, queryAgent.isPending]);

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

  /** Build enriched query with profile context + currency for the AI */
  const buildEnrichedQuery = useCallback(
    (text: string): string => {
      const lines: string[] = [text, "", "[AI CONTEXT — not from user]"];
      lines.push(
        `Currency: ${currency.name} (${currency.symbol}, ${currency.code})`,
      );
      if (profile.name) lines.push(`User name: ${profile.name}`);
      if (profile.monthlyIncome)
        lines.push(
          `Monthly income: ${currency.symbol}${profile.monthlyIncome.toLocaleString()}`,
        );
      if (profile.monthlyExpenses)
        lines.push(
          `Monthly expenses: ${currency.symbol}${profile.monthlyExpenses.toLocaleString()}`,
        );
      if (profile.age) lines.push(`Age: ${profile.age}`);
      if (profile.occupation) lines.push(`Occupation: ${profile.occupation}`);
      if (profile.goals?.length)
        lines.push(`Goals: ${profile.goals.join(", ")}`);
      if (profile.riskTolerance)
        lines.push(`Risk tolerance: ${profile.riskTolerance}`);
      if (!profile.profileComplete)
        lines.push(
          "Note: User profile not fully set up — gather their financial details naturally",
        );
      return lines.join("\n");
    },
    [currency, profile],
  );

  const handleSend = useCallback(
    async (text: string = input) => {
      const trimmed = text.trim();
      if ((!trimmed && !attachedFile) || queryAgent.isPending) return;

      setApiError(null);
      const userMessage: Message = {
        role: "user",
        content: trimmed || "(file attached)",
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      const fileToSend = attachedFile;
      setAttachedFile(null);

      if (fileToSend) {
        try {
          const formData = new FormData();
          const queryText =
            trimmed ||
            "Please analyze this file and provide financial insights.";
          formData.append("query", buildEnrichedQuery(queryText));
          formData.append("conversation_history", JSON.stringify(messages));
          formData.append("file", fileToSend.file);
          formData.append("user_profile", JSON.stringify(profile));
          formData.append("currency", JSON.stringify(currency));

          const start = Date.now();
          const res = await fetch("/api/agents/query-file", {
            method: "POST",
            body: formData,
          });
          const data = (await res.json()) as AgentQueryResponse & {
            error?: string;
          };

          if (!res.ok) throw new Error(data.error || "File analysis failed");

          const elapsed = Date.now() - start;
          setCurrentResponse({ ...data, processing_time_ms: elapsed });
          setMessages(data.conversation_history);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "File analysis failed";
          setApiError(msg);
          setMessages((prev) => prev.slice(0, -1));
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
            onSuccess: (data: AgentQueryResponse) => {
              setCurrentResponse(data);
              setMessages(data.conversation_history);
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
      input,
      attachedFile,
      messages,
      queryAgent,
      analyzeQuery,
      currency,
      profile,
      buildEnrichedQuery,
    ],
  );

  /** Called from TransactionConfirmCard when user confirms categories */
  const handleConfirmAndAnalyze = useCallback(
    (summary: string) => {
      handleSend(summary);
    },
    [handleSend],
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
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header
          className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0"
          style={{ background: "hsl(0 0% 7%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">
                {profile.name
                  ? `${profile.name}'s Financial Advisor`
                  : "Personal Finance Advisor"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-powered · hyper-personalized
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(0,245,212,0.08)",
                border: "1px solid rgba(0,245,212,0.18)",
                color: "hsl(173 100% 55%)",
              }}
            >
              <span className="font-bold">{currency.symbol}</span>
              <span>{currency.code}</span>
            </div>
            {currentResponse && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/4 border border-white/7 px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" />
                <span>{currentResponse.processing_time_ms}ms</span>
                <span className="w-px h-3 bg-border" />
                <span className="text-primary">
                  {currentResponse.detected_domains?.join(", ")}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-5 pb-4">
            {messages.length === 0 && !isPending && (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-8">
                <div>
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0,245,212,0.15), rgba(64,224,255,0.1))",
                      border: "1px solid rgba(0,245,212,0.2)",
                    }}
                  >
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold font-lora mb-2">
                    {profile.name
                      ? `Welcome back, ${profile.name}!`
                      : "How can I help you today?"}
                  </h2>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {profile.profileComplete
                      ? `I know your income and expenses — my advice will be specific to your situation.`
                      : "Ask anything about budgeting, investing, taxes, debt, or upload a PDF/image for analysis."}
                  </p>
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
              const isLatestAssistant =
                msg.role === "assistant" && i === messages.length - 1;
              return (
                <div
                  key={i}
                  className={`flex message-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="ai-card w-full px-6 py-5">
                      <RichMessage
                        content={msg.content}
                        isLatest={isLatestAssistant}
                        onConfirmAndAnalyze={
                          isLatestAssistant
                            ? handleConfirmAndAnalyze
                            : undefined
                        }
                      />
                      {isLatestAssistant && currentResponse && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 text-xs">
                          {(currentResponse.detected_domains as string[]).map(
                            (d) => (
                              <span
                                key={d}
                                className="px-2 py-0.5 rounded-full text-primary bg-primary/10 border border-primary/15 font-medium"
                              >
                                {d}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(0,245,212,0.18), rgba(64,224,255,0.12))",
                        border: "1px solid rgba(0,245,212,0.25)",
                        color: "hsl(43 17% 93%)",
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              );
            })}

            {isPending && (
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
                      {analyzeQuery.data
                        ? `Analyzing ${analyzeQuery.data.recommended_agent}...`
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
                  <img
                    src={attachedFile.preview}
                    alt=""
                    className="w-8 h-8 rounded object-cover"
                  />
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
                      <>
                        <ImageIcon className="w-2.5 h-2.5 inline mr-1" />
                        Image
                      </>
                    ) : (
                      <>
                        <FileText className="w-2.5 h-2.5 inline mr-1" />
                        PDF
                      </>
                    )}
                    {" · "}
                    {(attachedFile.file.size / 1024).toFixed(0)} KB
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
                    ? `Ask ${profile.name}'s advisor anything...`
                    : `Ask about finance in ${currency.symbol} ${currency.code}...`
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

            <p className="text-center mt-2 text-[11px] text-muted-foreground/50">
              AI can make mistakes. Verify important financial decisions with a
              licensed professional.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
