#!/usr/bin/env node
// Build data/items.json: the real House votes the interviewer asks about.
// For each pick: Voteview cutpoint + how Miami-Dade members voted, the official bill
// summary, and a Gemma 4 draft of the plain-language question (reviewed by a human after).
// Usage: node --env-file=.env scripts/build-items.mjs [--no-gemma]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { parseCsv } from "./merge-candidates.mjs";

const CONGRESS = 119;
const VOTEVIEW = "https://voteview.com/static/data/out";
const CACHE = "data/.cache";

// The picks. Chosen for theme fit and for cutpoints spread across the scale.
const PICKS = [
  { roll: 24, theme: "forces", bill: "hr/471" },
  { roll: 497, theme: "forces", bill: "hr/5587" },
  { roll: 438, theme: "forces", bill: "hr/4758" },
  { roll: 664, theme: "forces", bill: "hr/2140" },
  { roll: 112, theme: "wildlife", bill: "hjres/78" },
  { roll: 556, theme: "wildlife", bill: "hr/2860" },
  { roll: 651, theme: "wildlife", bill: "hr/9436" },
  { roll: 657, theme: "wildlife", bill: "hr/3276" },
  { roll: 331, theme: "jobs", bill: "hr/2550" },
  { roll: 379, theme: "jobs", bill: "hr/2262" },
  { roll: 442, theme: "jobs", bill: "hr/6472" },
  { roll: 309, theme: "jobs", bill: "hr/2965" },
];

// Members who hold Miami-Dade seats under the old or new lines.
const MEMBERS = ["W000808", "D000600", "S000168", "G000593", "M001217"];

const BILL_LABEL = { hr: "H.R.", hjres: "H.J.Res.", s: "S.", sjres: "S.J.Res." };
const BILL_PATH = {
  hr: "house-bill",
  hjres: "house-joint-resolution",
  s: "senate-bill",
  sjres: "senate-joint-resolution",
};

async function cached(name, url) {
  mkdirSync(CACHE, { recursive: true });
  const path = `${CACHE}/${name}`;
  if (existsSync(path)) return readFileSync(path, "utf8");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url.replace(/api_key=[^&]+/, "api_key=...")} -> HTTP ${res.status}`);
  const text = await res.text();
  if (name.endsWith(".json")) JSON.parse(text);
  writeFileSync(path, text, "utf8");
  return text;
}

const table = (text) => {
  const [h, ...rows] = parseCsv(text);
  return rows.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
};

const strip = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

async function gemma(prompt) {
  const model = process.env.GEMMA_MODEL;
  if (!model) throw new Error("GEMMA_MODEL is not set");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemma HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  // Gemma 4 returns its reasoning as a separate part flagged thought:true — drop it.
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text)
    .join("");
  return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
}

const wordingPrompt = (title, summary) => `You write neutral civic-education questions for 18-25 year old voters in Miami.

Bill: ${title}
Official summary: ${summary}

