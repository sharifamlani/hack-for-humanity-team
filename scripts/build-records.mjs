#!/usr/bin/env node
// Voting records for the candidates who have served in the 119th Congress.
// Writes data/positions/records.json with two things per member:
//   - their DW-NOMINATE first-dimension score from Voteview (-1 liberal ... +1 conservative)
//   - how they voted on a short list of roll calls that map onto the interview questions
// Usage: node scripts/build-records.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { parseCsv } from "./merge-candidates.mjs";

const CACHE = "data/.cache";
const VOTEVIEW = "https://voteview.com/static/data/out";

// candidate_id -> bioguide id and chamber.
const MEMBERS = {
  "us-house-fl26-diaz-balart": { bioguide: "D000600", chamber: "H" },
  "us-house-fl27-salazar": { bioguide: "S000168", chamber: "H" },
  "us-house-fl28-gimenez": { bioguide: "G000593", chamber: "H" },
  "us-house-fl25-moskowitz": { bioguide: "M001217", chamber: "H" },
  "us-senate-fl-moody": { bioguide: "M001244", chamber: "S" },
  "fl-gov-donalds": { bioguide: "D000032", chamber: "H" },
};

// Roll calls that answer an interview question. "yea" says which answer a yea vote means.
const ROLLS = [
  { chamber: "H", roll: 22, question: "enforcement", yea: "yes", bill: "S. 5", what: "the Laken Riley Act, which requires detention of unauthorized immigrants charged with theft and similar crimes" },
  { chamber: "H", roll: 189, question: "taxes", yea: "yes", bill: "H.R. 1", what: "the 2025 tax and spending law (the One Big Beautiful Bill Act), which extended and added federal tax cuts" },
  { chamber: "S", roll: 372, question: "taxes", yea: "yes", bill: "H.R. 1", what: "the 2025 tax and spending law (the One Big Beautiful Bill Act), which extended and added federal tax cuts" },
  { chamber: "H", roll: 480, question: "immigration", yea: "yes", bill: "H.R. 1689", what: "a bill requiring Temporary Protected Status for Haiti" },
  { chamber: "H", roll: 112, question: "species", yea: "no", bill: "H.J.Res. 78", what: "a resolution removing endangered-species protection for the longfin smelt" },
  { chamber: "H", roll: 584, question: "housing", yea: "yes", bill: "H.R. 6644", what: "the Housing for the 21st Century Act, a bill to increase the supply of housing" },
  { chamber: "S", roll: 712, question: "housing", yea: "yes", bill: "H.R. 6644", what: "the Housing for the 21st Century Act, a bill to increase the supply of housing" },
  { chamber: "S", roll: 644, question: "healthcare", yea: "yes", bill: "S. 3385", what: "moving ahead on a bill to extend the enhanced health-insurance premium tax credits" },
  { chamber: "S", roll: 184, question: "wages", yea: "yes", bill: "H.Con.Res. 14", what: "an amendment to let the Senate raise the federal minimum wage to $17 an hour by a simple majority" },
  { chamber: "S", roll: 808, question: "enforcement", yea: "no", bill: "S. 2", what: "a motion to move U.S. Immigration and Customs Enforcement funding to child-care grants" },
  { chamber: "S", roll: 811, question: "immigration", yea: "yes", bill: "S. 2", what: "a motion to use U.S. Immigration and Customs Enforcement funds to process DACA (Dreamer) applications on time" },
];

