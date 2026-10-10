import type { Candidate, LookupResult } from "@/lib/types";

function CandidateRow({ c }: { c: Candidate }) {
  const isMeasure = c.office_level === "ballot_measure";
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div>
        <p className="font-semibold leading-snug">{c.name}</p>
        {!isMeasure && (
          <p className="text-sm text-foreground/70">
            {c.party}
            {c.incumbent && " · incumbent"}
          </p>
        )}
      </div>
      <a
        href={c.source_url}
        target="_blank"
        rel="noreferrer"
        title={c.source_name}
        className="shrink-0 rounded-full border border-foreground/20 px-2.5 py-1 text-xs font-semibold"
      >
        source ↗
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
        <p className="rounded-xl bg-jobs/30 px-3 py-2 text-sm font-semibold">
          Showing a saved example — live lookup unavailable.
        </p>
      )}

      <section className="rounded-3xl border-2 border-foreground bg-card p-5">
        {result.districtChanged ? (
          <>
            <p className="text-xs font-black uppercase tracking-widest text-accent">
              ⚠ Your district changed in 2026
            </p>
            <p className="mt-3 text-sm text-foreground/70">Represented now by</p>
            <p className="text-xl font-black">
              {result.currentRep ?? "Your current member"}, FL-{result.oldDistrict}
              <span className="ml-2 text-xs font-semibold text-foreground/50">old map</span>
            </p>
            <p className="mt-3 text-sm text-foreground/70">On Tuesday, Nov 3 you vote in</p>
            <p className="text-xl font-black">
              FL-{geo.congressional}
              <span className="ml-2 text-xs font-semibold text-foreground/50">new map</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground/70">On Tuesday, Nov 3 you vote in</p>
            <p className="text-2xl font-black">FL-{geo.congressional}</p>
            {result.currentRep && (
              <p className="mt-1 text-sm">Represented now by {result.currentRep}</p>
            )}
          </>
        )}
        <p className="mt-3 text-sm text-foreground/70">
          State Senate {geo.stateSenate} · State House {geo.stateHouse}
          {geo.city && ` · ${geo.city}`}
        </p>
        {geo.matchedAddress && (
          <p className="mt-1 text-xs text-foreground/50">{geo.matchedAddress}</p>
        )}
      </section>

      <h2 className="text-xs font-black uppercase tracking-widest">Who&apos;s on your ballot</h2>

      {result.ballot.map((section, i) => (
        <details key={section.section} open={i === 0} className="rounded-3xl bg-card px-5 py-4">
          <summary className="cursor-pointer text-lg font-black">
            {section.section}
            <span className="ml-2 text-sm font-semibold text-foreground/50">
              {section.races.length} {section.races.length === 1 ? "contest" : "contests"}
            </span>
          </summary>
          {section.races.map((race) => (
            <div key={race.office} className="mt-4">
              <h3 className="text-sm font-bold text-accent">{race.office}</h3>
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
          Not shown yet: {result.notPlaced.join(" and ")} races. We can&apos;t match those
          districts to an address yet —{" "}
          <a className="underline" href={result.officialLookupUrl} target="_blank" rel="noreferrer">
            check the county&apos;s site
          </a>
          .
        </p>
      )}

      <button
        type="button"
        onClick={onNext}
        className="rounded-2xl bg-accent px-4 py-4 text-lg font-bold text-white shadow-[0_4px_0_0_var(--foreground)] active:translate-y-1 active:shadow-none"
      >
        See where you stand ▶
      </button>
      <button
        type="button"
        onClick={onSkipToPolling}
        className="rounded-2xl border-2 border-foreground px-4 py-3 font-bold"
      >
        Skip to my polling place
      </button>
    </main>
  );
}
