import { NextResponse } from "next/server";
import { askGemma, gemmaModel } from "@/lib/gemma";
import { questionById, stanceOf } from "@/lib/questions";

// POST /api/explain  { id, stance: "yea"|"nay", said, candidates: [{id, name}] }
// Gemma 4 writes a short comparison between what the voter said on one issue and what
// each candidate has published, using only the sourced quotes. It describes; it never
// recommends.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = questionById(String(body.id));
  const candidates: { id: string; name: string }[] = Array.isArray(body.candidates) ? body.candidates : [];
  if (!question || candidates.length === 0 || !["yea", "nay"].includes(body.stance)) {
    return NextResponse.json({ error: "Nothing to compare yet." }, { status: 400 });
  }

  const lines = candidates.map((c) => {
    const s = stanceOf(c.id, question.id);
    return s && s.stance !== "none"
      ? `- ${c.name}: their published words answer "${s.stance}". Exact quote: "${s.quote}"`
      : `- ${c.name}: no public position found on this.`;
  });
  const said = typeof body.said === "string" ? body.said.trim().slice(0, 500) : "";

  const prompt = `You explain where a young Miami voter and the candidates on their ballot stand on one issue.

Question: "${question.question}"
The voter answered ${body.stance === "yea" ? "YES" : "NO"}${said ? ` and said: "${said}"` : ""}.

What the candidates have published:
${lines.join("\n")}

Write 2 to 3 short sentences in plain, friendly language, addressed to the voter as "you". Say who lines up with them and who differs, based only on the quotes above, and say plainly when a candidate has no public position. Do not recommend anyone, do not praise or criticise, do not mention political parties, do not guess at motives, and do not add facts that are not above. Plain text only, no markdown.`;

  try {
    return NextResponse.json({ text: await askGemma(prompt, 3072), model: gemmaModel() });
  } catch {
    return NextResponse.json({ error: "Gemma 4 isn't answering right now." }, { status: 502 });
  }
}
