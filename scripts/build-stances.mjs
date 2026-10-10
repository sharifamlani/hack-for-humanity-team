#!/usr/bin/env node
// For every candidate and every interview question: find the candidate's closest passages
// by cosine similarity, then have Gemma 4 read them and decide whether the candidate's own
// words answer the question yes, no, or not at all. Writes data/positions/stances.json.
//
// A stance is kept only if the quote Gemma gives is found word-for-word in the passage it
// came from. Anything else is recorded as "none" (no public position found).
// Usage: node --env-file=.env scripts/build-stances.mjs [--only candidate_id]
import { readFileSync, writeFileSync } from "node:fs";
import { cosine } from "./embed-positions.mjs";

const TOP_PASSAGES = 5;
const MIN_SIMILARITY = 0.55; // below this the passage is about something else
const CONCURRENCY = 4;
const OUT = "data/positions/stances.json";

// Compare text ignoring curly-versus-straight quotes, dashes and spacing.
export const normalise = (s) =>
  s.toLowerCase().replace(/[‘’`]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

async function gemma(prompt) {
  const model = process.env.GEMMA_MODEL;
  if (!model?.startsWith("gemma-")) throw new Error("GEMMA_MODEL must be set to a Gemma model");
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0 },
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      // Gemma 4 returns its reasoning as a separate part flagged thought:true — drop it.
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought)
        .map((p) => p.text)
        .join("");
      try {
        return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
      } catch {
        if (attempt >= 2) throw new Error("Gemma did not return JSON");
        continue;
      }
    }
    if (attempt >= 4 || ![429, 500, 503].includes(res.status)) throw new Error(`Gemma HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
  }
}

const prompt = (name, question, passages) => `You are checking what a political candidate has publicly said. Be strict and literal.

Candidate: ${name}
Question a voter is asked: "${question}"

Passages from the candidate's own website, press releases or questionnaire answers:
${passages.map((p, i) => `[${i + 1}] ${p.text}`).join("\n\n")}

Decide, using ONLY these passages, whether the candidate's own words show they would answer the question YES or NO.
- "yes" or "no" only if a passage clearly supports that answer. General values, biography, or a related but different topic are not enough.
- "none" if the passages do not clearly answer the question. When in doubt, answer "none".

Return ONLY a JSON object:
{"stance":"yes"|"no"|"none","passage":<number of the passage you relied on, or 0>,"quote":"<one sentence copied EXACTLY, character for character, from that passage, or empty>","why":"<one plain sentence: what the quote shows>"}`;

async function main() {
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
  const store = JSON.parse(readFileSync("data/positions/embeddings.json", "utf8"));
  const { questions } = JSON.parse(readFileSync("data/questions.json", "utf8"));
  const names = new Map(JSON.parse(readFileSync("data/candidates.json", "utf8")).map((c) => [c.candidate_id, c.name]));
  const qVector = new Map(store.questions.map((q) => [q.id, q.vector]));

  const candidates = [...new Set(store.chunks.map((c) => c.candidate_id))].filter((id) => !only || id === only).sort();
  const jobs = candidates.flatMap((candidate_id) => questions.map((q) => ({ candidate_id, q })));
  const stances = new Array(jobs.length);
  let next = 0;
  let rejected = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < jobs.length) {
        const i = next++;
        const { candidate_id, q } = jobs[i];
        const top = store.chunks
          .filter((c) => c.candidate_id === candidate_id)
          .map((c) => ({ ...c, similarity: cosine(qVector.get(q.id), c.vector) }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, TOP_PASSAGES)
          .filter((c) => c.similarity >= MIN_SIMILARITY);

        const row = { candidate_id, question: q.id, stance: "none", quote: "", url: "", why: "", similarity: top[0]?.similarity ?? 0 };
        if (top.length > 0) {
          try {
            const read = await gemma(prompt(names.get(candidate_id) ?? candidate_id, q.question, top));
            const passage = top[Number(read.passage) - 1];
            if ((read.stance === "yes" || read.stance === "no") && passage && read.quote) {
              // The guardrail: the quote must be in the passage word-for-word.
              if (read.quote.length >= 25 && normalise(passage.text).includes(normalise(read.quote))) {
                Object.assign(row, { stance: read.stance, quote: read.quote.trim(), url: passage.url, why: read.why ?? "", similarity: passage.similarity });
              } else {
                rejected++;
                row.rejected = "quote not found word-for-word in the passage";
              }
            }
          } catch (e) {
            row.error = e.message;
          }
        }
        row.similarity = Math.round(row.similarity * 1000) / 1000;
        stances[i] = row;
        console.log(`${row.stance.padEnd(4)} ${candidate_id.padEnd(30)} ${q.id.padEnd(12)} ${row.rejected ?? row.error ?? row.quote.slice(0, 70)}`);
      }
    }),
  );

  writeFileSync(
    OUT,
    JSON.stringify({ model: process.env.GEMMA_MODEL, embeddingModel: store.model, built: new Date().toISOString(), stances }, null, 1) + "\n",
    "utf8",
  );
  const found = stances.filter((s) => s.stance !== "none").length;
  console.log(`wrote ${OUT}: ${stances.length} readings, ${found} with a position, ${rejected} rejected by the quote check`);
}

if (process.argv[1]?.endsWith("build-stances.mjs")) {
  main().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  });
}
