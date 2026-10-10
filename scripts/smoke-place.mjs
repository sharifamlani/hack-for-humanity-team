#!/usr/bin/env node
// Smoke test for /api/place: five made-up voters, from clearly left to clearly right, must
// be placed in that order on the line, with the left ones negative and the right ones
// positive, and a second run must give the same numbers.
// Usage: node scripts/smoke-place.mjs [baseUrl]   (default http://localhost:3210)
const base = process.argv[2] ?? "http://localhost:3210";

const IDS = ["flooding", "insurance", "everglades", "species", "housing", "immigration"];
// [stance, words] per question, in IDS order.
const VOTERS = {
  "strong left": [
    ["yea", "Yes, absolutely, the government has to pay for it, climate change is real."],
    ["yea", "Yes, insurance companies are ripping us off, regulate them."],
    ["yea", "Yes, protect the Everglades whatever it costs."],
    ["yea", "Yes, animals first, developers have built enough."],
    ["yea", "Yes, we need way more public housing and rent control."],
    ["yea", "Yes, give them citizenship, they are our neighbors."],
  ],
  "lean left": [
    ["yea", "Yeah I think so, my street floods."],
    ["yea", "Probably yes, my mom's bill doubled."],
    ["yea", ""],
    ["yea", "I guess yes, but people need homes too."],
    ["yea", "Yes, rent is insane."],
    ["yea", "Yes, the Dreamers at least."],
  ],
  mixed: [
    ["yea", "Yes, fix the drains."],
    ["nay", "No, government shouldn't run insurance, let more companies compete."],
    ["yea", "Yes, the bay is important."],
    ["nay", "No, we need to build more, that's why rent is high."],
    ["unsure", "Not sure, I don't want my taxes going up."],
    ["yea", "Yes for Dreamers, but secure the border first."],
  ],
  "lean right": [
    ["nay", "Maybe locally, but not more federal spending."],
    ["nay", "No, that's the state's job."],
    ["yea", "Yes, the Everglades matter."],
    ["nay", "No, jobs and building come first."],
    ["nay", "No, cut the red tape so builders can build."],
    ["nay", "Only if they came legally."],
  ],
  "strong right": [
    ["nay", "No, Washington spends too much already."],
    ["nay", "No, get the government out of the market."],
    ["nay", "No more federal money, let Florida handle it."],
    ["nay", "No, these regulations kill jobs."],
    ["nay", "No, the free market will fix housing, cut taxes."],
    ["nay", "No, enforce the law and deport people here illegally."],
  ],
};

async function place(rows) {
  const answers = Object.fromEntries(rows.map(([stance], i) => [IDS[i], stance]));
  const said = Object.fromEntries(rows.map(([, words], i) => [IDS[i], words]).filter(([, w]) => w));
  const t0 = Date.now();
  const res = await fetch(`${base}/api/place`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers, said }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${json.error}`);
  return { ...json, secs: (Date.now() - t0) / 1000 };
}

const names = Object.keys(VOTERS);
// Two passes, one after the other, so ten calls do not hit the model at once.
const pass = () => Promise.all(names.map((n) => place(VOTERS[n])));
let first, second;
try {
  first = await pass();
  second = await pass();
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
}

names.forEach((n, i) => {
  const a = first[i];
  console.log(
    `${n.padEnd(13)} ${a.x.toFixed(2).padStart(6)} [${a.low.toFixed(2)}, ${a.high.toFixed(2)}]  rerun ${second[i].x.toFixed(2)}  ${a.secs.toFixed(0)}s  ${a.model}`,
  );
});

const xs = first.map((r) => r.x);
const checks = [
  ["in order, left to right", xs.every((x, i) => i === 0 || x > xs[i - 1])],
  ["left voters negative", xs[0] < 0 && xs[1] < 0],
  ["right voters positive", xs[3] > 0 && xs[4] > 0],
  ["range contains the point", first.every((r) => r.low <= r.x && r.x <= r.high)],
  ["reruns identical", first.every((r, i) => Math.abs(r.x - second[i].x) < 0.051)],
  ["model is Gemma", first.every((r) => String(r.model).startsWith("gemma-"))],
];
for (const [name, ok] of checks) console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
if (checks.some(([, ok]) => !ok)) {
  console.error("FAIL: voter placement");
  process.exit(1);
}
console.log("PASS: 5 voters in order, left negative, right positive, reruns identical");
