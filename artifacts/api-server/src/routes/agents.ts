import { Router, type IRouter } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runFinanceWorkflow, type UserProfile } from "../lib/finance/workflow.js";
import { detectDomains, selectAgent, AGENT_CONFIGS } from "../lib/finance/config.js";
import { QueryAgentBody, AnalyzeQueryBody } from "@workspace/api-zod";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ---------------------------------------------------------------------------
// Gemini vision extraction — used for both PDFs and images
// ---------------------------------------------------------------------------

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

/**
 * Use Gemini vision to extract transaction text from a PDF or image file.
 * Returns pipe-separated transaction rows for bank statements,
 * or raw extracted text for other documents.
 */
async function extractTextWithGemini(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      text: `You are a precise data extraction engine for financial documents.

If this is a bank statement or transaction list, extract EVERY transaction row.
Output format — one line per transaction, pipe-separated:
DATE | DESCRIPTION | DEBIT | CREDIT | BALANCE

Strict rules for bank statements:
- Scan ALL pages completely before outputting
- Include every single transaction row, none skipped
- If DEBIT column is empty → write 0
- If CREDIT column is empty → write 0
- Preserve exact decimal amounts (e.g. 1234.56 not 1235)
- Do NOT include: headers, account info, opening/closing balance summary rows
- Do NOT add commentary, numbering, or blank lines

If this is NOT a bank statement (e.g. bill, invoice, receipt):
- Extract all relevant financial information as structured text
- Include dates, amounts, descriptions, totals

Output ONLY the extracted content.`,
    },
    {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    },
  ]);

  const finishReason = result.response.candidates?.[0]?.finishReason;
  const extracted = result.response.text();
  const lineCount = extracted.split("\n").filter((l) => l.trim()).length;

  logger.info({ lineCount, finishReason, mimeType }, "Gemini vision extraction complete");

  if (finishReason === "MAX_TOKENS") {
    throw new Error(
      `Document too large — extraction was truncated at ${lineCount} lines. Try splitting the PDF into smaller sections.`
    );
  }

  if (!extracted.trim()) {
    throw new Error(
      "No content could be extracted from the file. The document may be encrypted or unreadable."
    );
  }

  return extracted;
}

// ---------------------------------------------------------------------------
// Server-side bank statement parser
// ---------------------------------------------------------------------------

function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/swiggy|zomato|restaurant|food|cafe|dhaba|eat|grocery|blinkit|bigbasket|dunzo|instamart/.test(d)) return "Food";
  if (/uber|ola|auto|metro|bus|petrol|diesel|fuel|toll|parking|rapido|cab/.test(d)) return "Transport";
  if (/rent|apartment|housing|maintenance|society|flat|pg|hostel/.test(d)) return "Housing";
  if (/netflix|amazon prime|hotstar|disney|spotify|cinema|movie|theatre/.test(d)) return "Entertainment";
  if (/hospital|pharmacy|doctor|medical|health|clinic|apollo|fortis|medicine/.test(d)) return "Healthcare";
  if (/amazon|flipkart|myntra|meesho|ajio|nykaa|shopping|mall|store/.test(d)) return "Shopping";
  if (/electricity|water|mobile|broadband|internet|jio|airtel|vi|bsnl|bill|recharge/.test(d)) return "Utilities";
  if (/emi|loan|repay|equated|mortgage/.test(d)) return "EMI/Loan";
  if (/sip|mutual fund|invest|zerodha|groww|coin|ppf|elss|nps|demat/.test(d)) return "Investment";
  if (/insurance|lic|term|health.*plan/.test(d)) return "Insurance";
  return "Other";
}

interface ParsedTxRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  category: string;
}

