// The one place the product talks to its model. Reads GEMMA_MODEL only — never a
// GOOGLE_* variable — so the model inside the product is always open-weight Gemma 4.
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function gemmaModel() {
  const model = process.env.GEMMA_MODEL;
  if (!model || !model.startsWith("gemma-")) {
    throw new Error("GEMMA_MODEL must be set to a Gemma model");
  }
  return model;
}

export async function askGemma(prompt: string, maxOutputTokens = 2048): Promise<string> {
  const res = await fetch(`${ENDPOINT}/${gemmaModel()}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Gemma HTTP ${res.status}`);
  const data = await res.json();
  // Gemma 4 returns its reasoning as a separate part flagged thought:true. Drop it,
  // or the model's internal monologue ends up on screen.
  const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemma returned no answer");
  return text;
}

export async function askGemmaJson<T>(prompt: string): Promise<T> {
  const text = await askGemma(prompt);
  return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()) as T;
}
