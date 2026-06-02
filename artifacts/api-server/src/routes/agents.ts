import { Router, type IRouter } from "express";
import multer from "multer";
import PDFParser from "pdf2json";
type PdfParseResult = { text: string; numpages: number };
let _pdfParse: ((buf: Buffer) => Promise<PdfParseResult>) | null = null;

async function getPdfParse(): Promise<(buf: Buffer) => Promise<PdfParseResult>> {
  if (!_pdfParse) {
    // Import from lib path directly — the index.js runs test code when !module.parent
    // which crashes with ENOENT on './test/data/05-versions-space.pdf'
    // @ts-ignore — no type declarations for internal lib path
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    _pdfParse = (mod.default || mod) as (buf: Buffer) => Promise<PdfParseResult>;
  }
  return _pdfParse;
}

import { runFinanceWorkflow, type UserProfile } from "../lib/finance/workflow.js";
import { detectDomains, selectAgent, AGENT_CONFIGS } from "../lib/finance/config.js";
import { QueryAgentBody, AnalyzeQueryBody } from "@workspace/api-zod";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

/**
 * GET /agents — list all available agents
 */
async function parsePDF(buffer: Buffer): Promise<PdfParseResult> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData?.parserError?.message || "Failed to parse PDF"));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const rawText = pdfParser.getRawTextContent() || "";
        // Rough page count
        const numpages = rawText.split(/\f/).length || 1;

        resolve({
          text: rawText.trim(),
          numpages,
        });
      } catch (err) {
        reject(err);
      }
    });

    // ✅ Use parseBuffer instead of loadPDF
    pdfParser.parseBuffer(buffer);
  });
}
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
  // user_profile and currency are extra fields not in the Zod schema — read directly
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
      processing_time_ms: elapsed,
    });
  } catch (err) {
    req.log.error({ err }, "Agent query failed");
    const message = err instanceof Error ? err.message : "Agent query failed";
    const isKeyError = message.includes("GEMINI_API_KEY") || message.includes("API_KEY");
    res.status(500).json({
      error: isKeyError
        ? "API key is not configured. Add GEMINI_API_KEY (or OPENAI_API_KEY + OPENAI_BASE_URL for open-source) in the Secrets tab."
        : message,
    });
  }
});

/**
 * POST /agents/query-file — multipart: file + query
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

    const start = Date.now();

    try {
      let attachments: Array<{ mimeType: string; data: string }> | undefined;

      if (req.file) {
        const { mimetype, buffer } = req.file;

        if (mimetype === "application/pdf") {
          const parsed = await parsePDF(buffer);
    const textContent = parsed.text.slice(0, 14000); // limit to avoid token overflow

    const pdfQuery = `${query}\n\n[Attached PDF — ${parsed.numpages} pages]:\n${textContent}`;

    const result = await runFinanceWorkflow(pdfQuery, conversationHistory, undefined, userProfile, currency);
    
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
            processing_time_ms: elapsed,
          });
          return;
        }

        if (mimetype.startsWith("image/")) {
          attachments = [{ mimeType: mimetype, data: buffer.toString("base64") }];
        }
      }

      const result = await runFinanceWorkflow(query, conversationHistory, attachments, userProfile, currency);
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
        processing_time_ms: elapsed,
      });
    } catch (err) {
      req.log.error({ err }, "Agent file query failed");
      const message = err instanceof Error ? err.message : "Agent query failed";
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
