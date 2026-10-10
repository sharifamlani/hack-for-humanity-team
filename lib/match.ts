import { ALL_QUESTION_IDS, QUESTIONS, cfOf, questionById, scoreOf, stanceOf, voteOf } from "./questions";

// The voter's recorded answer to one question.
export type Stance = "yea" | "nay" | "unsure" | "skip";
export type Answers = Record<string, Stance>;

export type Cell = "agree" | "differ" | "none" | "skipped";

// Where a candidate's position comes from, strongest first.
//   voted  — a recorded vote in Congress on a bill that answers the question
//   stated — their own words answer the question (quote shown)
//   leans  — their own words point that way (quote shown)
//   party  — nothing found; filled with their party's usual position (a guess, no quote)
export type Basis = "voted" | "stated" | "leans" | "party" | null;

export function positionOf(candidateId: string, party: string, questionId: string): { stance: "yes" | "no" | null; basis: Basis } {
  const vote = voteOf(candidateId, questionId);
  if (vote) return { stance: vote.stance, basis: "voted" };
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

// ---- One left-right line -------------------------------------------------------------
// A rough placement, not a measurement. For the questions that divide the two parties,
// one answer is the usual left answer and the other the usual right answer.
const LEFT_ANSWER: Record<string, "yes" | "no"> = {
  heat: "yes",
  species: "yes",
  housing: "yes",
  wages: "yes",
  college: "yes",
  immigration: "yes",
  healthcare: "yes",
  enforcement: "no",
  taxes: "no",
};
// A candidate who takes the usual party answer on every question lands at about ±0.5,
// which is roughly where the two parties sit on Voteview's DW-NOMINATE scale.
const INDEX_SCALE = 0.5;
const MIN_ANSWERS = 2;

export type Placement = {
  x: number; // -1 (left) ... +1 (right)
  // "record": DW-NOMINATE from votes in Congress. "donors": CFscore from who funded their
  // past campaigns. "positions": our index from yes/no positions. "guess": our index where
  // most of the positions are party guesses.
  source: "record" | "donors" | "positions" | "guess";
  answers: number;
  // For "donors": the election cycle the score comes from.
  cycle?: number;
};

// CFscores run about -2 to +2; halving puts them on roughly the same line as DW-NOMINATE.
const CF_SCALE = 0.5;

function index(stances: ("yes" | "no" | null)[], ids: string[]) {
  let right = 0;
  let n = 0;
  ids.forEach((id, i) => {
    const s = stances[i];
    if (!s || !LEFT_ANSWER[id]) return;
    n++;
    right += s === LEFT_ANSWER[id] ? -1 : 1;
  });
  return n >= MIN_ANSWERS ? { x: (right / n) * INDEX_SCALE, n } : null;
}

export function placeVoter(answers: Answers): Placement | null {
  const ids = Object.keys(LEFT_ANSWER);
  const got = index(
    ids.map((id) => (answers[id] === "yea" ? "yes" : answers[id] === "nay" ? "no" : null)),
    ids,
  );
  return got ? { x: got.x, source: "positions", answers: got.n } : null;
}

export function placeCandidate(candidateId: string, party: string): Placement | null {
  const record = scoreOf(candidateId);
  if (record) return { x: record.nominate_dim1, source: "record", answers: record.votes_scored };
  const cf = cfOf(candidateId);
  if (cf) return { x: cf.cfscore * CF_SCALE, source: "donors", answers: 0, cycle: cf.cycle };
  const ids = ALL_QUESTION_IDS.filter((id) => LEFT_ANSWER[id]);
  const positions = ids.map((id) => positionOf(candidateId, party, id));
  const got = index(positions.map((p) => p.stance), ids);
  if (!got) return null;
  const guessed = positions.filter((p) => p.basis === "party").length;
  return { x: got.x, source: guessed > got.n / 2 ? "guess" : "positions", answers: got.n };
}

// ---- Suggested ballot ----------------------------------------------------------------
// How close a candidate is to what the voter told us, from 0 to 1. Two ingredients, averaged
// when both exist: the share of questions where they agree (a party guess counts half as
// much as a position backed by a vote or a quote), and how near they sit on the left-right
// line. Plain arithmetic; no model picks anyone.
export type MatchScore = { score: number; agreeShare: number | null; lineCloseness: number | null };

export function matchScore(answers: Answers, candidateId: string, party: string): MatchScore | null {
  const t = tally(answers, candidateId, party);
  const weight = t.own.of + 0.5 * t.guess.of;
  const agreeShare = weight > 0 ? (t.own.agree + 0.5 * t.guess.agree) / weight : null;

  const me = placeVoter(answers);
  const them = placeCandidate(candidateId, party);
  const lineCloseness = me && them ? 1 - Math.min(Math.abs(me.x - them.x), 1) : null;

  const parts = [agreeShare, lineCloseness].filter((p): p is number => p !== null);
  if (parts.length === 0) return null;
  return { score: parts.reduce((a, b) => a + b, 0) / parts.length, agreeShare, lineCloseness };
}
