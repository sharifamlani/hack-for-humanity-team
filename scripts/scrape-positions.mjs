#!/usr/bin/env node
// Download every page listed in data/candidates/sites/*.csv and save the exact visible
// text as passages in data/positions/chunks.json. Text is kept word-for-word so that any
// quote shown in the app can be checked against the page it came from.
// Usage: node scripts/scrape-positions.mjs [sitesDir] [outFile]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { parseCsv } from "./merge-candidates.mjs";

const sitesDir = process.argv[2] ?? "data/candidates/sites";
const outFile = process.argv[3] ?? "data/positions/chunks.json";
const MAX_CHARS = 700; // passage size: a few sentences, small enough to quote from
const MIN_CHARS = 120; // shorter than this is navigation or a caption, not a position
const MAX_PASSAGES_PER_PAGE = 60;
const USER_AGENTS = [
  "Mozilla/5.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
];

const ENTITIES = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…" };

function visibleText(html) {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Block-level tags become paragraph breaks so passages follow the page's own structure.
    .replace(/<\/?(p|div|li|h[1-6]|br|section|article|tr|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// Group consecutive paragraphs into passages of up to MAX_CHARS.
function passages(text) {
  const out = [];
  let current = "";
  for (const para of text.split("\n")) {
    const p = para.trim();
    if (p.length < 40) continue; // menu items, buttons, dates
    if (current && current.length + p.length + 1 > MAX_CHARS) {
      out.push(current);
      current = "";
    }
    // A single very long paragraph is split on sentence ends.
    if (p.length > MAX_CHARS) {
      for (const sentence of p.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) ?? [p]) {
        if (current && current.length + sentence.length > MAX_CHARS) {
          out.push(current.trim());
          current = "";
        }
        current += sentence;
      }
    } else {
      current = current ? `${current} ${p}` : p;
    }
  }
  if (current) out.push(current.trim());
  return out.filter((c) => c.length >= MIN_CHARS).slice(0, MAX_PASSAGES_PER_PAGE);
}

async function main() {
  const rows = [];
  for (const file of readdirSync(sitesDir).filter((f) => f.endsWith(".csv")).sort()) {
    const [header, ...body] = parseCsv(readFileSync(join(sitesDir, file), "utf8"));
    for (const r of body) rows.push(Object.fromEntries(header.map((k, i) => [k, r[i] ?? ""])));
  }
  // Only pages that are the candidate's own words. News articles and forum write-ups quote
  // several people, so a sentence could be pinned on the wrong candidate.
  const OWN_WORDS = /^(campaign_|official_|press_release|speech|questionnaire)/;
  // PDFs are skipped: this script reads HTML only.
  const pages = rows.filter(
    (r) => /^https?:\/\//.test(r.url) && OWN_WORDS.test(r.kind) && !/\.pdf($|\?)/i.test(r.url),
  );
  console.log(`${pages.length} pages listed for ${new Set(pages.map((p) => p.candidate_id)).size} candidates`);

  const chunks = [];
  const seenText = new Set();
  const perCandidate = {};
  let failed = 0;
  for (const page of pages) {
    try {
      // curl, not fetch: some campaign sites refuse Node's built-in client outright.
      // Sites disagree about which browser identity they accept, so try both.
      let html = "";
      for (const agent of USER_AGENTS) {
        try {
          html = execFileSync("curl", ["-sL", "--fail", "--max-time", "25", "-A", agent, page.url], {
            encoding: "utf8",
            maxBuffer: 30 * 1024 * 1024,
            stdio: ["ignore", "pipe", "ignore"],
          });
          if (html) break;
        } catch {}
      }
      if (!html) throw new Error("no response");
      const title = visibleText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 150);
      let kept = 0;
      for (const text of passages(visibleText(html))) {
        // Menus and boilerplate repeat across a site's pages; keep each passage once per candidate.
        const key = `${page.candidate_id}|${text}`;
        if (seenText.has(key)) continue;
        seenText.add(key);
        chunks.push({ id: chunks.length, candidate_id: page.candidate_id, url: page.url, kind: page.kind, title, text });
        kept++;
      }
      perCandidate[page.candidate_id] = (perCandidate[page.candidate_id] ?? 0) + kept;
      console.log(`${String(kept).padStart(3)} passages  ${page.candidate_id.padEnd(30)} ${page.url.slice(0, 80)}`);
    } catch (e) {
      failed++;
      console.log(`  FAILED (${e.message})  ${page.candidate_id}  ${page.url.slice(0, 80)}`);
    }
  }

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify({ retrieved: new Date().toISOString(), chunks }, null, 1) + "\n", "utf8");
  console.log("\nPassages per candidate:");
  for (const id of [...new Set(rows.map((r) => r.candidate_id))].sort()) {
    console.log(`  ${String(perCandidate[id] ?? 0).padStart(4)}  ${id}`);
  }
  console.log(`wrote ${outFile}: ${chunks.length} passages from ${Object.keys(perCandidate).filter((k) => perCandidate[k]).length} candidates (${failed} pages failed)`);
  if (chunks.length === 0) process.exit(1);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