function parseTransactionRows(text: string): ParsedTxRow[] {
  const rows: ParsedTxRow[] = [];
  const lines = text.split("\n").filter((l) => l.includes("|"));
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 4) continue;
    const [date, desc, debitStr, creditStr] = parts;
    const debit = parseFloat((debitStr ?? "0").replace(/[₹,\s]/g, "")) || 0;
    const credit = parseFloat((creditStr ?? "0").replace(/[₹,\s]/g, "")) || 0;
    if (debit === 0 && credit === 0) continue;
    if (!desc?.trim()) continue;
    rows.push({
      date: (date ?? "").trim(),
      description: desc.trim().slice(0, 80),
      debit,
      credit,
      category: guessCategory(desc),
    });
  }
  return rows;
}

function buildConfirmData(rows: ParsedTxRow[], period: string) {
  const catMap: Record<string, number> = {};
  const incomeItems: { desc: string; amount: number }[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const row of rows) {
    if (row.credit > 0 && row.debit === 0) {
      incomeItems.push({ desc: row.description, amount: row.credit });
      totalIncome += row.credit;
    } else if (row.debit > 0) {
      catMap[row.category] = (catMap[row.category] || 0) + row.debit;
      totalExpenses += row.debit;
    }
  }
  const expenseItems = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      desc: `${cat} (${rows.filter((r) => r.category === cat && r.debit > 0).length} transactions)`,
      amount: Math.round(amount * 100) / 100,
      category: cat,
    }));
  return {
    period,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    incomeItems,
    expenseItems,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /agents — list all available agents
 */
router.get("/agents", async (_req, res): Promise<void> => {
  const agents = AGENT_CONFIGS.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    domains: a.domains,
  }));
  res.json({ agents, total: agents.length });
});

/**
 * POST /agents/query — main query endpoint (JSON)
 */
router.post("/agents/query", async (req, res): Promise<void> => {
  const parsed = QueryAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query, conversation_history = [] } = parsed.data;
  const userProfile = req.body.user_profile as UserProfile | undefined;
  const currency = req.body.currency as { code: string; symbol: string; name: string } | undefined;
  const start = Date.now();

  try {
    const result = await runFinanceWorkflow(query, conversation_history, undefined, userProfile, currency);
    const elapsed = Date.now() - start;

    const updatedHistory = [
      ...conversation_history,
      { role: "user", content: query },
      { role: "assistant", content: result.response },
    ];

    res.json({
      query,
      agent_name: result.agentName,
      agent_id: result.agentId,
      detected_domains: result.detectedDomains,
      response: result.response,
      conversation_history: updatedHistory,
      skills_used: result.skillsUsed,
      tools_used: result.toolsUsed,
      actions: result.actions,
      processing_time_ms: elapsed,
    });
  } catch (err) {
    req.log.error({ err }, "Agent query failed");
    const message = err instanceof Error ? err.message : "Agent query failed";
    const isKeyError = message.includes("GEMINI_API_KEY") || message.includes("API_KEY");
    res.status(500).json({
      error: isKeyError
        ? "API key is not configured. Add GEMINI_API_KEY in the Secrets tab."
        : message,
    });
  }
});

/**
 * POST /agents/query-file — multipart: file + query
 * Uses Gemini vision to extract text from PDF/image, then runs finance workflow.
 */
