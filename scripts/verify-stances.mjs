#!/usr/bin/env node
// Check data/positions/stances.json against the scraped pages, then print a coverage table.
// Fails if any shown position has a quote that is not word-for-word in a passage from the
// same candidate and the same URL, or has no link.
// Usage: node scripts/verify-stances.mjs
import { readFileSync } from "node:fs";
import { normalise } from "./build-stances.mjs";

const { stances } = JSON.parse(readFileSync("data/positions/stances.json", "utf8"));
const { chunks } = JSON.parse(readFileSync("data/positions/chunks.json", "utf8"));
const { questions } = JSON.parse(readFileSync("data/questions.json", "utf8"));

let bad = 0;
for (const s of stances.filter((x) => x.stance !== "none")) {
  const found = chunks.some(
    (c) => c.candidate_id === s.candidate_id && c.url === s.url && normalise(c.text).includes(normalise(s.quote)),
  );
  if (!found || !/^https?:\/\//.test(s.url)) {
    bad++;
    console.log(`BAD  ${s.candidate_id} / ${s.question}: quote not found on ${s.url || "(no url)"}`);
  }
}

const ids = [...new Set(stances.map((s) => s.candidate_id))].sort();
const mark = { yes: "Y", no: "N", none: "." };
console.log(`\n${"candidate".padEnd(32)}${questions.map((q) => q.id.slice(0, 5).padEnd(6)).join("")}found`);
for (const id of ids) {
  const row = questions.map((q) => stances.find((s) => s.candidate_id === id && s.question === q.id)?.stance ?? "none");
  console.log(`${id.padEnd(32)}${row.map((r) => mark[r].padEnd(6)).join("")}${row.filter((r) => r !== "none").length}`);
}
console.log(
  `${"candidates with a position".padEnd(32)}${questions
    .map((q) => String(stances.filter((s) => s.question === q.id && s.stance !== "none").length).padEnd(6))
    .join("")}`,
);

if (bad) {
  console.error(`\nFAIL: ${bad} quotes missing from source`);
  process.exit(1);
}
console.log(`\nOK: 0 quotes missing from source (${stances.filter((s) => s.stance !== "none").length} positions shown, ${stances.length} readings)`);
