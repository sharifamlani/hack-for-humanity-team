#!/usr/bin/env node
// Assert every campaign_url in data/candidates.json is a web address that answers.
// A site that refuses scripts (401/403/429) is reported for a check by hand, not failed;
// a dead address (network error, 404, 5xx) fails the run.
// Usage: node scripts/verify-campaign-urls.mjs [path]   (default: data/candidates.json)
import { readFileSync } from "node:fs";

const path = process.argv[2] ?? "data/candidates.json";
const candidates = JSON.parse(readFileSync(path, "utf8"));
const withSite = candidates.filter((c) => c.campaign_url);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function status(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return res.status;
  } catch (e) {
    return `error: ${e.cause?.code ?? e.name}`;
  }
}

const results = await Promise.all(withSite.map(async (c) => ({ c, s: await status(c.campaign_url) })));
let dead = 0, blocked = 0;
for (const { c, s } of results) {
  const ok = s === 200;
  const refused = [401, 403, 429].includes(s);
  if (refused) blocked++;
  else if (!ok) dead++;
  console.log(`${ok ? "ok     " : refused ? "CHECK  " : "DEAD   "} ${String(s).padEnd(14)} ${c.candidate_id.padEnd(34)} ${c.campaign_url}`);
}

const people = candidates.filter((c) => c.office_level !== "ballot_measure");
console.log(`\ncampaign sites: ${withSite.length} of ${people.length} people on the roster · ${dead} dead · ${blocked} refused a script`);
if (dead) { console.error("verify FAILED"); process.exit(1); }
console.log("OK");
