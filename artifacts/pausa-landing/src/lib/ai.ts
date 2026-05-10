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

const SYSTEM_PROMPT = `You are Pausa AI, a warm and knowledgeable personal finance advisor specializing in Indian personal finance. You help users with:

- Budgeting using the 50/30/20 rule adapted for Indian salaries
- Indian investment options: SIP, ELSS, PPF, NPS, FD, RD, SGBs, REITs
- Tax planning under the Indian Income Tax Act (80C, 80D, 80CCD, HRA, etc.)
- Emergency fund building (6 months of expenses)
- Debt management (credit card, personal loans, home loans)
- Insurance planning (term insurance = 10-15× annual income, health insurance)
- Goal-based savings

Guidelines:
- Always use Indian Rupees (₹)
- Reference Indian financial institutions: Zerodha, Groww, HDFC, SBI, LIC, etc.
- Be practical, warm, and direct — like a knowledgeable friend
- If a situation is complex, recommend consulting a SEBI-registered investment adviser (RIA)
- Never make specific stock recommendations
- Keep responses concise (2-4 short paragraphs max unless asked for detail)
- End with 1 actionable "Next Step" they can take today`;

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
