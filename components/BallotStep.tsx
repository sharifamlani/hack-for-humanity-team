import type { ReactNode } from "react";
import { matchScore, type Answers, type Placement } from "@/lib/match";
import { hasEvidence } from "@/lib/questions";
import type { Candidate, LookupResult } from "@/lib/types";

type Race = LookupResult["ballot"][number]["races"][number];

const partyStyle = (party: string) =>
  party.startsWith("Rep")
    ? "bg-coral text-background"
    : party.startsWith("Dem")
      ? "bg-sky text-background"
      : "bg-foreground/20";

// One contest: party, name, and how closely each candidate matches what the voter said.
function RaceBlock({
  race,
  answers,
  me,
  onRace,
  open,
  evidence,
}: {
  race: Race;
  answers: Answers;
  me: Placement | null;
  onRace: (office: string) => void;
  open: boolean;
  evidence: (office: string) => ReactNode;
}) {
  // Only races where a candidate has published words or a voting record can be scored.
  const scored = race.candidates.some((c) => hasEvidence(c.candidate_id));
  const scores = new Map(
    race.candidates.map((c) => [c.candidate_id, scored ? matchScore(answers, c.candidate_id, c.party, me) : null]),
  );
  const ranked = race.candidates
    .filter((c) => scores.get(c.candidate_id))
    .sort((a, b) => scores.get(b.candidate_id)!.score - scores.get(a.candidate_id)!.score);
  // Within three points is a coin flip, not a match.
  const tie =
    ranked.length > 1 && scores.get(ranked[0].candidate_id)!.score - scores.get(ranked[1].candidate_id)!.score < 0.03;
  const best = tie ? null : ranked[0];

  return (
    <div className="mt-4">
      {scored ? (
        <button
          type="button"
          onClick={() => onRace(race.office)}
          className="flex w-full items-baseline justify-between gap-3 text-left font-bold text-coral hover:text-accent"
        >
          <span>{race.office}</span>
          <span className="shrink-0 text-sm text-accent">{open ? "Hide the evidence ↑" : "See the evidence ↓"}</span>
        </button>
      ) : (
        <h3 className="font-bold text-coral">{race.office}</h3>
      )}
      <ul className="divide-y divide-foreground/10">
        {race.candidates.map((c: Candidate) => {
          const m = scores.get(c.candidate_id);
          const isBest = best?.candidate_id === c.candidate_id;
          const isMeasure = c.office_level === "ballot_measure";
          return (
            <li key={c.candidate_id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              {!isMeasure && (
                <span className={`w-28 shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-bold ${partyStyle(c.party)}`}>
                  {c.party.replace(" Affiliation", "")}
                </span>
              )}
              <p className={`min-w-0 flex-1 text-lg leading-snug ${isBest ? "font-black" : "font-semibold"}`}>
                {c.name}
                {c.incumbent && <span className="ml-2 text-sm font-normal text-foreground/60">incumbent</span>}
              </p>
              {/* The candidate's own campaign site when we have it; otherwise the official
                  listing that puts them on the ballot. */}
              <a
                href={c.campaign_url || c.source_url}
                target="_blank"
                rel="noreferrer"
                title={c.campaign_url ? `${c.name}'s campaign website` : c.source_name}
                className="shrink-0 rounded-full border border-foreground/30 px-3 py-1 text-sm text-foreground/80 hover:border-accent hover:text-accent"
              >
                {c.campaign_url ? "Campaign site ↗" : isMeasure ? "Source ↗" : "Official listing ↗"}
              </a>
              {m && (
                <span
                  className={`w-32 shrink-0 rounded-full px-3 py-1 text-center text-sm font-black ${
                    isBest ? "bg-accent text-background" : "border border-foreground/25 text-foreground/70"
                  }`}
                >
                  {isBest && "★ "}
                  {Math.round(m.score * 100)}% match
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {scored && open && evidence(race.office)}
      {scored && tie && !open && <p className="text-sm text-foreground/60">Too close to call between the top two.</p>}
    </div>
  );
}

export function BallotStep({
  result,
  answers,
  me,
  placing,
  onRace,
  openRace,
  evidence,
  onNext,
}: {
  result: LookupResult;
  answers: Answers;
  me: Placement | null;
  // True while Gemma 4 is still placing the voter; the percentages settle when it finishes.
  placing: boolean;
  onRace: (office: string) => void;
  // The race whose evidence is dropped open, and how to draw it.
  openRace: string | null;
  evidence: (office: string) => ReactNode;
  onNext: () => void;
}) {
  const { geo } = result;
  // The address as the geocoder matched it: street on one line, city, state and ZIP on the next.
  const [street, ...tail] = (geo.matchedAddress ?? "").split(",").map((part) => part.trim());
  const rest = tail.join(", ");
  const answered = Object.values(answers).some((a) => a === "yea" || a === "nay");
  return (
    <main className="flex flex-1 flex-col gap-5">
      {result.savedExample && (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-sm font-semibold">
          Showing a saved example — live lookup unavailable.
        </p>
      )}

      <div>
        <h1 className="display text-5xl lg:text-6xl">Your ballot.</h1>
        <p className="mt-3 text-lg text-foreground/80">
          {answered
            ? "Your closest match in each race, from what you told us. Tap a race to open the evidence."
            : "Everyone on your ballot. Tap a race to see what the candidates have said."}
          {placing && <span className="ml-2 animate-pulse text-sm text-accent">⚡ Gemma 4 is refining your matches…</span>}
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        <section className="panel-purple p-6">
          <p className="eyebrow">Your address</p>
          <p className="display mt-1 text-2xl">{street || geo.city || "Miami-Dade"}</p>
          {street && rest && <p className="mt-1 text-sm text-foreground/80">{rest}</p>}

          <div className="mt-4 border-t border-white/25 pt-4">
            <p className="text-sm text-foreground/80">Represented now by</p>
            <p className="font-bold">
              {result.currentRep ?? "Your current member"} · FL-
              {result.districtChanged ? result.oldDistrict : geo.congressional}
            </p>
            {result.districtChanged && (
              <p className="mt-2 inline-block rounded-full bg-coral px-3 py-1 text-sm font-bold text-background">
                ⚠ Your district changed in 2026
              </p>
            )}
          </div>

          <div className="mt-4 border-t border-white/25 pt-4">
            <p className="text-sm text-foreground/80">Upcoming ballot</p>
            <p className="text-2xl font-black">FL-{geo.congressional}</p>
            <p className="mt-1 text-sm text-foreground/80">
              On Tuesday, Nov 3 you vote in this {result.districtChanged ? "new " : ""}district.
            </p>
          </div>

          <div className="mt-4 border-t border-white/25 pt-4">
            <p className="text-sm">
              State Senate {geo.stateSenate} · State House {geo.stateHouse}
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          {result.ballot.map((section, i) => (
            <details
              key={section.section}
              open={i === 0 || section.races.some((r) => r.candidates.some((c) => hasEvidence(c.candidate_id)))}
              className="card px-5 py-4"
            >
              <summary className="cursor-pointer">
                <span className="display text-2xl">{section.section}</span>
                <span className="ml-3 text-sm text-foreground/60">
                  {section.races.length} {section.races.length === 1 ? "contest" : "contests"}
                </span>
              </summary>
              {section.races.map((race) => (
                <RaceBlock key={race.office} race={race} answers={answers} me={me} onRace={onRace} open={openRace === race.office} evidence={evidence} />
              ))}
            </details>
          ))}

          <p className="text-sm text-foreground/70">
            ⓘ A match, not an endorsement. Races without a percentage are not scored yet.
            {result.notPlaced.length > 0 && (
              <>
                {" "}
                Not shown: {result.notPlaced.join(" and ")} races —{" "}
                <a className="link-mint underline" href={result.officialLookupUrl} target="_blank" rel="noreferrer">
                  check the county&apos;s site
                </a>
                .
              </>
            )}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-5">
            <button type="button" onClick={onNext} className="btn-primary text-lg">
              Build my voting plan →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