router.post(
  "/agents/query-file",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const query = req.body.query as string | undefined;
    const conversationHistoryRaw = req.body.conversation_history as string | undefined;
    const userProfileRaw = req.body.user_profile as string | undefined;
    const currencyRaw = req.body.currency as string | undefined;

    if (!query?.trim()) {
      res.status(400).json({ error: "query field is required" });
      return;
    }

    const conversationHistory = conversationHistoryRaw
      ? (JSON.parse(conversationHistoryRaw) as Array<{ role: string; content: string }>)
      : [];

    let userProfile: UserProfile | undefined;
    try { if (userProfileRaw) userProfile = JSON.parse(userProfileRaw); } catch {}

    let currency: { code: string; symbol: string; name: string } | undefined;
    try { if (currencyRaw) currency = JSON.parse(currencyRaw); } catch {}

    if (!req.file) {
      res.status(400).json({ error: "No file attached" });
      return;
    }

    const { mimetype, buffer } = req.file;
    const start = Date.now();

    try {
      let extractedText: string;

      // Use Gemini vision for both PDFs and images
      if (mimetype === "application/pdf" || mimetype.startsWith("image/")) {
        logger.info({ mimetype, size: buffer.length }, "Extracting file content with Gemini vision");
        extractedText = await extractTextWithGemini(buffer, mimetype);
      } else {
        // Unsupported type — pass raw text attempt
        extractedText = buffer.toString("utf-8").slice(0, 14000);
      }

      // Server-side bank statement parsing — avoids AI JSON truncation
      const parsedRows = parseTransactionRows(extractedText);
      const isBankStatement = parsedRows.length >= 3;
      let parsedConfirmData: ReturnType<typeof buildConfirmData> | null = null;

      if (isBankStatement) {
        const monthMatch = extractedText.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i);
        const period = monthMatch
          ? monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1)
          : new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        parsedConfirmData = buildConfirmData(parsedRows, period);
        logger.info({ txCount: parsedRows.length, period, income: parsedConfirmData.totalIncome, expenses: parsedConfirmData.totalExpenses }, "Server-side bank statement parsing complete");
      }

      let enrichedQuery = `${query}\n\n[Extracted content from uploaded file]:\n${extractedText}`;
      if (isBankStatement && parsedConfirmData) {
        enrichedQuery += `\n\n[SYSTEM: ${parsedRows.length} transactions pre-parsed server-side. Categories: ${Object.entries(
          parsedRows.reduce<Record<string, number>>((acc, r) => { if (r.debit > 0) acc[r.category] = (acc[r.category] || 0) + r.debit; return acc; }, {})
        ).sort(([,a],[,b]) => b-a).slice(0,5).map(([k,v]) => `${k}=₹${Math.round(v)}`).join(", ")}. The :::confirm-transactions block is auto-generated — DO NOT output it yourself. Provide: 1) 1-line summary 2) Category insights 3) Savings opportunities 4) India-specific action steps (SIP/ELSS/UPI). Max 300 words.]`;
      }

      const result = await runFinanceWorkflow(enrichedQuery, conversationHistory, undefined, userProfile, currency);
      const elapsed = Date.now() - start;

      // Ensure confirm-transactions block is always present for bank statements
      let finalResponse = result.response;
      if (parsedConfirmData && !finalResponse.includes(":::confirm-transactions")) {
        const block = `:::confirm-transactions\n${JSON.stringify(parsedConfirmData)}\n:::`;
        finalResponse = block + "\n\n" + finalResponse;
      }

      const updatedHistory = [
        ...conversationHistory,
        { role: "user", content: query },
        { role: "assistant", content: finalResponse },
      ];

      res.json({
        query,
        agent_name: result.agentName,
        agent_id: result.agentId,
        detected_domains: result.detectedDomains,
        response: finalResponse,
        conversation_history: updatedHistory,
        skills_used: result.skillsUsed,
        tools_used: result.toolsUsed,
        actions: result.actions,
        processing_time_ms: elapsed,
        extracted_transactions: isBankStatement ? parsedRows : undefined,
        transaction_count: parsedRows.length,
      });
    } catch (err) {
      req.log.error({ err }, "Agent file query failed");
      const message = err instanceof Error ? err.message : "File analysis failed";
      res.status(500).json({ error: message });
    }
  }
);

/**
 * POST /agents/analyze — detect domains without LLM
 */
router.post("/agents/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeQueryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;
  const domains = detectDomains(query);
  const agent = selectAgent(domains);
  const confidence = domains.includes("GENERAL") ? 0.5 : 0.85;

  res.json({
    query,
    detected_domains: domains,
    recommended_agent: agent.name,
    confidence,
  });
});

/**
 * GET /agents/conversations — placeholder
 */
router.get("/agents/conversations", async (_req, res): Promise<void> => {
  res.json({ conversations: [] });
});

export default router;
