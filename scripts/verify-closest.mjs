// Flags "closest thing they've said" passages whose words may not be the candidate's own
// (a quote of someone else, news attribution) and checks that each flag has a recorded review
// in data/positions/closest-review.json. Exits 1 if any flagged passage is neither excluded
// nor allowed, or if a review entry no longer matches any passage.
// Usage: node scripts/verify-closest.mjs [--quiet]
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
const quiet = process.argv.includes("--quiet");

const closest = read("data/positions/closest.json").closest;
const candidates = read("data/candidates.json");
const reviewPath = "data/positions/closest-review.json";
const review = existsSync(path.join(root, reviewPath)) ? read(reviewPath) : { excluded: [], allowed: [] };
const key = (c, q) => `${c}|${q}`;
const excluded = new Map(review.excluded.map((r) => [key(r.candidate_id, r.question), r]));
const allowed = new Map(review.allowed.map((r) => [key(r.candidate_id, r.question), r]));

const TITLE = String.raw`(?:Congressman|Congresswoman|Congressmen|Rep\.|Representative|Senator|Sen\.|Governor|Gov\.|Lt\. Gov\.|Director|Mayor|Commissioner|Secretary|President|Chairman|Chairwoman|Chair|Attorney General|Sheriff|Judge|Dr\.|Chief|Superintendent|Speaker)`;
const NAME = String.raw`(?:[A-Z][\w'’.-]+\s+){0,3}[A-Z][\w'’-]+`;
const SAID = String.raw`(?:said|says|stated|noted|explained|added)`;
const PATTERNS = [
  [new RegExp(String.raw`${TITLE}\s+${NAME}\s+(?:${SAID}|told|wrote|argued)`), "title+name said"],
  [new RegExp(String.raw`\b${SAID}\s+${TITLE}\b`), "said + title"],
  [new RegExp(String.raw`[”"]\s*,?\s*${SAID}\s+[A-Z]`), "quote followed by 'said X'"],
  [/\baccording to\b/i, "according to"],
  [/\b(?:he|she|they) (?:said|told|stated|noted)\b/i, "he/she said"],
  [new RegExp(String.raw`\b[A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+){0,3}\s+(?:${SAID}|told reporters|told the)\b`), "Name said"],
  [/[“"][^”"]{25,}[”"]/, "contains a long quotation"],
  [/\bsaid\s+(?:in a statement|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i, "news 'said <day>'"],
];

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const byId = new Map(candidates.map((c) => [c.candidate_id, c]));
const lastName = (n) => n.replace(/\s+(?:Jr\.?|Sr\.?|III|II|IV)$/i, "").split(/\s+/).pop();

function flagsFor(item) {
  const reasons = [];
  const self = byId.get(item.candidate_id);
  for (const [re, label] of PATTERNS) {
    const m = item.text.match(re);
    if (m) reasons.push(`${label}: "${m[0].slice(0, 70)}"`);
  }
  for (const c of candidates) {
    // Ballot measures sit in the roster too; their titles are not people.
    if (c.candidate_id === item.candidate_id || !c.name || /Referendum|Amendment|Charter/i.test(c.name)) continue;
    const last = lastName(c.name);
    if (new RegExp(String.raw`\b${escapeRe(c.name)}\b`).test(item.text)) reasons.push(`names other candidate: ${c.name}`);
    else if (last.length >= 5 && (!self || lastName(self.name) !== last) && new RegExp(String.raw`\b${escapeRe(last)}\b`).test(item.text))
      reasons.push(`mentions surname: ${last}`);
  }
  return [...new Set(reasons)];
}

let flagged = 0, nExcluded = 0, nAllowed = 0, unreviewed = 0, stale = 0;
for (const item of closest) {
  const reasons = flagsFor(item);
  if (!reasons.length) continue;
  flagged++;
  const k = key(item.candidate_id, item.question);
  const status = excluded.has(k) ? "EXCLUDED" : allowed.has(k) ? "ALLOWED" : "UNREVIEWED";
  if (status === "EXCLUDED") nExcluded++;
  else if (status === "ALLOWED") nAllowed++;
  else unreviewed++;
  if (!quiet)
    console.log(`[${status}] ${item.candidate_id} / ${item.question}\n    ${reasons.join("; ")}\n    ${item.text.slice(0, 160).replace(/\s+/g, " ")}`);
}
// An exclusion may cover a passage the patterns missed (e.g. found by reading), so only
// flag review entries whose candidate/question no longer exists in closest.json.
for (const k of [...excluded.keys(), ...allowed.keys()])
  if (!closest.some((c) => key(c.candidate_id, c.question) === k)) {
    stale++;
    console.log(`STALE review entry: ${k}`);
  }

console.log(
  `verify-closest: ${closest.length} passages, ${flagged} flagged, ${nExcluded} excluded, ${nAllowed} allowed, ${unreviewed} unreviewed, ${stale} stale`,
);
process.exit(unreviewed || stale ? 1 : 0);
