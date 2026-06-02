import { Router, type IRouter } from "express";
import { getAllTools, getTool } from "../lib/finance/tools.js";
import { CalculateToolBody } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /tools — list all available financial tools
 */
router.get("/tools", async (_req, res): Promise<void> => {
  const tools = getAllTools().map((t) => ({
    name: t.name,
    description: t.description,
    category: t.category,
    parameters: t.parameters,
  }));
  res.json({ tools, total: tools.length });
});

/**
 * POST /tools/calculate — execute a financial calculation
 */
router.post("/tools/calculate", async (req, res): Promise<void> => {
  const parsed = CalculateToolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tool_name, parameters } = parsed.data;
  const tool = getTool(tool_name);

  if (!tool) {
    res.status(400).json({
      error: `Unknown tool: ${tool_name}. Available tools: ${getAllTools()
        .map((t) => t.name)
        .join(", ")}`,
    });
    return;
  }

  try {
    const result = await tool.execute(parameters as Record<string, unknown>);
    const formatted = tool.format(result);
    res.json({ tool_name, result, formatted_output: formatted });
  } catch (err) {
    req.log.error({ err, tool_name }, "Tool execution failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Tool execution failed",
    });
  }
});

export default router;
