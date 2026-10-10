#!/usr/bin/env node
// Convert data/candidates.csv into data/candidates.json, the file the app imports.
// Usage: node scripts/build-candidates-json.mjs [dataDir]   (default: ./data)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv, HEADER } from "./merge-candidates.mjs";

const dataDir = process.argv[2] ?? "data";
const [header, ...rows] = parseCsv(readFileSync(join(dataDir, "candidates.csv"), "utf8"));
if (header.join(",") !== HEADER.join(",")) {
  console.error("BAD HEADER in candidates.csv — run scripts/merge-candidates.mjs first");
  process.exit(1);
}

const BOOLS = new Set([
  "incumbent", "is_incumbent_of_this_seat_under_old_lines", "on_general_ballot",
  "covers_miami", "covers_miami_beach",
]);
const out = rows
  .map((r) => Object.fromEntries(header.map((k, i) => [k, BOOLS.has(k) ? r[i] === "true" : r[i]])))
  // The sourcing rule: only primary and secondary rows with a source link reach the app.
  .filter((c) => ["primary", "secondary"].includes(c.verification) && c.source_url);

const dest = join(dataDir, "candidates.json");
writeFileSync(dest, JSON.stringify(out, null, 1) + "\n", "utf8");
console.log(`wrote ${dest}: ${out.length} of ${rows.length} rows (unsourced or unverified rows dropped)`);
