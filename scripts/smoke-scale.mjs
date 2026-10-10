#!/usr/bin/env node
// Smoke test for lib/scale.ts: feed each Miami-Dade member's REAL votes on the interview
// items through the same code a voter's answers go through, and check they land where
// Voteview's own published score puts them.
// Usage: node --experimental-strip-types scripts/smoke-scale.mjs [tolerance]   (default 0.35)
import { readFileSync } from "node:fs";
import { estimatePosition } from "../lib/scale.ts";

const tolerance = Number(process.argv[2] ?? 0.35);
const { items, members } = JSON.parse(readFileSync("data/items.json", "utf8"));

let failed = false;
for (const [id, m] of Object.entries(members)) {
  const answers = Object.fromEntries(items.map((i) => [i.roll, i.memberVotes[id]]));
  const pos = estimatePosition(items, answers);
  if (!pos) {
    console.log(`SKIP ${m.name}: no votes on these items`);
    continue;
  }
  const sameSide = Math.sign(pos.theta) === Math.sign(m.nominate_dim1);
  const close = Math.abs(pos.theta - m.nominate_dim1) <= tolerance;
  const ok = sameSide && close;
  if (!ok) failed = true;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${m.name.padEnd(24)} ours ${pos.theta.toFixed(2)} [${pos.low.toFixed(2)}, ${pos.high.toFixed(2)}]` +
      `  voteview ${m.nominate_dim1.toFixed(2)}  from ${pos.answered} votes`,
  );
}

if (failed) {
  console.error("FAIL: at least one member is on the wrong side or too far from Voteview");
  process.exit(1);
}
console.log(`PASS: Miami-Dade members recovered on the correct side, within ${tolerance} of nominate_dim1`);
