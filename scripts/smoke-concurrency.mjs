#!/usr/bin/env node
// Load smoke for /api/place: N voters finishing the interview at the same moment, as a room
// would after scanning a QR code. Each call makes a real Gemma 4 request. Passes only if
// every call returns 200 and the slowest one answers within the limit.
// Usage: node scripts/smoke-concurrency.mjs [--base URL] [--n 10] [--limit 60]
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const base = arg("base", "http://localhost:3000");
const n = Number(arg("n", 10));
const limitS = Number(arg("limit", 60));

// One mixed voter, with the open-ended answer varied so no two requests are identical.
const answers = { flooding: "yea", insurance: "nay", everglades: "yea", housing: "nay", immigration: "yea", healthcare: "yea" };
const said = (i) => ({ flooding: `Yes, my street floods every king tide (voter ${i}).` });

async function one(i) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}/api/place`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers, said: said(i) }),
    });
    const body = await res.json().catch(() => ({}));
    return { i, status: res.status, s: (Date.now() - t0) / 1000, x: body.x, error: body.error };
  } catch (e) {
    return { i, status: 0, s: (Date.now() - t0) / 1000, error: e instanceof Error ? e.message : String(e) };
  }
}

console.log(`${n} parallel POST ${base}/api/place, limit ${limitS}s`);
const results = await Promise.all(Array.from({ length: n }, (_, i) => one(i)));
for (const r of results) {
  console.log(`  #${r.i} ${r.status} ${r.s.toFixed(1)}s ${r.error ? `error: ${r.error}` : `x=${r.x}`}`);
}
const ok = results.filter((r) => r.status === 200).length;
const slowest = Math.max(...results.map((r) => r.s));
const pass = ok === n && slowest <= limitS;
console.log(`${ok}/${n} ok, slowest ${slowest.toFixed(1)}s — ${pass ? "PASS" : "FAIL"}`);
process.exit(pass ? 0 : 1);
