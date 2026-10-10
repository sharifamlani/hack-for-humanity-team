#!/usr/bin/env node
// Smoke test for the transcript-to-positions search in lib/positions.ts.
//
// With no arguments it builds a tiny labelled TEST set (made-up passages for made-up
// candidates), embeds it with the real embedding model, and checks that a voter talking
// about two topics pulls back the right passage for each and nothing for an unrelated one.
// With --real "<transcript>" it searches the real data/positions/embeddings.json instead
// and prints the top passages per candidate, for an eyeball check.
// Usage: node --env-file=.env --experimental-strip-types scripts/smoke-ask.mjs [--real "text"]
import { closestPassages, embedText, loadPassages, segments, isExactQuote, MIN_SIMILARITY } from "../lib/positions.ts";

const embedAll = async (transcript) => {
  const parts = segments(transcript);
  const vectors = await Promise.all(parts.map(embedText));
  return parts.map((text, i) => ({ text, vector: vectors[i] }));
};

async function real(transcript) {
  const passages = loadPassages();
  if (!passages) {
    console.error("FAIL: data/positions/embeddings.json does not exist yet");
    process.exit(1);
  }
  const queries = await embedAll(transcript);
  console.log(`${passages.length} passages · ${queries.length} segment(s) · floor ${MIN_SIMILARITY}`);
  for (const id of [...new Set(passages.map((p) => p.candidate_id))].sort()) {
    const hits = closestPassages(passages, id, queries, 3);
    console.log(`\n${id}: ${hits.length ? "" : "nothing above the floor"}`);
    for (const h of hits) console.log(`  ${h.similarity.toFixed(3)}  ${h.passage.text.slice(0, 140)}`);
  }
}

async function synthetic() {
  const texts = [
    ["test-a", "TEST PASSAGE. We must raise roads and rebuild storm drains so that king tide flooding stops shutting down our neighborhoods."],
    ["test-a", "TEST PASSAGE. Small businesses need lower taxes and fewer regulations to create jobs."],
    ["test-b", "TEST PASSAGE. Rent has exploded across Miami. I will fight for more affordable housing and help for renters."],
    ["test-b", "TEST PASSAGE. Our veterans deserve the best health care this country can provide."],
  ];
  const passages = await Promise.all(
    texts.map(async ([candidate_id, text], id) => ({
      id, candidate_id, url: "https://example.invalid/test", kind: "test", title: "test", text, vector: await embedText(text),
    })),
  );
  const queries = await embedAll(
    "Honestly my rent went up four hundred dollars this year and I can barely afford to stay in Miami anymore. " +
      "Also my street floods every time there is a high tide and nobody ever fixes the drains around here.",
  );

  const top = (id) => closestPassages(passages, id, queries, 1)[0];
  const a = top("test-a");
  const b = top("test-b");
  const offTopic = closestPassages(passages, "test-b", await embedAll("I really love watching basketball and playing video games on the weekend."), 1);
  console.log(`segments: ${queries.length}`);
  console.log(`test-a top: ${a ? a.similarity.toFixed(3) : "none"}  ${a?.passage.text.slice(14, 70) ?? ""}`);
  console.log(`test-b top: ${b ? b.similarity.toFixed(3) : "none"}  ${b?.passage.text.slice(14, 70) ?? ""}`);
  console.log(`off-topic hits above floor: ${offTopic.length}${offTopic[0] ? ` (${offTopic[0].similarity.toFixed(3)})` : ""}`);

  const checks = [
    ["flooding talk finds the flooding passage", a?.passage.id === 0],
    ["rent talk finds the housing passage", b?.passage.id === 2],
    ["unrelated talk finds nothing", offTopic.length === 0],
    ["exact quote accepted", isExactQuote("Rent has exploded across Miami.", texts[2][1])],
    ["altered quote rejected", !isExactQuote("Rent has exploded across South Florida.", texts[2][1])],
  ];
  for (const [name, ok] of checks) console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (checks.some(([, ok]) => !ok)) {
    console.error("FAIL: transcript search");
    process.exit(1);
  }
  console.log("PASS: transcript search finds the right passage per topic and rejects altered quotes");
}

const i = process.argv.indexOf("--real");
(i > -1 ? real(process.argv[i + 1] ?? "") : synthetic()).catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
