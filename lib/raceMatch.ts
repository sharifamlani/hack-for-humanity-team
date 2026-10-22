import { STAR_MIN_POSITIONS, matchScore, ownPositions, type Answers, type MatchScore, type Placement } from "./match";
import { hasEvidence } from "./questions";
import type { BallotRace, Candidate } from "./types";

export type RaceMatch = {
  // Only races where a candidate has published words or a voting record can be scored.
  scored: boolean;
  scores: Map<string, MatchScore | null>;
  // Scored candidates, closest first.
  ranked: Candidate[];
  // The top two are within three points: a coin flip, not a match.
  tie: boolean;
  best: Candidate | null;
  // How many of the voter's answered questions the best match's position rests on (votes or own words).
  bestPositions: number;
  // A closest match on fewer than STAR_MIN_POSITIONS positions is named but not starred.
  thin: boolean;
  // Scored candidates first, in ballot order, so rows stay put when the percentages settle.
  rows: Candidate[];
};

// The per-race result, shared by the ballot screen and the take-to-the-polls PDF so the two
// can never disagree. Plain arithmetic from lib/match.ts; no model picks anyone.
export function matchRace(race: BallotRace, answers: Answers, me: Placement | null): RaceMatch {
  const scored = race.candidates.some((c) => hasEvidence(c.candidate_id));
  const scores = new Map(
    race.candidates.map((c) => [c.candidate_id, scored ? matchScore(answers, c.candidate_id, c.party, me) : null]),
  );
  const ranked = race.candidates
    .filter((c) => scores.get(c.candidate_id))
    .sort((a, b) => scores.get(b.candidate_id)!.score - scores.get(a.candidate_id)!.score);
  const tie =
    ranked.length > 1 && scores.get(ranked[0].candidate_id)!.score - scores.get(ranked[1].candidate_id)!.score < 0.03;
  const best = tie ? null : (ranked[0] ?? null);
  const bestPositions = best ? ownPositions(answers, best.candidate_id, best.party) : 0;
  const thin = !!best && bestPositions < STAR_MIN_POSITIONS;
  const rows = [
    ...race.candidates.filter((c) => scores.get(c.candidate_id)),
    ...race.candidates.filter((c) => !scores.get(c.candidate_id)),
  ];
  return { scored, scores, ranked, tie, best, bestPositions, thin, rows };
}
