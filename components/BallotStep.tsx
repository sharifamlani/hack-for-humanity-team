import type { Candidate, LookupResult } from "@/lib/types";

function CandidateRow({ c }: { c: Candidate }) {
  const isMeasure = c.office_level === "ballot_measure";
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[1.1fr_1fr_auto]">
      <p className="text-lg font-semibold leading-snug">{c.name}</p>
      {!isMeasure ? (
        <p className="text-foreground/70">
          {c.party}
          {c.incumbent && " · incumbent"}
        </p>
      ) : (
        <span className="hidden sm:block" />
      )}
      <a
        href={c.source_url}
        target="_blank"
        rel="noreferrer"
        title={c.source_name}
        className="row-span-1 shrink-0 rounded-full border border-foreground/40 px-3 py-1 text-sm"
      >
        Source ↗
      </a>
    </li>
  );
}

export function BallotStep({
  result,
  onNext,
  onSkipToPolling,
}: {
  result: LookupResult;
  onNext: () => void;
  onSkipToPolling: () => void;
}) {
  const { geo } = result;
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
          Get to know the races and candidates in your community.
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr]">
        <section className="panel-purple p-6">
          <p className="eyebrow">Your address</p>
          <p className="display mt-1 text-2xl">{geo.city || "Miami-Dade"}</p>

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
            {geo.matchedAddress && (
              <p className="mt-1 text-xs text-foreground/70">{geo.matchedAddress}</p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3">
          {result.ballot.map((section, i) => (
            <details key={section.section} open={i === 0} className="card px-5 py-4">
              <summary className="cursor-pointer">
                <span className="display text-2xl">{section.section}</span>
                <span className="ml-3 text-sm text-foreground/60">
                  {section.races.length} {section.races.length === 1 ? "contest" : "contests"}
                </span>
              </summary>
              {section.races.map((race) => (
                <div key={race.office} className="mt-4">
                  <h3 className="font-bold text-coral">{race.office}</h3>
                  <ul className="divide-y divide-foreground/10">
                    {race.candidates.map((c) => (
                      <CandidateRow key={c.candidate_id} c={c} />
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          ))}

          {result.notPlaced.length > 0 && (
            <p className="text-sm text-foreground/70">
              ⓘ Not shown yet: {result.notPlaced.join(" and ")} races. We can&apos;t match those
              districts to an address yet —{" "}
              <a className="link-mint underline" href={result.officialLookupUrl} target="_blank" rel="noreferrer">
                check the county&apos;s site
              </a>
              .
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-5">
            <button type="button" onClick={onNext} className="btn-primary">
              Explore your priorities →
            </button>
            <button type="button" onClick={onSkipToPolling} className="link-mint underline">
              Skip to voting plan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
