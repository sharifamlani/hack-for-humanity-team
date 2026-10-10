// Prompts for placing a person on the left-right line from what they have said or written.
// One scale and one set of reference points for voters and candidates, so their dots are
// comparable. Gemma 4 does the reading; nothing here picks a candidate.
// No local imports, so scripts can run it directly.

export type Estimate = { x: number; low: number; high: number; why: string };

const SCALE = `the first-dimension DW-NOMINATE scale used for the U.S. Congress, which runs from -1 (most liberal) to +1 (most conservative). Reference points in the current U.S. House: the typical Democrat is about -0.39; a moderate Democrat about -0.20; a moderate Republican about +0.25; the typical Republican about +0.53; the most conservative members are above +0.75.`;

export const voterPrompt = (interview: string) => `You are a political scientist. Below is a short interview with a voter in Miami.

Estimate where this person would sit on ${SCALE} Ordinary voters are usually less extreme than members of Congress.

Base the estimate only on the positions they take, not on tone or vocabulary. Short answers carry less information: with little to go on, stay nearer the middle and report a wide range.

Return ONLY JSON: {"score": <two decimals>, "low": <two decimals>, "high": <two decimals>, "why": "<one plain sentence, addressed to the voter as 'you', naming the answers that drove it; no party names>"}

Interview:
${interview}`;

export const candidatePrompt = (passages: string) => `You are a political scientist. Below are passages from one U.S. candidate's own website and statements.

Estimate where this person would sit on ${SCALE}

Base the estimate only on the policy positions in the passages, not on tone. If the passages contain almost no policy content, report a wide range.

Return ONLY JSON: {"score": <two decimals>, "low": <two decimals>, "high": <two decimals>, "why": "<one sentence naming the positions that drove it>"}

Passages:
${passages}`;

// Accept the model's answer only if it is a sane point with a range around it.
export function readEstimate(raw: string): Estimate {
  const o = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  const clamp = (v: unknown) => Math.max(-1, Math.min(1, Number(v)));
  const x = clamp(o.score);
  if (!Number.isFinite(x)) throw new Error("no score in the model's answer");
  const low = Number.isFinite(Number(o.low)) ? Math.min(clamp(o.low), x) : Math.max(-1, x - 0.2);
  const high = Number.isFinite(Number(o.high)) ? Math.max(clamp(o.high), x) : Math.min(1, x + 0.2);
  return { x, low, high, why: String(o.why ?? "").slice(0, 300) };
}
