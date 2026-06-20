---
name: PDF extraction model
description: Gemini model to use for vision-based PDF/image extraction in backend
---

## Rule
Use `gemini-2.0-flash` for Gemini vision extraction in `artifacts/api-server/src/routes/agents.ts`. Do NOT use `gemini-2.5-flash` — it may require a preview model ID suffix and behaves inconsistently.

## How to apply
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const result = await model.generateContent([
  { text: "..." },
  { inlineData: { mimeType, data: buffer.toString("base64") } },
]);
```
Array format for `generateContent` content parts works reliably.

**Why:** `gemini-2.5-flash` was unstable during development; `gemini-2.0-flash` is the stable production model that definitely supports inline PDF data.
