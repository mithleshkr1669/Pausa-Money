import { Layout } from "@/components/layout";
import {
  useGetLlmSettings,
  getGetLlmSettingsQueryKey,
} from "@workspace/api-client-react";
import { Cpu, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export function SettingsPage() {
  const { data, isLoading } = useGetLlmSettings({
    query: { queryKey: getGetLlmSettingsQueryKey() },
  });

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold font-lora flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              LLM Provider Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure which AI model powers your financial advisor.
            </p>
          </div>

          {isLoading ? (
            <div className="p-6 rounded-xl border border-border bg-card animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold">Active Provider</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Currently in use
                    </p>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                    style={{
                      background: "rgba(0,245,212,0.12)",
                      color: "#00f5d4",
                      border: "1px solid rgba(0,245,212,0.2)",
                    }}
                  >
                    {data.provider === "gemini"
                      ? "Google Gemini"
                      : "OpenAI-Compatible"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-white/3 border border-white/6">
                    <span className="text-xs text-muted-foreground">Model</span>
                    <p className="font-medium mt-0.5 text-primary">
                      {data.model}
                    </p>
                  </div>
                  {data.base_url && (
                    <div className="p-3 rounded-lg bg-white/3 border border-white/6">
                      <span className="text-xs text-muted-foreground">
                        Base URL
                      </span>
                      <p className="font-medium mt-0.5 truncate text-xs">
                        {data.base_url}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card">
                <p className="text-sm font-semibold mb-3">Provider Status</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {data.gemini_configured ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Google Gemini</span>
                    </div>
                    <span
                      className={`text-xs ${data.gemini_configured ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {data.gemini_configured ? "Configured" : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {data.openai_configured ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        OpenAI-Compatible (Ollama, etc.)
                      </span>
                    </div>
                    <span
                      className={`text-xs ${data.openai_configured ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {data.openai_configured ? "Configured" : "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <p className="text-sm font-semibold">
                  Configuration (via Secrets tab)
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-primary/15 bg-primary/4">
                    <p className="font-semibold text-primary mb-1.5">
                      Gemini (default)
                    </p>
                    <code className="block text-muted-foreground">
                      GEMINI_API_KEY = your_key
                    </code>
                  </div>
                  <div className="p-3 rounded-lg border border-white/8 bg-white/2">
                    <p className="font-semibold text-foreground mb-1.5">
                      Open-Source LLM (Ollama, LM Studio, OpenRouter)
                    </p>
                    <code className="block text-muted-foreground">
                      LLM_PROVIDER = openai
                    </code>
                    <code className="block text-muted-foreground">
                      OPENAI_BASE_URL = http://localhost:11434/v1
                    </code>
                    <code className="block text-muted-foreground">
                      OPENAI_API_KEY = ollama
                    </code>
                    <code className="block text-muted-foreground">
                      LLM_MODEL = llama3.2
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span>
                    Get a free Gemini API key at{" "}
                    <a
                      href="https://aistudio.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      aistudio.google.com
                    </a>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-border bg-card text-center text-sm text-muted-foreground">
              Could not load settings. Make sure the API server is running.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
