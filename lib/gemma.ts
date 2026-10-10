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

export async function askGemma(prompt: string, maxOutputTokens = 2048, temperature = 0.2): Promise<string> {
  let res = await callGemma(prompt, maxOutputTokens, temperature);
  // One retry when the service is busy or rate-limiting.
  if ([429, 500, 503].includes(res.status)) {
    await new Promise((r) => setTimeout(r, 2500));
    res = await callGemma(prompt, maxOutputTokens, temperature);
  }
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

function callGemma(prompt: string, maxOutputTokens: number, temperature: number) {
  return fetch(`${ENDPOINT}/${gemmaModel()}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens, temperature },
    }),
    signal: AbortSignal.timeout(50000),
    cache: "no-store",
  });
}

export async function askGemmaJson<T>(prompt: string): Promise<T> {
  const text = await askGemma(prompt);
  return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()) as T;
}
