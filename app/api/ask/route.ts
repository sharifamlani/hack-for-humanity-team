import { NextResponse } from "next/server";
import { askGemmaJson, gemmaModel } from "@/lib/gemma";
import {
  EMBED_MODEL,
  closestPassages,
  embedText,
  isExactQuote,
  loadPassages,
  segments,
  type Hit,
} from "@/lib/positions";

type Reading = {
  topics: string[];
  candidates: { candidate_id: string; passage: number | null; quote: string; summary: string }[];
};

const publicHit = (h: Hit) => ({
  text: h.passage.text,
  url: h.passage.url,
  title: h.passage.title,
  kind: h.passage.kind,
  similarity: Math.round(h.similarity * 1000) / 1000,
});

// POST /api/ask  { said, candidates: [{ id, name }] }
// Returns { topic, findings: [{ id, name, said, quote, url }] } for the match screen, plus
// the raw search results (passages with similarity scores) under "results".
// The open interview: the voter talks about whatever they care about. Their words are
// embedded, cosine similarity finds each candidate's closest published passages, and
// Gemma 4 reads those passages and says what each candidate has published on it.
// A quote is returned only if it is word-for-word in the passage. Nothing is stored.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const spoken = body.said ?? body.transcript;
  const transcript = typeof spoken === "string" ? spoken.trim() : "";
  const candidates: { id: string; name: string }[] = (Array.isArray(body.candidates) ? body.candidates : [])
    .filter((c: { id?: unknown; name?: unknown }) => typeof c?.id === "string" && typeof c?.name === "string")
    .slice(0, 6);
  if (transcript.length < 12 || candidates.length === 0) {
    return NextResponse.json({ error: "Tell us a bit more about what you care about." }, { status: 400 });
  }

  let passages;
  try {
    passages = loadPassages();
  } catch {
    passages = null;
  }
  if (!passages) {
    return NextResponse.json(
      { error: "Candidate positions haven't been collected yet." },
      { status: 503 },
    );
  }

  let queries;
  try {
    const parts = segments(transcript);
    const vectors = await Promise.all(parts.map(embedText));
    queries = parts.map((text, i) => ({ text, vector: vectors[i] }));
  } catch {
    return NextResponse.json({ error: "The search isn't answering right now." }, { status: 502 });
  }

  const found = candidates.map((c) => ({ ...c, hits: closestPassages(passages, c.id, queries) }));
  const withHits = found.filter((c) => c.hits.length > 0);

  // Gemma 4 reads only the passages the search found. If it fails, the passages and
  // links are still returned, without a summary.
  let reading: Reading | null = null;
  if (withHits.length > 0) {
    const blocks = withHits.map(
      (c) =>
        `Candidate ${c.id} (${c.name}):\n` +
        c.hits.map((h) => `[P${h.passage.id}] ${h.passage.text}`).join("\n"),
    );
    const prompt = `A young Miami voter told a civic app, in their own words, what they care about:
"${transcript.slice(0, 1500)}"

Below are passages from what candidates on their ballot have published. They were picked by a search and some may be off-topic.

${blocks.join("\n\n")}

Return ONLY a JSON object:
{"topics":["2 to 4 short labels for what the voter talked about"],
 "candidates":[{"candidate_id":"...","passage":<number after P, or null>,"quote":"...","summary":"..."}]}

For each candidate above:
- "passage": the one passage that best speaks to what the voter cares about, or null if none of them really does.
- "quote": one sentence copied EXACTLY, character for character, from that passage. Empty string if passage is null.
- "summary": one or two plain sentences, addressed to the voter as "you", on what this candidate has published about the thing you raised. Use only what the passages say. If passage is null, say they have not published anything on it that we found.
Never recommend anyone, never praise or criticise, never mention political parties, never guess what a candidate thinks beyond their words.`;
    try {
      reading = await askGemmaJson<Reading>(prompt);
    } catch (e) {
      console.error("ask: Gemma reading failed:", e instanceof Error ? e.message : e);
      reading = null;
    }
  }

  const results = found.map((c) => {
    const read = reading?.candidates?.find((r) => r.candidate_id === c.id);
    const cited = c.hits.find((h) => h.passage.id === read?.passage);
    // The guardrail: Gemma's quote must be word-for-word in the passage it cites.
    const quoteOk = !!cited && !!read && isExactQuote(read.quote, cited.passage.text);
    return {
      candidate_id: c.id,
      name: c.name,
      found: c.hits.length > 0,
      summary: quoteOk ? read!.summary : null,
      quote: quoteOk ? read!.quote.trim() : null,
      url: quoteOk ? cited!.passage.url : null,
      passages: c.hits.map(publicHit),
    };
  });

  const topics = Array.isArray(reading?.topics) ? reading!.topics.slice(0, 4) : [];
  return NextResponse.json({
    topic: topics.join(", "),
    findings: results.map((r) => ({
      id: r.candidate_id,
      name: r.name,
      said:
        r.summary ??
        (r.found
          ? "We found related pages but couldn't confirm an exact quote."
          : "Nothing found in what they've published that speaks to this."),
      quote: r.quote ?? "",
      url: r.url ?? "",
    })),
    topics,
    results,
    models: { search: EMBED_MODEL, reader: reading ? gemmaModel() : null },
  });
}
