import { Router, type IRouter } from "express";
import { getLLMConfig } from "../lib/finance/workflow.js";

const router: IRouter = Router();

/**
 * GET /settings/llm — return current LLM provider config (keys redacted)
 */
router.get("/settings/llm", async (_req, res): Promise<void> => {
  const config = getLLMConfig();
  res.json({
    provider: config.provider,
    model: config.model,
    base_url: config.baseUrl,
    has_api_key: !!config.apiKey,
    gemini_configured: !!process.env.GEMINI_API_KEY,
    openai_configured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL),
    available_providers: ["gemini", "openai"],
    env_hints: {
      gemini: "Set GEMINI_API_KEY in Secrets tab",
      openai: "Set LLM_PROVIDER=openai, OPENAI_BASE_URL, OPENAI_API_KEY, LLM_MODEL in Secrets tab",
    },
  });
});

export default router;
