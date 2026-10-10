// Places a person on the same left-right scale as Congress, from their yes/no answers
// on real House votes (bridging design: Bafumi & Herron 2010; Jessee 2009).
//
// Each vote has a published cutpoint on Voteview's first DW-NOMINATE dimension. A "yes"
// from someone at position theta is modelled as
//     P(yes) = logistic(SLOPE * yeaDirection * (theta - cutpoint))
// The cutpoints are fixed, so the position is a one-dimensional grid search — no sampler.
// Plain arithmetic only: no model call is involved in the score.

export type ScaleItem = { roll: number; cutpoint: number; yeaDirection: number };
export type Answer = "yea" | "nay";
export type Position = { theta: number; low: number; high: number; answered: number };

const SLOPE = 7; // how sharply a vote separates the two sides; fixed, not estimated
const PRIOR_SD = 0.45; // weak pull toward the centre so a few answers cannot pin someone at ±1
const GRID = Array.from({ length: 201 }, (_, i) => -1 + i * 0.01);

export function estimatePosition(
  items: ScaleItem[],
  answers: Record<number, Answer | null | undefined>,
): Position | null {
  const used = items.filter((i) => answers[i.roll] === "yea" || answers[i.roll] === "nay");
  if (used.length === 0) return null;

  const logPost = GRID.map((theta) => {
    let lp = -(theta * theta) / (2 * PRIOR_SD * PRIOR_SD);
    for (const item of used) {
      const z = SLOPE * item.yeaDirection * (theta - item.cutpoint);
      const pYea = 1 / (1 + Math.exp(-z));
      lp += Math.log(answers[item.roll] === "yea" ? pYea : 1 - pYea);
    }
    return lp;
  });

  const max = Math.max(...logPost);
  const weights = logPost.map((lp) => Math.exp(lp - max));
  const total = weights.reduce((a, b) => a + b, 0);

  // Posterior mean as the point; the middle 80% as the "how sure we are" band.
  let mean = 0;
  let cumulative = 0;
  let low = GRID[0];
  let high = GRID[GRID.length - 1];
  let lowSet = false;
  for (let i = 0; i < GRID.length; i++) {
    const p = weights[i] / total;
    mean += GRID[i] * p;
    cumulative += p;
    if (!lowSet && cumulative >= 0.1) {
      low = GRID[i];
      lowSet = true;
    }
    if (cumulative >= 0.9) {
      high = GRID[i];
      break;
    }
  }
  // The loop may stop early at the 90% mark, so finish the mean over the rest of the grid.
  mean = GRID.reduce((sum, theta, i) => sum + (theta * weights[i]) / total, 0);
  return { theta: mean, low, high, answered: used.length };
}

// Share of the votes both sides took a position on where they landed the same way.
export function agreement(
  items: ScaleItem[],
  mine: Record<number, Answer | null | undefined>,
  theirs: Record<number, Answer | null | undefined>,
) {
  const both = items.filter((i) => mine[i.roll] && theirs[i.roll]);
  const same = both.filter((i) => mine[i.roll] === theirs[i.roll]);
  return { same: same.length, of: both.length };
}
