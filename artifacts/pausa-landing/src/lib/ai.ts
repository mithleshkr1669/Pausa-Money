// AI client — calls the /api/ai/chat endpoint (which handles Gemini → Anthropic fallback)

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatResponse {
  message: string;
  provider: "gemini" | "anthropic" | "fallback";
  error?: string;
}

const SYSTEM_PROMPT = `You are a Certified Financial Planner (CFP) specializing in Indian personal finance. Your role is to provide professional, evidence-based financial guidance.

Core Competencies:
- Comprehensive financial planning (6-step process: gather data → analyze → recommend → implement → monitor → update)
- Indian investment vehicles: SIP, ELSS, PPF, NPS, FD, RD, SGBs, REITs, Gold, Real Estate
- Tax optimization: Section 80C, 80D, 80CCD, HRA, house property deductions
- Risk assessment & insurance: Term insurance (10-15× annual income), health insurance, critical illness, disability
- Debt management & optimization
- Retirement planning with inflation adjustments
- Goal-based wealth accumulation
- Cash flow optimization and budgeting

Professional Standards:
- Always quantify recommendations in ₹ with time horizons
- Reference SEBI-regulated platforms only (Zerodha, Groww, HDFC, SBI, etc.)
- Disclose when complex situations require SEBI-registered RIA consultation
- No specific stock tips or guaranteed returns claims
- Document assumptions and risks clearly
- Adapt recommendations to user's risk profile (Conservative/Moderate/Aggressive)

Communication Style:
- Professional yet approachable
- Use data to support advice
- Explain the "why" behind recommendations
- Ask clarifying questions before advising
- Provide actionable next steps with timelines
- Be concise (2-4 short paragraphs max unless asked for detail)

When users upload financial documents (PDF/CSV/TXT):
1. Extract and analyze the financial data carefully
2. Confirm the extracted information: "This is what I see in your document - is this correct?"
3. Ask if they want to edit any values
4. Only proceed with analysis after explicit confirmation
5. Provide a structured financial analysis based on confirmed data`;

export async function sendChatMessage(
  messages: ChatMessage[],
  userContext?: { income?: number; expenses?: number; goals?: string[] }
): Promise<AIChatResponse> {
  const contextStr = userContext
    ? `\n\n[User context: Monthly income ₹${userContext.income?.toLocaleString("en-IN") ?? "unknown"}, Monthly expenses ₹${userContext.expenses?.toLocaleString("en-IN") ?? "unknown"}${userContext.goals?.length ? `, Goals: ${userContext.goals.join(", ")}` : ""}]`
    : "";

  try {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const res = await fetch(`${base}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        systemPrompt: SYSTEM_PROMPT + contextStr,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Server error" }));
      return { message: err.error ?? "Failed to get response.", provider: "fallback", error: err.error };
    }

    const data = await res.json();
    return { message: data.message, provider: data.provider };
  } catch (e) {
    console.error("[ai.ts sendChatMessage]", e);
    return {
      message: "I'm having trouble connecting right now. Check that GEMINI_API_KEY or ANTHROPIC_API_KEY is set in the API server environment.",
      provider: "fallback",
      error: String(e),
    };
  }
}

export async function analyzeFileContent(fileName: string, fileText: string): Promise<AIChatResponse> {
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `I've uploaded a bank statement / financial document named "${fileName}". Here is the extracted content:\n\n${fileText.slice(0, 4000)}\n\nPlease analyze this and give me:\n1. A summary of spending patterns\n2. Top 3 categories I'm spending most on\n3. Actionable suggestions to improve my finances`,
    },
  ];
  return sendChatMessage(messages);
}

// Quick prompt suggestions
export const QUICK_PROMPTS = [
  "How should I split my ₹50,000 monthly salary?",
  "What's the best SIP for a 5-year goal?",
  "How much term insurance do I actually need?",
  "Should I invest in PPF or NPS for retirement?",
  "How do I build a 6-month emergency fund quickly?",
  "Best way to pay off credit card debt faster?",
];
