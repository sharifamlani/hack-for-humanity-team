import questionsJson from "@/data/questions.json";
import stancesJson from "@/data/positions/stances.json";
import stateStancesJson from "@/data/positions/stances-state.json";
import closestJson from "@/data/positions/closest.json";
import reviewedOutJson from "@/data/positions/reviewed-out.json";
import recordsJson from "@/data/positions/records.json";
import estimatesJson from "@/data/positions/estimates.json";

export type Theme = "forces" | "wildlife" | "jobs";

export type Question = {
  id: string;
  theme: Theme;
  short: string;
  question: string;
  search: string;
  active?: boolean;
  // Fallback only: the usual position of a national party, used when a candidate's own
  // words gave us nothing. Not sourced per candidate; always labelled as a guess.
  partyLean?: Record<string, "yes" | "no">;
};

// What a candidate's own published words say on one question. Built before the demo by
// scripts/build-stances.mjs: cosine search finds the passages, Gemma 4 reads them, and a
// stance is kept only when its quote is word-for-word on the page.
export type CandidateStance = {
  candidate_id: string;
  question: string;
  stance: "yes" | "no" | "none";
  // "stated": the quote answers the question. "leans": the quote points that way.
  reading?: "stated" | "leans";
  quote: string;
  url: string;
  why: string;
};

export const THEMES: Record<Theme, { emoji: string; label: string; color: string }> = {
  forces: { emoji: "🌊", label: "Water · air · land · fire", color: "bg-water" },
  wildlife: { emoji: "🐢", label: "Wildlife", color: "bg-wildlife" },
  jobs: { emoji: "🎓", label: "Jobs & staying in Miami", color: "bg-jobs" },
};

const ALL = questionsJson.questions as Question[];
const chosen = ALL.some((q) => q.active) ? ALL.filter((q) => q.active) : ALL;

// Interview order: one question from each theme in turn, so stopping early covers all three.
export const QUESTIONS: Question[] = (() => {
  const groups = (Object.keys(THEMES) as Theme[]).map((t) => chosen.filter((q) => q.theme === t));
  const out: Question[] = [];
  for (let i = 0; i < Math.max(...groups.map((g) => g.length)); i++) {
    for (const g of groups) if (g[i]) out.push(g[i]);
  }
  return out;
})();

export const questionById = (id: string) => ALL.find((q) => q.id === id);

// Federal candidates and state-legislature candidates are read in separate runs.
// Readings a person reviewed and judged too much of a stretch are dropped here.
const REVIEWED_OUT = new Set(reviewedOutJson.removed.map((r) => `${r.candidate_id}|${r.question}`));
const STANCES = [
  ...(stancesJson as { stances: CandidateStance[] }).stances,
  ...(stateStancesJson as { stances: CandidateStance[] }).stances,
].filter((s) => !REVIEWED_OUT.has(`${s.candidate_id}|${s.question}`));

export const stanceOf = (candidateId: string, questionId: string) =>
  STANCES.find((s) => s.candidate_id === candidateId && s.question === questionId);

// The candidate's closest on-topic passage for a question, in their exact words. No model
// has read it and it carries no yes/no (scripts/attach-passages.mjs).
export type ClosestPassage = { candidate_id: string; question: string; text: string; url: string };
const CLOSEST = (closestJson as { closest: ClosestPassage[] }).closest;
export const closestOf = (candidateId: string, questionId: string) =>
  CLOSEST.find((c) => c.candidate_id === candidateId && c.question === questionId);

// Voting records for candidates who have served in Congress (scripts/build-records.mjs):
// a real vote on a bill that answers the question, and their DW-NOMINATE score.
export type RecordedVote = { candidate_id: string; question: string; stance: "yes" | "no"; text: string; url: string };
export type RecordScore = { candidate_id: string; chamber: string; nominate_dim1: number; votes_scored: number; url: string };
const VOTES = recordsJson.votes as RecordedVote[];
const SCORES = recordsJson.scores as RecordScore[];
export const voteOf = (candidateId: string, questionId: string) =>
  VOTES.find((v) => v.candidate_id === candidateId && v.question === questionId);
export const scoreOf = (candidateId: string) => SCORES.find((s) => s.candidate_id === candidateId);
export const ALL_QUESTION_IDS = ALL.map((q) => q.id);

// CFscore (Bonica, DIME): where a candidate's past donors place them, about -2 to +2.
export type CfScore = { candidate_id: string; cfscore: number; cycle: number; seat: string };
const CFSCORES = recordsJson.cfscores as CfScore[];
export const cfOf = (candidateId: string) => CFSCORES.find((c) => c.candidate_id === candidateId);

// Left-right position estimated by Gemma 4 from a candidate's own published words, for
// candidates with no voting record and no CFscore (scripts/estimate-scores.mjs).
export type WordsEstimate = { candidate_id: string; x: number; low: number; high: number; why: string; passages: number };
const ESTIMATES = estimatesJson.estimates as WordsEstimate[];
export const estimateOf = (candidateId: string) => ESTIMATES.find((e) => e.candidate_id === candidateId);
export const ESTIMATE_CHECK = estimatesJson.check as { correctSide: number; of: number; averageMiss: number };

// Candidates we have collected any published words for.
export const hasRecord = (candidateId: string) =>
  STANCES.some((s) => s.candidate_id === candidateId) || CLOSEST.some((c) => c.candidate_id === candidateId);

// Candidates we can score: their own words, a voting record in Congress, or a donor score.
// A race is matched when at least one of its candidates has any of these.
export const hasEvidence = (candidateId: string) =>
  hasRecord(candidateId) ||
  VOTES.some((v) => v.candidate_id === candidateId) ||
  !!scoreOf(candidateId) ||
  !!cfOf(candidateId);
