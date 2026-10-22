#!/usr/bin/env node
// Checks a downloaded take-to-the-polls PDF: exactly one page, the plan and the race list are
// there, the wording is "closest match" and never "vote for". Needs pdftotext (xpdf/poppler).
// Usage: node scripts/verify-voting-plan-pdf.mjs <file.pdf> [required text ...]
// With no extra arguments it checks the venue address (2750 NW 3rd Ave).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [file, ...extra] = process.argv.slice(2);
if (!file) {
  console.error("usage: node scripts/verify-voting-plan-pdf.mjs <file.pdf> [required text ...]");
  process.exit(2);
}
const raw = readFileSync(file).toString("latin1");
const pages = (raw.match(/\/Type\s*\/Page\b(?!s)/g) || []).length;
const text = execFileSync("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], { encoding: "utf8" });
const flat = text.replace(/\s+/g, " ");

const required = extra.length
  ? extra
  : ["Take this to the polls", "Dunbar", "FL-24", "U.S. House", "Gilbert", "YOUR CLOSEST MATCH", "EVIDENCE", "Election Day"];
const forbidden = [/vote for/i];

const problems = [];
if (pages !== 1) problems.push(`expected 1 page, found ${pages}`);
for (const r of required) if (!flat.includes(r)) problems.push(`missing: "${r}"`);
for (const f of forbidden) if (f.test(flat)) problems.push(`forbidden wording: ${f}`);
if (/[�]/.test(text)) problems.push("text has replacement characters (a glyph the font cannot draw)");

console.log(text);
console.log(`--- ${file}: ${pages} page(s), ${flat.length} characters of text`);
problems.forEach((p) => console.log(`FAIL ${p}`));
console.log(problems.length ? `${problems.length} problem(s)` : "PASS");
process.exit(problems.length ? 1 : 0);
