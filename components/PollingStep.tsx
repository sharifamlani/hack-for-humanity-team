import { useState } from "react";
import { EARLY_VOTING_HOURS, dayNumber, todayNumber, weekdayDate, windowStatus } from "@/lib/dates";
import type { Answers, Placement } from "@/lib/match";
import type { LookupResult } from "@/lib/types";
import { ShareCard } from "./ShareCard";
import { VOTING_PLAN_FILE, buildVotingPlanPdf } from "@/lib/votingPlanPdf";

const directions = (lat: number, lon: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

const shortDate = (ms: number | null) =>
  ms == null
    ? "?"
    : new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
      });


// The early-voting window from the county's own dates; null when the dates are missing.
function earlyWindow(sites: LookupResult["earlyVoting"]) {
  const opens = sites.map((s) => s.opens).filter((n): n is number => n != null);
  const closes = sites.map((s) => s.closes).filter((n): n is number => n != null);
  if (!opens.length || !closes.length) return null;
  const first = Math.min(...opens);
  const last = Math.max(...closes);
  const today = todayNumber();
  return {
    first,
    last,
    status: windowStatus(today, dayNumber(first), dayNumber(last)),
    daysLeft: dayNumber(last) - today + 1, // counts today and the closing day
  };
}

// The numbered heading of each lane: "1 · Vote early", "2 · Vote on Election Day".
function LaneHead({ n, label, when }: { n: number; label: string; when: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-base font-black text-background">
        {n}
      </span>
      <div>
        <p className="eyebrow">{label}</p>
        <h2 className="display text-2xl lg:text-3xl">{when}</h2>
      </div>
    </div>
  );
}

