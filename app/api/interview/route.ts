import { NextResponse } from "next/server";
import { askGemmaJson, gemmaModel } from "@/lib/gemma";
import { questionById } from "@/lib/questions";

type Reading = { stance: "yes" | "no" | "unsure" | "unclear"; reply: string };

// POST /api/interview  { id, answer }
// Gemma 4 reads what the person said about one interview question and records where
// they stand on it. The match itself is a plain comparison in lib/match.ts.
export async function POST(request: Request) {
  const { id, answer } = await request.json().catch(() => ({}));
  const question = questionById(String(id));
  const said = typeof answer === "string" ? answer.trim().slice(0, 800) : "";
  if (!question || !said) {
    return NextResponse.json({ error: "Missing question or answer." }, { status: 400 });
  }

  const prompt = `You are a friendly, strictly neutral civic interviewer talking with an 18-25 year old in Miami.

You asked: "${question.question}"

They answered: "${said}"

Decide whether their answer to the question as asked is YES or NO.
- "yes" or "no" only if their position is clear.
- "unsure" if they say they don't know or are torn.
- "unclear" if the answer doesn't address the question.

Return ONLY a JSON object: {"stance":"yes"|"no"|"unsure"|"unclear","reply":"..."}
"reply" is one or two short, warm sentences in everyday language. Reflect back their reason in their own terms and say what you recorded. If "unclear", ask one short follow-up question instead. Never give your own opinion, never argue, never mention political parties or candidates.`;

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
