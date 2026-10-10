#!/usr/bin/env node
// For every candidate and question, save the candidate's single closest passage when it is
// clearly on the topic. No model reads it and no yes/no is assigned: it is shown as
// "the closest thing they've said", in their exact words, for cells with no position.
// Writes data/positions/closest.json.
// Usage: node scripts/attach-passages.mjs [minSimilarity]   (default 0.73)
import { readFileSync, writeFileSync } from "node:fs";
import { cosine } from "./embed-positions.mjs";

// With this embedding model unrelated text can still score 0.72-0.76 against a question, so
// similarity alone cannot tell on-topic from off-topic. A passage must ALSO name the topic
// (the word list below); similarity then picks the best of those.
const MIN = Number(process.argv[2] ?? 0.73);
const TOPIC_WORDS = {
  flooding: /flood|sea.level|storm ?water|sea ?wall|king tide|resilien|\bdrainage\b/i,
  insurance: /insurance|insurer|premium/i,
  heat: /\bheat\b|extreme temperature|outdoor work/i,
  drilling: /drilling|offshore|oil and gas|moratorium/i,
  everglades: /everglades|biscayne bay|water quality|clean water|coral|red tide|algae/i,
  species: /endangered|species|manatee|panther|wildlife|habitat|sea turtle|conservation/i,
  housing: /housing|\brent\b|\brenters?\b|homeowner|home ?ownership|affordable home|\bcondos?\b/i,
  wages: /minimum wage|\bwages?\b|living wage|paycheck|\bunions?\b/i,
  college: /student (debt|loan)|college|tuition|pell|university/i,
  immigration: /immigra|dreamer|\bdaca\b|\btps\b|citizenship|legal status|undocumented/i,
  fema: /fema|hurricane|disaster/i,
  healthcare: /health ?care|health insurance|medicaid|medicare|prescription|affordable care/i,
  enforcement: /\bICE\b|deport|\bborder|immigration enforcement|illegal immigra|detention/,
  cuba: /cuba|venezuel|nicaragua|maduro|castro|sanction|communis/i,
  transit: /transit|metrorail|traffic|transportation|\broads?\b|commute|\brail\b/i,
  taxes: /\btax(es|ed)?\b/i,
};
const MAX_CHARS = 420;

const store = JSON.parse(readFileSync("data/positions/embeddings.json", "utf8"));
const candidates = [...new Set(store.chunks.map((c) => c.candidate_id))].sort();

// Cut at a sentence end so the excerpt is still an exact piece of the page.
const excerpt = (text) => {
  if (text.length <= MAX_CHARS) return text;
  const cut = text.slice(0, MAX_CHARS);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 120 ? cut.slice(0, end + 1) : cut;
};

const closest = [];
for (const candidate_id of candidates) {
  const mine = store.chunks.filter((c) => c.candidate_id === candidate_id);
  for (const q of store.questions) {
    let best = null;
    const names = TOPIC_WORDS[q.id];
    for (const c of mine) {
      if (names && !names.test(c.text)) continue;
      const similarity = cosine(q.vector, c.vector);
      if (!best || similarity > best.similarity) best = { c, similarity };
    }
    if (best && best.similarity >= MIN) {
      closest.push({
        candidate_id,
        question: q.id,
        text: excerpt(best.c.text),
        url: best.c.url,
        similarity: Math.round(best.similarity * 1000) / 1000,
      });
    }
  }
}

writeFileSync("data/positions/closest.json", JSON.stringify({ minSimilarity: MIN, closest }, null, 1) + "\n", "utf8");
const total = candidates.length * store.questions.length;
console.log(`wrote data/positions/closest.json: ${closest.length} of ${total} candidate-question pairs have an on-topic passage`);
for (const id of candidates) {
  console.log(`  ${String(closest.filter((c) => c.candidate_id === id).length).padStart(2)} of ${store.questions.length}  ${id}`);
}
