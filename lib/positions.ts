// Backend search over what candidates have published (data/positions/embeddings.json,
// built by scripts/scrape-positions.mjs + scripts/embed-positions.mjs).
//
// Given what a voter said in their own words, find each candidate's closest passages by
// cosine similarity. This only FINDS passages; Gemma 4 does the reading (/api/ask).
// Server-side only. No local imports, so scripts/smoke-ask.mjs can run it directly.
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Must match scripts/embed-positions.mjs, or the vectors are not comparable.
export const EMBED_MODEL = "gemini-embedding-2";
const DIMS = 256;

// Measured with this model on spoken-style sentences: unrelated text scores 0.54-0.62,
// a loose match about 0.66, a direct match 0.79-0.82. The floor removes the clearly
// unrelated; Gemma 4 still decides whether what is left really speaks to the voter.
export const MIN_SIMILARITY = 0.65;

const MAX_SEGMENTS = 8;
const SEGMENT_CHARS = 90;

export type Passage = {
  id: number;
  candidate_id: string;
  url: string;
  kind: string;
  title: string;
  text: string;
  vector: number[];
};

export type Hit = { passage: Passage; similarity: number; matchedOn: string };

let cache: { file: string; mtime: number; passages: Passage[] } | null = null;

// Returns null when the positions data has not been built yet.
export function loadPassages(): Passage[] | null {
  const file =
    process.env.POSITIONS_FILE ?? path.join(process.cwd(), "data", "positions", "embeddings.json");
  if (!existsSync(file)) return null;
  const mtime = statSync(file).mtimeMs;
  if (cache?.file === file && cache.mtime === mtime) return cache.passages;
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (data.model !== EMBED_MODEL || data.dims !== DIMS) {
    throw new Error(`embeddings.json was built with ${data.model}/${data.dims}, expected ${EMBED_MODEL}/${DIMS}`);
  }
  cache = { file, mtime, passages: data.chunks };
  return cache.passages;
}

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: DIMS }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`embedding HTTP ${res.status}`);
  const values: number[] = (await res.json()).embedding.values;
  // Unit length, so cosine similarity is just a dot product.
  const norm = Math.hypot(...values);
  return values.map((v) => v / norm);
}

export const cosine = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

// A voter may raise several topics in one breath ("rent is crazy, and my street floods").
// One vector for the whole transcript blurs them together, so the transcript is also cut
// into sentence-sized segments and each is searched on its own.
export function segments(transcript: string): string[] {
  const whole = transcript.replace(/\s+/g, " ").trim().slice(0, 2000);
  if (!whole) return [];
  const out: string[] = [];
  let current = "";
  for (const sentence of whole.match(/[^.!?]+[.!?]*\s*/g) ?? [whole]) {
    current += sentence;
    if (current.length >= SEGMENT_CHARS) {
      out.push(current.trim());
      current = "";
    }
  }
  // A short tail (a few words) carries no topic of its own; fold it into the previous one.
  if (current.trim().length >= 40 || out.length === 0) out.push(current.trim());
  else out[out.length - 1] += ` ${current.trim()}`;
  const parts = out.slice(0, MAX_SEGMENTS);
  return parts.length > 1 ? [whole, ...parts] : [whole];
}

// For one candidate: their passages ranked by the best similarity to any segment of what
// the voter said. Passages under the floor are dropped, so an empty list means "this
// candidate has published nothing close to what you talked about".
export function closestPassages(
  passages: Passage[],
  candidateId: string,
  queries: { text: string; vector: number[] }[],
  limit = 4,
): Hit[] {
  return passages
    .filter((p) => p.candidate_id === candidateId)
    .map((passage) => {
      let best = { similarity: -1, matchedOn: "" };
      for (const q of queries) {
        const similarity = cosine(q.vector, passage.vector);
        if (similarity > best.similarity) best = { similarity, matchedOn: q.text };
      }
      return { passage, ...best };
    })
    .filter((h) => h.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Compare text ignoring curly-versus-straight quotes, dashes and spacing.
export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

// A quote may be shown only if it appears word-for-word in the passage it is credited to.
export const isExactQuote = (quote: string, passageText: string) =>
  quote.trim().length >= 20 && normalise(passageText).includes(normalise(quote));
