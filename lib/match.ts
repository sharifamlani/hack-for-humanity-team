import { QUESTIONS, questionById, stanceOf } from "./questions";

// The voter's recorded answer to one question.
export type Stance = "yea" | "nay" | "unsure" | "skip";
export type Answers = Record<string, Stance>;

export type Cell = "agree" | "differ" | "none" | "skipped";

// Where a candidate's position comes from, strongest first.
//   stated — their own words answer the question (quote shown)
//   leans  — their own words point that way (quote shown)
//   party  — nothing found; filled with their party's usual position (a guess, no quote)
export type Basis = "stated" | "leans" | "party" | null;

export function positionOf(candidateId: string, party: string, questionId: string): { stance: "yes" | "no" | null; basis: Basis } {
  const own = stanceOf(candidateId, questionId);
  if (own && own.stance !== "none") return { stance: own.stance, basis: own.reading ?? "stated" };
  const lean = questionById(questionId)?.partyLean?.[party];
  return lean ? { stance: lean, basis: "party" } : { stance: null, basis: null };
}

// Plain comparison, no model: the voter's yes/no against the candidate's yes/no.
export function compare(answers: Answers, candidateId: string, party: string, questionId: string): { cell: Cell; basis: Basis } {
  const mine = answers[questionId];
  const theirs = positionOf(candidateId, party, questionId);
  if (mine !== "yea" && mine !== "nay") return { cell: "skipped", basis: theirs.basis };
  if (!theirs.stance) return { cell: "none", basis: null };
  return { cell: (mine === "yea") === (theirs.stance === "yes") ? "agree" : "differ", basis: theirs.basis };
}

// "Lines up with you on X of Y", counted separately for positions backed by the
// candidate's own words and for party guesses.
export function tally(answers: Answers, candidateId: string, party: string) {
  const own = { agree: 0, of: 0 };
  const guess = { agree: 0, of: 0 };
  for (const q of QUESTIONS) {
    const { cell, basis } = compare(answers, candidateId, party, q.id);
    if (cell !== "agree" && cell !== "differ") continue;
    const bucket = basis === "party" ? guess : own;
    bucket.of++;
    if (cell === "agree") bucket.agree++;
  }
  return { own, guess };
}