async function table(name) {
  mkdirSync(CACHE, { recursive: true });
  const path = `${CACHE}/${name}`;
  if (!existsSync(path)) {
    const kind = name.split("_")[1].replace(".csv", "");
    const res = await fetch(`${VOTEVIEW}/${kind}/${name}`);
    if (!res.ok) throw new Error(`${name} -> HTTP ${res.status}`);
    writeFileSync(path, await res.text(), "utf8");
  }
  const [h, ...rows] = parseCsv(readFileSync(path, "utf8"));
  return rows.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

const data = {};
for (const ch of ["H", "S"]) {
  data[ch] = {
    members: await table(`${ch}119_members.csv`),
    rollcalls: await table(`${ch}119_rollcalls.csv`),
    votes: await table(`${ch}119_votes.csv`),
  };
}

const scores = [];
const votes = [];
for (const [candidate_id, m] of Object.entries(MEMBERS)) {
  const row = data[m.chamber].members.find((x) => x.bioguide_id === m.bioguide);
  if (!row) throw new Error(`member ${m.bioguide} not found in Voteview`);
  scores.push({
    candidate_id,
    bioguide: m.bioguide,
    chamber: m.chamber === "H" ? "U.S. House" : "U.S. Senate",
    nominate_dim1: Number(row.nominate_dim1),
    votes_scored: Number(row.nominate_number_of_votes),
    url: `https://voteview.com/person/${row.icpsr}`,
  });

  for (const pick of ROLLS.filter((r) => r.chamber === m.chamber)) {
    const rc = data[m.chamber].rollcalls.find((r) => Number(r.rollnumber) === pick.roll);
    if (!rc) throw new Error(`roll ${pick.chamber}${pick.roll} not found`);
    const cast = data[m.chamber].votes.find((v) => Number(v.rollnumber) === pick.roll && v.icpsr === row.icpsr);
    const code = Number(cast?.cast_code);
    const voted = code >= 1 && code <= 3 ? "yea" : code >= 4 && code <= 6 ? "nay" : null;
    if (!voted) continue; // absent or not yet in office: no position from this vote
    const stance = (voted === "yea") === (pick.yea === "yes") ? "yes" : "no";
    votes.push({
      candidate_id,
      question: pick.question,
      stance,
      voted,
      bill: pick.bill,
      date: rc.date,
      text: `Voted ${voted === "yea" ? "YES" : "NO"} on ${pick.what} (${pick.bill}, ${rc.date}).`,
      url: `https://voteview.com/rollcall/R${pick.chamber}119${String(pick.roll).padStart(4, "0")}`,
    });
  }
}

// CFscores (Bonica's DIME database): where a candidate's donors place them, on a scale of
// about -2 (left) to +2 (right). Collected into data/positions/cfscores.csv from the DIME
// recipients file. Two are left out because the score is from a run under a different party
// than the one they are running with now: Jolly (2016, as a Republican) and Francius (2022,
// as a Democrat).
const SKIP_CF = new Set(["fl-gov-jolly", "fl-house-108-francius"]);
const cfscores = [];
if (existsSync("data/positions/cfscores.csv")) {
  const [h, ...rows] = parseCsv(readFileSync("data/positions/cfscores.csv", "utf8"));
  for (const r of rows) {
    const o = Object.fromEntries(h.map((k, i) => [k, r[i]]));
    if (SKIP_CF.has(o.candidate_id) || o.recipient_cfscore === "" || !Number.isFinite(Number(o.recipient_cfscore))) continue;
    cfscores.push({ candidate_id: o.candidate_id, cfscore: Number(o.recipient_cfscore), cycle: Number(o.cycle), seat: o.seat });
  }
}

writeFileSync(
  "data/positions/records.json",
  JSON.stringify(
    {
      source: "Voteview, 119th Congress (voteview.com); DIME v4.0 recipients 1979-2024 (data.stanford.edu/dime)",
      scores,
      votes,
      cfscores,
    },
    null,
    1,
  ) + "\n",
  "utf8",
);
for (const s of scores) {
  const mine = votes.filter((v) => v.candidate_id === s.candidate_id);
  console.log(`${s.candidate_id.padEnd(28)} DW-NOMINATE ${s.nominate_dim1.toFixed(3).padStart(6)}  ${mine.map((v) => `${v.question}:${v.stance}`).join("  ")}`);
}
console.log(`wrote data/positions/records.json: ${scores.length} scores, ${votes.length} votes on question-matched roll calls`);
