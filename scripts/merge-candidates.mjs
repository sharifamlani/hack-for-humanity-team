#!/usr/bin/env node
// Merge data/candidates/{federal,state,local}.csv into data/candidates.csv.
// Usage: node scripts/merge-candidates.mjs [dataDir]   (default: ./data)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const HEADER = [
  "candidate_id", "name", "party", "office_level", "office", "district", "jurisdiction",
  "incumbent", "is_incumbent_of_this_seat_under_old_lines", "on_general_ballot",
  "election_date", "covers_miami", "covers_miami_beach", "campaign_url", "bioguide_id",
  "source_url", "source_name", "retrieved_date", "verification", "notes",
];

// Minimal RFC-4180 parser: handles quoted fields, escaped quotes and newlines inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

const quote = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function main() {
  const dataDir = process.argv[2] ?? "data";
  const parts = ["federal", "state", "local"];
  const out = [HEADER];
  const seen = new Set();
  let failed = false;

  for (const part of parts) {
    const path = join(dataDir, "candidates", `${part}.csv`);
    if (!existsSync(path)) { console.error(`MISSING ${path}`); failed = true; continue; }
    const [header, ...rows] = parseCsv(readFileSync(path, "utf8"));
    if (header.join(",") !== HEADER.join(",")) {
      console.error(`BAD HEADER ${path}\n  got:      ${header.join(",")}\n  expected: ${HEADER.join(",")}`);
      failed = true; continue;
    }
    let kept = 0;
    for (const r of rows) {
      if (r.length !== HEADER.length) {
        console.error(`BAD ROW ${path}: ${r.length} fields (want ${HEADER.length}): ${r[0]}`);
        failed = true; continue;
      }
      if (seen.has(r[0])) { console.error(`DUPLICATE id ${r[0]} in ${path}`); failed = true; continue; }
      seen.add(r[0]); out.push(r); kept++;
    }
    console.log(`${part}: ${kept} rows`);
  }

  if (failed) { console.error("merge FAILED — nothing written"); process.exit(1); }
  const dest = join(dataDir, "candidates.csv");
  writeFileSync(dest, out.map((r) => r.map(quote).join(",")).join("\n") + "\n", "utf8");
  console.log(`wrote ${dest}: ${out.length - 1} rows`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("merge-candidates.mjs")) main();
