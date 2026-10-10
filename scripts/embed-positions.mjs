#!/usr/bin/env node
// Turn every scraped passage and every interview question into a vector, so the closest
// passages to a question can be found by cosine similarity.
// The embedding model only FINDS passages; Gemma 4 does the reading (build-stances.mjs).
// Usage: node --env-file=.env scripts/embed-positions.mjs [--check]
//   --check  after embedding, print the top passages for each question (a relevance eyeball)
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export const EMBED_MODEL = "gemini-embedding-2";
const DIMS = 256;
const CONCURRENCY = 6;
const OUT = "data/positions/embeddings.json";

export async function embed(text) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: DIMS }),
      },
    );
    if (res.ok) {
      const values = (await res.json()).embedding.values;
      // Unit length, so cosine similarity is just a dot product.
      const norm = Math.hypot(...values);
      return values.map((v) => Math.round((v / norm) * 1e5) / 1e5);
    }
    if (attempt >= 4 || ![429, 500, 503].includes(res.status)) {
      throw new Error(`embedding HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
}

export const cosine = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);

async function mapPool(list, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i], i);
        if ((i + 1) % 100 === 0) console.log(`  embedded ${i + 1} of ${list.length}`);
      }
    }),
  );
  return out;
}

async function main() {
  const { chunks } = JSON.parse(readFileSync("data/positions/chunks.json", "utf8"));
  const { questions } = JSON.parse(readFileSync("data/questions.json", "utf8"));

  // Reuse vectors for passages whose text has not changed.
  const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { chunks: [] };
  const known = new Map(old.chunks.map((c) => [c.text, c.vector]));

  const chunkVectors = await mapPool(chunks, async (c) => known.get(c.text) ?? (await embed(c.text)));
  const questionVectors = await mapPool(questions, (q) => embed(`${q.question} ${q.search}`));

  writeFileSync(
    OUT,
    JSON.stringify({
      model: EMBED_MODEL,
      dims: DIMS,
      chunks: chunks.map((c, i) => ({ ...c, vector: chunkVectors[i] })),
      questions: questions.map((q, i) => ({ id: q.id, vector: questionVectors[i] })),
    }) + "\n",
    "utf8",
  );
  console.log(`wrote ${OUT}: ${chunks.length} passages, ${questions.length} questions, ${DIMS} dims`);

  if (process.argv.includes("--check")) {
    for (const [qi, q] of questions.entries()) {
      const top = chunks
        .map((c, i) => ({ c, sim: cosine(questionVectors[qi], chunkVectors[i]) }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 3);
      console.log(`\n[${q.id}] ${q.question}`);
      for (const t of top) console.log(`  ${t.sim.toFixed(3)} ${t.c.candidate_id}: ${t.c.text.slice(0, 150)}`);
    }
  }
}

if (process.argv[1]?.endsWith("embed-positions.mjs")) {
  main().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  });
}
