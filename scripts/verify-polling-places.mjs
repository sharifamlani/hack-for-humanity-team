#!/usr/bin/env node
// Checks every precinct's polling place, as the app will show it (county PollingPlace_gdb layer
// plus data/polling-overrides.json), against the Supervisor of Elections' official
// "Precinct / Polling Place List" PDF. Also checks the temporary-site list and the precinct set.
// Needs pdftotext (poppler) on PATH.
// Usage: node scripts/verify-polling-places.mjs [--pdf path/to/list.pdf]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url);
const fixes = JSON.parse(readFileSync(new URL("data/polling-overrides.json", ROOT), "utf8"));
const LAYER =
  "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/PollingPlace_gdb/FeatureServer/0/query" +
  "?where=1%3D1&outFields=PRECINCT,NAME,ADDRESS,CITY,ZIPCODE&returnGeometry=false&resultRecordCount=2000&f=json";

// 1. The official PDF, as text. -raw keeps each row's name next to its precinct (-layout does not).
const i = process.argv.indexOf("--pdf");
let pdf = i > -1 ? process.argv[i + 1] : null;
if (!pdf) {
  const res = await fetch(fixes.source, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`official list HTTP ${res.status}: ${fixes.source}`);
  pdf = join(tmpdir(), "polling-place-list.pdf");
  writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
}
const text = execFileSync("pdftotext", ["-raw", pdf, "-"], { encoding: "utf8" }).replace(/\r/g, "");
const listDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/m);
console.log(`Official list: ${fixes.source}`);
console.log(`  printed ${listDate?.[0] ?? "?"} (overrides were taken from the ${fixes.listDate} list)`);

// 2. Rows. A long name wraps onto the next line, so lines are joined until the next precinct.
const HEADER = /^(Miami-Dade County, FL|\d{2}\/\d{2}\/\d{4}|Date :|Time :.*|Supervisor of Elections|Precinct \/ Polling Place List|BY SELECTED ELECTION|Alina Garcia|ELECTION:.*|Prec\/PP .*|VR6_PP_Prec_Elec|Page \d+ of \d+|Total Number of .*|\d+ \d+ \d+)$/;
const official = new Map(); // precinct -> [{ sub, temporary, text }]
let row = null;
for (const line of text.split("\n").map((l) => l.trim())) {
  const m = line.match(/^(\d{3})\.(\d) (T )?(.*)$/);
  if (m) {
    row = { sub: m[2], temporary: !!m[3], text: m[4] };
    const id = Number(m[1]);
    official.set(id, [...(official.get(id) ?? []), row]);
  } else if (line && !HEADER.test(line) && row) row.text += ` ${line}`;
  else if (HEADER.test(line)) row = null;
}
const rows = [...official.values()].flat().length;
console.log(`  ${rows} rows, ${official.size} precincts`);

// 3. What the app shows: the layer, with the overrides applied.
const { features } = await (await fetch(LAYER, { signal: AbortSignal.timeout(30000) })).json();
const app = new Map(
  features.map(({ attributes: a }) => {
    const fix = fixes.overrides[String(a.PRECINCT)] ?? {};
    const layer = { name: String(a.NAME).trim(), address: String(a.ADDRESS).trim() };
    return [a.PRECINCT, { layer, name: fix.name ?? layer.name, address: fix.address ?? layer.address }];
  }),
);
console.log(`County layer: ${app.size} precincts\n`);

const norm = (s) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
const has = (row, place) => norm(row.text).includes(norm(place.name)) && norm(row.text).includes(norm(place.address));
const problems = [];

for (const id of official.keys()) if (!app.has(id)) problems.push(`precinct ${id} is on the official list but not in the layer`);
for (const id of app.keys()) if (!official.has(id)) problems.push(`precinct ${id} is in the layer but not on the official list`);

let matched = 0;
for (const [id, place] of app) {
  const rowsHere = official.get(id);
  if (!rowsHere) continue;
  const bad = rowsHere.filter((r) => !has(r, place));
  if (bad.length) problems.push(`precinct ${id}: app shows "${place.name}, ${place.address}"; official says "${bad[0].text}"`);
  else matched++;
  const fix = fixes.overrides[String(id)];
  if (fix && rowsHere.every((r) => has(r, place.layer)))
    console.log(`  note: precinct ${id}'s override is no longer needed; the county layer now matches the official list`);
}

const officialTemp = [...official].filter(([, r]) => r.some((x) => x.temporary)).map(([id]) => id).sort((a, b) => a - b);
const ourTemp = [...fixes.temporary].sort((a, b) => a - b);
if (officialTemp.join() !== ourTemp.join())
  problems.push(`temporary sites: official [${officialTemp}] vs data/polling-overrides.json [${ourTemp}]`);

console.log(`${matched}/${app.size} precincts match the official polling place`);
console.log(`${officialTemp.length} temporary sites match: ${problems.some((p) => p.startsWith("temporary")) ? "NO" : "yes"}`);
problems.forEach((p) => console.log(`  ✗ ${p}`));
process.exit(problems.length ? 1 : 0);