Return ONLY a JSON object with these keys:
- "question": one yes/no question, under 30 words, 8th-grade reading level, asking whether the reader would have voted YES on this bill. Describe what the bill does. No loaded words, no party names, no arguments for or against.
- "summary": two plain sentences on what the bill does, using only facts in the official summary.
- "hook": one sentence, under 20 words, on how this topic can touch daily life in South Florida. Do not take a side and do not invent statistics.`;

async function main() {
  const useGemma = !process.argv.includes("--no-gemma");
  const rollcalls = table(await cached("H119_rollcalls.csv", `${VOTEVIEW}/rollcalls/H${CONGRESS}_rollcalls.csv`));
  const votes = table(await cached("H119_votes.csv", `${VOTEVIEW}/votes/H${CONGRESS}_votes.csv`));
  const members = table(await cached("H119_members.csv", `${VOTEVIEW}/members/H${CONGRESS}_members.csv`));
  const byIcpsr = new Map(members.map((m) => [m.icpsr, m]));
  const previous = existsSync("data/items.json")
    ? new Map(JSON.parse(readFileSync("data/items.json", "utf8")).items.map((i) => [i.roll, i]))
    : new Map();

  const items = [];
  for (const pick of PICKS) {
    const rc = rollcalls.find((r) => Number(r.rollnumber) === pick.roll);
    if (!rc) throw new Error(`roll ${pick.roll} not found`);
    const cast = votes.filter((v) => Number(v.rollnumber) === pick.roll);

    // Which end of the scale voted yea: compare the average position of each side.
    const mean = (codes) => {
      const xs = cast
        .filter((v) => codes.includes(Number(v.cast_code)))
        .map((v) => Number(byIcpsr.get(v.icpsr)?.nominate_dim1))
        .filter(Number.isFinite);
      return xs.reduce((a, b) => a + b, 0) / xs.length;
    };
    const yeaDirection = mean([1, 2, 3]) > mean([4, 5, 6]) ? 1 : -1;

    const memberVotes = {};
    for (const id of MEMBERS) {
      const m = members.find((x) => x.bioguide_id === id);
      const v = m && cast.find((c) => c.icpsr === m.icpsr);
      const code = Number(v?.cast_code);
      memberVotes[id] = code >= 1 && code <= 3 ? "yea" : code >= 4 && code <= 6 ? "nay" : null;
    }

    const [type, number] = pick.bill.split("/");
    // Official title and summary from govinfo's bulk bill-summary files (keyless).
    const xml = await cached(
      `BILLSUM-${type}${number}.xml`,
      `https://www.govinfo.gov/bulkdata/BILLSUM/${CONGRESS}/${type}/BILLSUM-${CONGRESS}${type}${number}.xml`,
    );
    const title = strip(xml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    // The file lists summaries oldest first; the last one describes the latest version.
    const summaries = [...xml.matchAll(/<summary-text><!\[CDATA\[([\s\S]*?)\]\]><\/summary-text>/g)];
    const officialSummary = summaries.length ? strip(summaries.at(-1)[1]).slice(0, 1500) : "";
    if (!title) throw new Error(`no title in summary file for ${pick.bill}`);

    const item = {
      roll: pick.roll,
      theme: pick.theme,
      bill: `${BILL_LABEL[type]} ${number}`,
      title,
      date: rc.date,
      result: rc.vote_result,
      yea: Number(rc.yea_count),
      nay: Number(rc.nay_count),
      cutpoint: Number(rc.nominate_mid_1),
      yeaDirection,
      memberVotes,
      officialSummary,
      billUrl: `https://www.congress.gov/bill/${CONGRESS}th-congress/${BILL_PATH[type]}/${number}`,
      voteUrl: `https://voteview.com/rollcall/RH${CONGRESS}${String(pick.roll).padStart(4, "0")}`,
    };

    // Keep wording a human has already reviewed; only draft what is missing.
    const old = previous.get(pick.roll);
    if (old?.question) {
      Object.assign(item, { question: old.question, summary: old.summary, hook: old.hook, reviewed: !!old.reviewed });
    } else if (useGemma && officialSummary) {
      Object.assign(item, await gemma(wordingPrompt(title, officialSummary)), { reviewed: false });
    }
    items.push(item);
    console.log(
      `${item.theme.padEnd(8)} roll ${String(item.roll).padStart(3)} ${item.bill.padEnd(14)} cut ${item.cutpoint.toFixed(3)} yea->${yeaDirection > 0 ? "right" : "left "} ${item.question ? "worded" : "NO WORDING"}`,
    );
  }

  const memberInfo = Object.fromEntries(
    MEMBERS.map((id) => {
      const m = members.find((x) => x.bioguide_id === id);
      return [id, { name: m.bioname, nominate_dim1: Number(m.nominate_dim1) }];
    }),
  );

  writeFileSync(
    "data/items.json",
    JSON.stringify(
      {
        source: "Voteview (cutpoints, votes), govinfo.gov bulk bill summaries, Gemma 4 (question wording, human-reviewed)",
        wordingModel: process.env.GEMMA_MODEL ?? null,
        members: memberInfo,
        items,
      },
      null,
      1,
    ) + "\n",
    "utf8",
  );
  console.log(`wrote data/items.json: ${items.length} items`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
