#!/usr/bin/env node
// Fill the campaign_url column of data/candidates/{federal,state,local}.csv from the page
// lists in data/candidates/sites/*.csv: a candidate's campaign site is the page listed there
// with kind "campaign_home". Official government sites are never used as a campaign site.
// Only empty cells are filled; a campaign_url entered by hand is left alone.
// Usage: node scripts/fill-campaign-urls.mjs [dataDir]   (default: ./data)
// Then run `pnpm data` to rebuild data/candidates.csv and data/candidates.json.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { HEADER, parseCsv } from "./merge-candidates.mjs";

const dataDir = process.argv[2] ?? "data";
const sitesDir = join(dataDir, "candidates", "sites");
const quote = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// candidate_id -> the front page of their campaign site. A list may name a page inside the
// site (an "about" page) as the campaign home; the button should open the site itself.
const home = new Map();
for (const file of readdirSync(sitesDir).filter((f) => f.endsWith(".csv")).sort()) {
  const [header, ...rows] = parseCsv(readFileSync(join(sitesDir, file), "utf8"));
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  for (const r of rows) {
    const id = r[col.candidate_id];
    const url = r[col.url];
    if (r[col.kind] !== "campaign_home" || !/^https?:\/\//.test(url)) continue;
    const front = `${new URL(url).origin}/`;
    if (home.has(id) && home.get(id) !== front) console.log(`note ${id}: two campaign sites listed, keeping ${home.get(id)} over ${front}`);
    else home.set(id, front);
  }
}

let filled = 0, kept = 0, failed = false;
const used = new Set();
for (const part of ["federal", "state", "local"]) {
  const path = join(dataDir, "candidates", `${part}.csv`);
  const [header, ...rows] = parseCsv(readFileSync(path, "utf8"));
  if (header.join(",") !== HEADER.join(",")) { console.error(`BAD HEADER ${path}`); failed = true; continue; }
  const at = HEADER.indexOf("campaign_url");
  let changed = 0;
  for (const r of rows) {
    const url = home.get(r[0]);
    if (!url) continue;
    used.add(r[0]);
    if (r[at] && r[at] !== url) { kept++; console.log(`kept ${r[0]}: ${r[at]} (site list has ${url})`); continue; }
    if (r[at] === url) continue;
    r[at] = url; changed++; filled++;
  }
  if (changed) writeFileSync(path, [header, ...rows].map((r) => r.map(quote).join(",")).join("\n") + "\n", "utf8");
  console.log(`${part}: filled ${changed}`);
}

for (const id of home.keys()) if (!used.has(id)) { console.error(`NOT IN ROSTER: ${id} has a campaign_home but no roster row`); failed = true; }
if (failed) { console.error("fill FAILED"); process.exit(1); }
console.log(`filled ${filled} campaign_url cells from ${home.size} campaign home pages (${kept} hand-entered kept)`);
