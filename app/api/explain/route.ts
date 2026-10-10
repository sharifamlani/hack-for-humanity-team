import { NextResponse } from "next/server";
import { askGemma, gemmaModel } from "@/lib/gemma";
import { ITEMS, MEMBERS, THEMES, type Theme } from "@/lib/items";

// POST /api/explain  { theme, answers: {roll: "yea"|"nay"}, bioguideIds: [] }
// Gemma 4 writes a short plain-language comparison for one theme, using only the vote
// records it is handed. It describes; it never recommends.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const theme = body.theme as Theme;
  const answers: Record<string, string> = body.answers ?? {};
  const ids: string[] = (body.bioguideIds ?? []).filter((id: string) => MEMBERS[id]);
  if (!THEMES[theme]) return NextResponse.json({ error: "Unknown theme." }, { status: 400 });

  const rows = ITEMS.filter((i) => i.theme === theme && answers[i.roll]).map((i) => {
    const members = ids
      .map((id) => `${MEMBERS[id].name}: ${i.memberVotes[id] ?? "did not vote"}`)
      .join("; ");
    return `- ${i.bill} (${i.summary}) — the voter: ${answers[i.roll]}; ${members}`;
  });
  if (rows.length === 0 || ids.length === 0) {
    return NextResponse.json({ error: "Nothing to compare yet." }, { status: 400 });
  }

  const prompt = `You explain voting records to an 18-25 year old in Miami. Topic: ${THEMES[theme].label}.

Here is how the voter answered on real U.S. House votes, and how their members of Congress actually voted ("yea" = voted for the bill, "nay" = voted against):
${rows.join("\n")}

Write 2 to 3 short sentences in plain, friendly language, addressed to the voter as "you", saying where they and each member lined up and where they split. Name the bills by what they do, not by number. Use ONLY the facts above. Do not recommend anyone, do not praise or criticise, do not mention political parties, do not guess at motives. Plain text only, no markdown.`;

  try {
    return NextResponse.json({ text: await askGemma(prompt, 3072), model: gemmaModel() });
  } catch {
    return NextResponse.json({ error: "Gemma 4 isn't answering right now." }, { status: 502 });
  }
}
