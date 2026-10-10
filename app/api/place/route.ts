import { NextResponse } from "next/server";
import { askGemma, gemmaModel } from "@/lib/gemma";
import { readEstimate, voterPrompt } from "@/lib/placement";
import { questionById } from "@/lib/questions";

const SAID: Record<string, string> = { yea: "Yes.", nay: "No.", unsure: "I'm not sure." };

// POST /api/place  { answers: {questionId: "yea"|"nay"|"unsure"|"skip"}, said: {questionId: words}, openSaid }
// Gemma 4 reads the voter's whole interview — the questions and what they said in their own
// words — and places them on the same left-right line as the candidates, with a range.
// It only places the voter; the match itself is arithmetic in lib/match.ts. Nothing is stored.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const answers: Record<string, string> = body.answers ?? {};
  const said: Record<string, string> = body.said ?? {};
  const openSaid = typeof body.openSaid === "string" ? body.openSaid.trim().slice(0, 1500) : "";

  const turns: string[] = [];
  for (const [id, stance] of Object.entries(answers)) {
    const question = questionById(id);
    if (!question || !SAID[stance]) continue;
    // Their own words when we have them; otherwise the button they tapped.
    const words = typeof said[id] === "string" && said[id].trim() ? said[id].trim().slice(0, 500) : "";
    const recorded = stance === "unsure" ? "not sure" : stance === "yea" ? "yes" : "no";
    turns.push(`Q: ${question.question}\nA: ${words ? `${words} (recorded as ${recorded})` : SAID[stance]}`);
  }
  if (openSaid) turns.push(`Asked what they care about most, they said: ${openSaid}`);

  const takesASide = Object.values(answers).filter((a) => a === "yea" || a === "nay").length;
  if (takesASide < 2 && openSaid.length < 40) {
    return NextResponse.json({ error: "Not enough to place you yet." }, { status: 400 });
  }

  try {
    const estimate = readEstimate(await askGemma(voterPrompt(turns.join("\n")), 4096, 0));
    return NextResponse.json({ ...estimate, turns: turns.length, model: gemmaModel() });
  } catch (e) {
    console.error("place:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Gemma 4 isn't answering right now." }, { status: 502 });
  }
}
