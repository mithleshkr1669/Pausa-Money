import { Router } from "express";

const router = Router();

const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

interface ChatMessage { role: "user" | "assistant"; content: string; }

async function callGemini(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  // Convert to Gemini format
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function callAnthropic(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  const body = {
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Anthropic returned empty response");
  return text;
}

router.post("/ai/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body as {
    messages?: ChatMessage[];
    systemPrompt?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const sys = systemPrompt ?? "You are a helpful financial assistant.";

  // Try Gemini first, then Anthropic
  if (GEMINI_KEY) {
    try {
      const text = await callGemini(messages, sys);
      res.json({ message: text, provider: "gemini" });
      return;
    } catch (e) {
      req.log.warn({ err: String(e) }, "Gemini failed, trying Anthropic");
    }
  }

  if (ANTHROPIC_KEY) {
    try {
      const text = await callAnthropic(messages, sys);
      res.json({ message: text, provider: "anthropic" });
      return;
    } catch (e) {
      req.log.error({ err: String(e) }, "Anthropic also failed");
    }
  }

  // No keys configured
  if (!GEMINI_KEY && !ANTHROPIC_KEY) {
    res.status(503).json({
      error: "No AI API keys configured. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to the API server environment.",
    });
    return;
  }

  res.status(503).json({ error: "AI service temporarily unavailable. Please try again." });
});

export default router;
