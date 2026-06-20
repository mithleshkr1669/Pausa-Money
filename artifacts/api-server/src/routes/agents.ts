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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { maxOutputTokens: 65536, temperature: 0 },
  });

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

      const enrichedQuery = `${query}\n\n[Extracted content from uploaded file]:\n${extractedText}`;

      const result = await runFinanceWorkflow(enrichedQuery, conversationHistory, undefined, userProfile, currency);
      const elapsed = Date.now() - start;

      const updatedHistory = [
        ...conversationHistory,
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
