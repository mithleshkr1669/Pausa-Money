import { Router, type IRouter } from "express";
import {
  runEvalSuite,
  cacheEvalResult,
  getLastEvalResult,
  EVAL_TEST_CASES,
} from "../lib/finance/eval.js";
import { RunEvalBody } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /eval/results — get the last cached eval results (or run a quick eval)
 */
router.get("/eval/results", async (_req, res): Promise<void> => {
  let result = getLastEvalResult();

  if (!result) {
    // Run a quick routing-only eval on first load
    result = await runEvalSuite({ fullLlm: false });
    cacheEvalResult(result);
  }

  res.json(result);
});

/**
 * POST /eval/run — run the evaluation suite
 */
router.post("/eval/run", async (req, res): Promise<void> => {
  const parsed = RunEvalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { test_ids, categories, max_tests } = parsed.data;

  try {
    req.log.info(
      { test_ids, categories, max_tests },
      "Starting eval suite"
    );

    const result = await runEvalSuite({
      testIds: test_ids as string[] | undefined,
      categories: categories as string[] | undefined,
      maxTests: max_tests as number | undefined,
      // Use full LLM only if explicitly requested via max_tests ≤ 5 (small run)
      fullLlm: typeof max_tests === "number" && max_tests <= 5,
    });

    cacheEvalResult(result);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Eval suite failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Eval suite failed",
    });
  }
});

export default router;
