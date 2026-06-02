/**
 * Personal Finance Agent Workflow
 * Supports Gemini and OpenAI-compatible (Ollama, etc.) providers.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectDomains, selectAgent, AGENT_CONFIGS } from "./config.js";
import { SYSTEM_PROMPTS } from "./prompts.js";
import { getRelevantSkillContent } from "../skill-loader.js";
import { logger } from "../logger.js";

// ---------------------------------------------------------------------------
// LLM Provider config
// ---------------------------------------------------------------------------

export type LLMProvider = "gemini" | "openai";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface UserProfile {
  name?: string;
  age?: number | null;
  occupation?: string;
  monthlyIncome?: number | null;
  monthlyExpenses?: number | null;
  goals?: string[];
  riskTolerance?: string;
  profileComplete?: boolean;
}

export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER as LLMProvider) || "gemini";
  if (provider === "openai") {
    return {
      provider: "openai",
      model: process.env.LLM_MODEL || "llama3.2",
      baseUrl: process.env.OPENAI_BASE_URL || "http://localhost:11434/v1",
      apiKey: process.env.OPENAI_API_KEY || "ollama",
    };
  }
  return {
    provider: "gemini",
    model: process.env.LLM_MODEL || "gemini-2.0-flash",
  };
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    // const key = process.env.GEMINI_API_KEY;
    const key = "AIzaSyBFuWa60pTRhPns2IFDcb26lT_Zs4UMsFM"
    if (!key) throw new Error("GEMINI_API_KEY environment variable is not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-8b"];

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  attachments?: Array<{ mimeType: string; data: string }>
): Promise<string> {
  const genAI = getGenAI();
  let lastErr: unknown;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 3000, temperature: 0.75 },
      });

      const chatHistory = history.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history: chatHistory });

      if (attachments && attachments.length > 0) {
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: userMessage },
          ...attachments.map((a) => ({ inlineData: { mimeType: a.mimeType, data: a.data } })),
        ];
        const result = await chat.sendMessage(parts);
        return result.response.text();
      }

      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 503) {
        logger.warn({ model: modelName, status }, "Rate limited, trying next model");
        lastErr = err;
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }

  throw Object.assign(
    new Error(
      "All Gemini models are rate-limited. Check https://aistudio.google.com or wait a minute and retry."
    ),
    { isRateLimit: true, cause: lastErr }
  );
}

// ---------------------------------------------------------------------------
// OpenAI-compatible
// ---------------------------------------------------------------------------

async function callOpenAI(
  config: LLMConfig,
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const baseUrl = config.baseUrl!.replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, messages, max_tokens: 3000, temperature: 0.75 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI-compatible API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content || "";
}

// ---------------------------------------------------------------------------
// Unified call
// ---------------------------------------------------------------------------

async function callLLM(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = [],
  attachments?: Array<{ mimeType: string; data: string }>
): Promise<string> {
  const config = getLLMConfig();
  if (config.provider === "openai") return callOpenAI(config, systemPrompt, userMessage, history);
  return callGemini(systemPrompt, userMessage, history, attachments);
}

// ---------------------------------------------------------------------------
// Build hyper-personalized system prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  basePrompt: string,
  skillContent: string,
  userProfile?: UserProfile,
  currency?: { code: string; symbol: string; name: string }
): string {
  const sym = currency?.symbol || "₹";
  const curName = currency ? `${currency.name} (${currency.symbol}, ${currency.code})` : "Indian Rupee (₹, INR)";

  // Build profile context section
  let profileSection = "";
  if (userProfile?.monthlyIncome || userProfile?.monthlyExpenses || userProfile?.name) {
    const income = userProfile.monthlyIncome;
    const expenses = userProfile.monthlyExpenses;
    const savings = income && expenses ? income - expenses : null;
    const savingsRate = income && savings != null ? ((savings / income) * 100).toFixed(0) : null;

    profileSection = `
═══════════════════════════════════════
USER FINANCIAL PROFILE (USE THIS TO PERSONALIZE EVERY RESPONSE):
${userProfile.name ? `• Name: ${userProfile.name} — address them by name` : "• Name: not provided — use friendly tone"}
${userProfile.age ? `• Age: ${userProfile.age} years old — consider life stage in advice` : ""}
${userProfile.occupation ? `• Occupation: ${userProfile.occupation}` : ""}
${income ? `• Monthly income: ${sym}${income.toLocaleString()} ${currency?.code || "INR"}` : "• Monthly income: NOT SET — ask if needed"}
${expenses ? `• Monthly expenses: ${sym}${expenses.toLocaleString()} ${currency?.code || "INR"}` : "• Monthly expenses: NOT SET — ask if needed"}
${savings != null ? `• Monthly savings: ${sym}${savings.toLocaleString()} (${savingsRate}% savings rate${Number(savingsRate) >= 20 ? " — excellent! 🎯" : Number(savingsRate) >= 10 ? " — good" : " — needs improvement"})` : ""}
${userProfile.goals?.length ? `• Financial goals: ${userProfile.goals.join(", ")}` : ""}
${userProfile.riskTolerance ? `• Risk tolerance: ${userProfile.riskTolerance}` : ""}
═══════════════════════════════════════
`;
  } else {
    profileSection = `
═══════════════════════════════════════
USER PROFILE: Not set up yet.
- If your response needs income/expenses to be accurate, request it via the :::confirm-financials block.
- Introduce yourself warmly and help them set up their financial profile naturally through conversation.
═══════════════════════════════════════
`;
  }

  return `${basePrompt}

${profileSection}

DEFAULT CURRENCY: ${curName}. Express ALL monetary amounts in this currency unless the user specifies otherwise.

HYPER-PERSONALIZATION RULES — THIS IS CRITICAL:
1. You are FinAdvisor — a deeply personal, proactive, and empathetic AI financial advisor. NOT a generic chatbot.
2. Address users by name when known. Build a genuine relationship through the conversation.
3. Give SPECIFIC advice with EXACT amounts based on their actual income/expenses — not generic ranges.
   ❌ WRONG: "Save 10-20% of your income"
   ✅ RIGHT: "With your ₹50,000 income, saving ₹8,000/month (16%) gets you to ₹96,000 in a year"
4. Reference what they told you earlier in the conversation. Show continuity.
5. Be genuinely curious. Ask follow-up questions that matter: "You mentioned EMIs — what's the interest rate?"
6. Show empathy around financial stress, celebrate progress, acknowledge challenges.
7. Proactively spot opportunities: "Based on your numbers, you could invest ₹3,000 more by trimming entertainment"
8. Always end with 2-3 specific, actionable next steps with exact amounts and timelines.

═══════════════════════════════════════
HUMAN-IN-THE-LOOP PROTOCOL (MANDATORY):
═══════════════════════════════════════

SITUATION A — Analysis needs income/expenses but they're not in the profile:
Give partial guidance first, then include this exact block:

:::confirm-financials
{"monthlyIncome": <estimated from query or null>, "monthlyExpenses": <estimated or null>, "source": "I need your actual numbers to give you a precise plan", "question": "Could you confirm your monthly income and total expenses? I want to give you exact numbers, not estimates."}
:::

SITUATION B — User uploads a PDF/image with transactions or bank statements:
ALWAYS categorize everything and include this exact block (MANDATORY for file analysis):

:::confirm-transactions
{"period": "Month YYYY or 'Provided period'", "totalIncome": 0, "totalExpenses": 0, "incomeItems": [{"desc": "Description", "amount": 0}], "expenseItems": [{"desc": "Description", "amount": 0, "category": "Food|Transport|Housing|Entertainment|Healthcare|Shopping|Utilities|Other"}]}
:::

SITUATION C — User describes transactions verbally:
Extract what you can, fill the confirm block, and ask them to verify.

IMPORTANT: Output the :::confirm-financials or :::confirm-transactions block BEFORE your main analysis when you need data confirmation.

═══════════════════════════════════════
CHART & VISUALIZATION RULES:
═══════════════════════════════════════
For ANY calculation, projection, comparison, or budget — output a chart block:

\`\`\`chart
{
  "type": "bar|line|pie|area",
  "title": "Descriptive title",
  "data": [{"name": "Label", "value": 123}, ...],
  "xKey": "name",
  "yKey": "value",
  "color": "#00f5d4"
}
\`\`\`

- Budget breakdowns → pie chart
- Investment growth over time → area chart  
- Comparisons (strategy A vs B) → bar chart
- Trend analysis → line chart
- Portfolio allocation → pie chart

Keep chart data concise: 4-8 data points maximum for readability.

═══════════════════════════════════════
KNOWLEDGE BASE:
═══════════════════════════════════════
${skillContent}

RESPONSE FORMATTING:
- Use ## headers for sections, **bold** for key terms, *italics* for emphasis
- Use > blockquote for key insights/warnings
- Numbered lists for action steps, bullet lists for options
- Be warm and conversational, not robotic
- Always include a ✅ Next Steps section with 2-3 specific actions`;
}

// ---------------------------------------------------------------------------
// Main workflow
// ---------------------------------------------------------------------------

export interface WorkflowState {
  user_query: string;
  conversation_history: Array<{ role: string; content: string }>;
  detected_domains: string[];
  selected_agent_id: string;
  final_response: string;
  skills_used: string[];
  tools_used: string[];
  attachments?: Array<{ mimeType: string; data: string }>;
}

export async function runFinanceWorkflow(
  userQuery: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  attachments?: Array<{ mimeType: string; data: string }>,
  userProfile?: UserProfile,
  currency?: { code: string; symbol: string; name: string }
): Promise<{
  response: string;
  agentId: string;
  agentName: string;
  detectedDomains: string[];
  skillsUsed: string[];
  toolsUsed: string[];
}> {
  const domains = detectDomains(userQuery);
  const agentConfig = selectAgent(domains);

  logger.debug({ domains, agent: agentConfig.id }, "Workflow: routing");

  const basePrompt = SYSTEM_PROMPTS[agentConfig.id] || SYSTEM_PROMPTS.general_finance;
  const skillContent = getRelevantSkillContent(domains);
  const enrichedPrompt = buildSystemPrompt(basePrompt, skillContent, userProfile, currency);

  const response = await callLLM(enrichedPrompt, userQuery, conversationHistory, attachments);

  return {
    response,
    agentId: agentConfig.id,
    agentName: agentConfig.name,
    detectedDomains: domains,
    skillsUsed: domains.map((d) => d.toLowerCase()),
    toolsUsed: [],
  };
}

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

export async function executeAgentWithTools(
  query: string,
  agentId: string,
  toolNames: string[]
): Promise<{ response: string; toolsUsed: string[] }> {
  const systemPrompt = SYSTEM_PROMPTS[agentId] || SYSTEM_PROMPTS.general_finance;
  const response = await callLLM(systemPrompt, query);
  return { response, toolsUsed: toolNames };
}
