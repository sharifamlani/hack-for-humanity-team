#!/usr/bin/env node
// Estimate a left-right position for candidates who have no voting record in Congress and
// no campaign-finance score, by having Gemma 4 read their own published words.
//
// The method is checked first on sitting members, for whom we hold both published words and
// a real DW-NOMINATE score: Gemma never sees their real score. Estimates are written only if
// every member lands on the correct side and the average miss is under MAX_AVERAGE_MISS.
// Writes data/positions/estimates.json (the estimates and the check that justified them).
// Usage: node --env-file=.env --experimental-strip-types scripts/estimate-scores.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { candidatePrompt, readEstimate } from "../lib/placement.ts";

const MIN_PASSAGES = 10; // fewer than this is too little text to read a position from
const MAX_CHARS = 7000;
const MAX_AVERAGE_MISS = 0.25;
const MAX_RANGE = 0.6; // a wider range than this means the text does not pin the person down
// The check is run on members of Congress, so the method is used only for candidates for
// Congress. Two state-legislature estimates put Republican nominees left of centre and could
// not be verified, so state and local candidates are left to the yes/no index.
const IN_SCOPE = /^us-(house|senate)-/;
const CONCURRENCY = 4;
const OUT = "data/positions/estimates.json";
const BOILERPLATE = /donate|chip in|paid for by|sign up|subscribe|privacy policy|contribute/i;

const { chunks } = JSON.parse(readFileSync("data/positions/chunks.json", "utf8"));
const records = JSON.parse(readFileSync("data/positions/records.json", "utf8"));
const real = new Map(records.scores.map((s) => [s.candidate_id, s.nominate_dim1]));
const hasDonorScore = new Set(records.cfscores.map((c) => c.candidate_id));

const passagesOf = (id) => chunks.filter((c) => c.candidate_id === id && !BOILERPLATE.test(c.text));

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
      return (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text).join("");
    }
    if (attempt >= 3) throw new Error(`Gemma HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
  }
}

async function estimate(id) {
  let text = "";
  let used = 0;
  for (const p of passagesOf(id)) {
    if (text.length + p.text.length > MAX_CHARS) break;
    text += `\n- ${p.text}`;
    used++;
  }
  const e = readEstimate(await gemma(candidatePrompt(text)));
  return { candidate_id: id, x: e.x, low: e.low, high: e.high, why: e.why, passages: used };
}

async function pool(ids) {
  const out = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < ids.length) {
        const id = ids[next++];
        try {
          out.push(await estimate(id));
        } catch (e) {
          console.log(`  FAILED ${id}: ${e.message}`);
        }
      }
    }),
  );
  return out.sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
}

const withText = [...new Set(chunks.map((c) => c.candidate_id))].filter((id) => passagesOf(id).length >= MIN_PASSAGES);
const checkIds = withText.filter((id) => real.has(id));
const targetIds = withText.filter((id) => !real.has(id) && !hasDonorScore.has(id) && IN_SCOPE.test(id));

console.log(`check on ${checkIds.length} sitting members, then estimate ${targetIds.length} candidates`);
const checked = (await pool(checkIds)).map((e) => ({
  ...e,
  real: real.get(e.candidate_id),
  miss: Math.round(Math.abs(e.x - real.get(e.candidate_id)) * 100) / 100,
}));
for (const c of checked) {
  console.log(`  ${c.candidate_id.padEnd(30)} gemma ${c.x.toFixed(2).padStart(5)}  real ${c.real.toFixed(2).padStart(5)}  miss ${c.miss.toFixed(2)}`);
}
const correctSide = checked.filter((c) => Math.sign(c.x) === Math.sign(c.real)).length;
const averageMiss = Math.round((checked.reduce((s, c) => s + c.miss, 0) / checked.length) * 100) / 100;
console.log(`CHECK: correct side ${correctSide} of ${checked.length} · average miss ${averageMiss.toFixed(2)}`);
if (checked.length < 3 || correctSide < checked.length || averageMiss >= MAX_AVERAGE_MISS) {
  console.error("FAIL: the check did not pass — no estimates written");
  process.exit(1);
}

const all = await pool(targetIds);
const estimates = all.filter((e) => e.high - e.low <= MAX_RANGE);
for (const e of all.filter((e) => e.high - e.low > MAX_RANGE)) {
  console.log(`  not placed (range too wide): ${e.candidate_id} [${e.low.toFixed(2)}, ${e.high.toFixed(2)}]`);
}
for (const e of estimates) {
  console.log(`  ${e.candidate_id.padEnd(30)} ${e.x.toFixed(2).padStart(5)} [${e.low.toFixed(2)}, ${e.high.toFixed(2)}]  ${e.why.slice(0, 90)}`);
}
writeFileSync(
  OUT,
  JSON.stringify(
    {
      note: "Left-right positions estimated by Gemma 4 from candidates' own published words, for candidates with no voting record in Congress and no campaign-finance score. An estimate, not a measurement.",
      model: process.env.GEMMA_MODEL,
      built: new Date().toISOString(),
      check: { members: checked.map(({ candidate_id, x, real, miss }) => ({ candidate_id, x, real, miss })), correctSide, of: checked.length, averageMiss },
      estimates,
    },
    null,
    1,
  ) + "\n",
  "utf8",
);
console.log(`wrote ${OUT}: ${estimates.length} estimates`);
