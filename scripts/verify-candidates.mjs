#!/usr/bin/env node
// Assert data/candidates.csv is well-formed and every row is sourced.
// Usage: node scripts/verify-candidates.mjs [path]   (default: data/candidates.csv)
import { readFileSync } from "node:fs";
import { HEADER, parseCsv } from "./merge-candidates.mjs";

const path = process.argv[2] ?? "data/candidates.csv";
const [header, ...rows] = parseCsv(readFileSync(path, "utf8"));
const errors = [];

if (header.join(",") !== HEADER.join(",")) errors.push("header does not match the schema");
const col = Object.fromEntries(HEADER.map((h, i) => [h, i]));
const BOOLS = ["incumbent", "on_general_ballot", "covers_miami", "covers_miami_beach"];
const LEVELS = ["federal", "state", "county", "municipal", "school_board", "judicial", "ballot_measure"];
const ids = new Set();
let unknown = 0;

for (const r of rows) {
  const id = r[col.candidate_id] || "(no id)";
  if (ids.has(id)) errors.push(`${id}: duplicate candidate_id`);
  ids.add(id);
  if (!r[col.name]) errors.push(`${id}: empty name`);
  if (!LEVELS.includes(r[col.office_level])) errors.push(`${id}: bad office_level "${r[col.office_level]}"`);
  if (!/^https?:\/\//.test(r[col.source_url])) errors.push(`${id}: missing source_url`);
  if (!["primary", "secondary", "unverified"].includes(r[col.verification])) errors.push(`${id}: bad verification "${r[col.verification]}"`);
  // An empty cell means "not confirmed" (see data/_README.md); it is counted, not rejected.
  for (const b of BOOLS) {
    if (r[col[b]] === "") unknown++;
    else if (!["true", "false"].includes(r[col[b]])) errors.push(`${id}: ${b} is "${r[col[b]]}", want true/false or empty`);
  }
}

const count = (f) => rows.filter(f).length;
console.log(`rows: ${rows.length}`);
for (const l of LEVELS) console.log(`  ${l}: ${count((r) => r[col.office_level] === l)}`);
console.log(`on Nov 3 ballot: ${count((r) => r[col.on_general_ballot] === "true")}`);
console.log(`verification: primary ${count((r) => r[col.verification] === "primary")} · secondary ${count((r) => r[col.verification] === "secondary")} · unverified ${count((r) => r[col.verification] === "unverified")}`);

if (errors.length) {
  console.error(`\nFAILED: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 40)) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nOK: ${rows.length} rows, 0 unsourced`);
