import { NextResponse } from "next/server";
import { askGemmaJson, gemmaModel } from "@/lib/gemma";
import { ITEMS } from "@/lib/items";

type Reading = { stance: "yes" | "no" | "unsure" | "unclear"; reply: string };

// POST /api/interview  { roll, answer }
// Gemma 4 reads a free-text answer about one real House vote and records where the
// person stands on it. It never scores anyone — the scale is computed in lib/scale.ts.
export async function POST(request: Request) {
  const { roll, answer } = await request.json().catch(() => ({}));
  const item = ITEMS.find((i) => i.roll === Number(roll));
  const said = typeof answer === "string" ? answer.trim().slice(0, 600) : "";
  if (!item || !said) {
    return NextResponse.json({ error: "Missing vote or answer." }, { status: 400 });
  }

  const prompt = `You are a friendly, strictly neutral civic interviewer talking with an 18-25 year old in Miami.

You asked about this real U.S. House vote:
Bill: ${item.bill} — ${item.title}
What it does: ${item.summary}
Your question: "${item.question}"

They answered: "${said}"

Decide whether they would have voted YES or NO on the bill itself. Read carefully: supporting the thing a bill removes means NO on the bill.
- "yes" or "no" only if their position on the bill is clear.
- "unsure" if they say they don't know or are torn.
- "unclear" if the answer doesn't address the bill.

Return ONLY a JSON object: {"stance":"yes"|"no"|"unsure"|"unclear","reply":"..."}
"reply" is one or two short, warm sentences in everyday language. Reflect back their reason in their own terms and say what you recorded. If "unclear", ask one short follow-up question instead. Never give your own opinion, never argue, never mention political parties.`;

  try {
    const reading = await askGemmaJson<Reading>(prompt);
    if (!["yes", "no", "unsure", "unclear"].includes(reading.stance) || !reading.reply) {
      throw new Error("unexpected shape");
    }
    return NextResponse.json({ ...reading, model: gemmaModel() });
  } catch {
    return NextResponse.json(
      { error: "The interviewer didn't catch that. Tap Yes, No or Not sure instead." },
      { status: 502 },
    );
  }
}