export function PollingStep({
  result,
  answers,
  me,
  placing,
}: {
  result: LookupResult;
  answers: Answers;
  me: Placement | null;
  // True while Gemma 4 is still placing the voter; the PDF waits so it shows the final matches.
  placing: boolean;
}) {
  const { polling, earlyVoting } = result;
  const early = earlyWindow(earlyVoting);
  const [making, setMaking] = useState(false);
  const [failed, setFailed] = useState(false);
  // Tapped while Gemma 4 was still placing: the button turns into "Open my PDF" when it is done.
  // A second tap opens it, because phones block a download that a tap did not start.
  const [wanted, setWanted] = useState(false);

  // Built on the device (lib/votingPlanPdf.ts): the answers and address never leave it.
  async function takeToPolls() {
    if (placing) {
      setWanted(true);
      return;
    }
    setWanted(false);
    setMaking(true);
    setFailed(false);
    try {
      const doc = await buildVotingPlanPdf({ result, answers, me });
      doc.save(VOTING_PLAN_FILE);
    } catch {
      setFailed(true);
    } finally {
      setMaking(false);
    }
  }
  return (
    <main className="flex flex-1 flex-col gap-5">
      {result.savedExample && (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-sm font-semibold">
          Showing a saved example — live lookup unavailable.
        </p>
      )}

      <div>
        <h1 className="display text-5xl lg:text-6xl">Make your voting plan.</h1>
        <p className="mt-3 text-lg text-foreground/80">Two ways to vote. Pick one.</p>
      </div>

      {/* Early voting can be at ANY site in the county; Election Day only at your own precinct.
          Two lanes so the two places cannot be mistaken for each other. */}
      <div className="grid items-start gap-4 md:grid-cols-2">
        {early && (
          <section
            className={`rounded-2xl p-5 ${early.status === "after" ? "border border-foreground/20 opacity-60" : "border-2 border-accent bg-card"}`}
          >
            <LaneHead
              n={1}
              label="Vote early"
              when={
                early.status === "open"
                  ? `Now through ${weekdayDate(early.last)}`
                  : early.status === "before"
                    ? `Opens ${weekdayDate(early.first)}`
                    : `Ended ${weekdayDate(early.last)}`
              }
            />
            {early.status !== "after" && (
              <>
                {early.status === "open" && (
                  <p className="mt-4 font-bold text-accent">
                    ● Open today · {early.daysLeft === 1 ? "last day" : `${early.daysLeft} days left, including today`}
                  </p>
                )}
                <p className="mt-1 font-semibold">{EARLY_VOTING_HOURS}</p>
                <p className="mt-3">
                  <b>Any early-voting site in Miami-Dade works.</b> Closest to you:
                </p>
                <ul className="mt-1 divide-y divide-foreground/10">
                  {earlyVoting.map((site) => (
                    <li key={site.name} className="py-3">
                      <p className="font-bold leading-snug">{site.name}</p>
                      <p className="text-sm">
                        {site.address}
                        {site.city && `, ${site.city}`} · {site.miles.toFixed(1)} mi
                      </p>
                      <p className="text-sm text-foreground/70">
                        {shortDate(site.opens)} – {shortDate(site.closes)}
                        {site.accessible && " · ♿ accessible"}
                        {site.dropBox && " · mail-ballot drop box"}
                      </p>
                      <a
                        href={directions(site.lat, site.lon)}
                        target="_blank"
                        rel="noreferrer"
                        className="link-mint mt-1 inline-block text-sm"
                      >
                        Directions ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        <section className={`rounded-2xl border border-accent/40 bg-[#0c2a26] p-5 ${early ? "" : "md:col-span-2"}`}>
          <LaneHead n={early ? 2 : 1} label="Vote on Election Day" when="Tue, Nov 3" />
          {polling ? (
            <>
              <p className="mt-4 font-bold text-coral">Only at your precinct&apos;s polling place:</p>
              <h3 className="display mt-1 text-3xl">{polling.name}</h3>
              <p className="mt-2 text-lg">
                {polling.address}, {polling.city} {polling.zip}
              </p>
              <p className="text-foreground/70">Precinct {polling.precinct} · 7 AM – 7 PM</p>
              {polling.temporary && (
                <p className="mt-2 font-semibold text-coral">Temporary location for this election.</p>
              )}
              <p className="mt-3 text-sm text-foreground/80">Most likely; confirm with the county before you go.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={result.officialLookupUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  Confirm with the county ↗
                </a>
                <a href={directions(polling.lat, polling.lon)} target="_blank" rel="noreferrer" className="btn-ghost">
                  Get directions ↗
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-lg">
                We couldn&apos;t match this address to a precinct. Use the county&apos;s lookup.
              </p>
              <div className="mt-4">
                <a href={result.officialLookupUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  Confirm with the county ↗
                </a>
              </div>
            </>
          )}
        </section>
      </div>

      <p className="panel-purple px-5 py-4 font-semibold">
        Before you go: confirm your location · bring a photo ID with your signature · polls open 7 AM – 7 PM
      </p>

      <ShareCard />

      <p className="card px-4 py-3 text-sm">
        Locations and schedules can change. Verify all details with the Miami-Dade Supervisor of
        Elections.
      </p>

      <section className="flex flex-col gap-2">
        <button
          type="button"
          onClick={takeToPolls}
          disabled={making || (placing && wanted)}
          className={`btn-primary w-full text-lg ${placing && wanted ? "animate-pulse" : ""}`}
        >
          {making
            ? "Making your PDF…"
            : placing && wanted
              ? "Getting your matches ready…"
              : wanted
                ? "Open my PDF ↓"
                : "Take my choices to the polls ↓"}
        </button>
        {failed ? (
          <p className="text-sm font-semibold text-coral">Couldn&apos;t make the PDF. Try again.</p>
        ) : placing ? (
          <p className="text-sm text-foreground/70">
            Gemma 4 is finishing your matches; it takes about 25 seconds. Tap now and your PDF will be ready to open.
          </p>
        ) : (
          <p className="text-sm text-foreground/70">
            A one-page PDF of your matches and your voting plan. Made on your device; nothing is sent anywhere.
          </p>
        )}
      </section>
    </main>
  );
}
