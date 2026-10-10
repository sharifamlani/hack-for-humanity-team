import type { LookupResult } from "@/lib/types";

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

function StreetGrid() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 150"
      preserveAspectRatio="xMidYMid slice"
      className="block h-[150px] w-full bg-[#0f3a35]"
    >
      <g stroke="white" strokeOpacity="0.2" strokeWidth="1.5" fill="none">
        <line x1="-20" y1="150" x2="260" y2="-10" />
        <line x1="80" y1="170" x2="420" y2="-10" />
        <line x1="260" y1="170" x2="620" y2="10" />
        <line x1="-20" y1="40" x2="620" y2="110" />
        <line x1="-20" y1="110" x2="620" y2="30" />
        <line x1="440" y1="170" x2="640" y2="60" />
      </g>
      <path
        d="M300 112 C282 88 272 76 272 62 a28 28 0 1 1 56 0 c0 14 -10 26 -28 50 z"
        fill="#5eead4"
      />
      <circle cx="300" cy="62" r="10" fill="#0f3a35" />
    </svg>
  );
}

export function PollingStep({ result }: { result: LookupResult }) {
  const { polling, earlyVoting } = result;
  return (
    <main className="flex flex-1 flex-col gap-5">
      {result.savedExample && (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-sm font-semibold">
          Showing a saved example — live lookup unavailable.
        </p>
      )}

      <div>
        <h1 className="display text-5xl lg:text-6xl">Make your voting plan.</h1>
        <p className="mt-3 text-lg text-foreground/80">Your next step, clearly laid out.</p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-accent/40 bg-[#0c2a26]">
          <StreetGrid />
          <div className="p-6">
            <p className="eyebrow text-coral">
              Your polling place (most likely) · Confirm before you go
            </p>
            {polling ? (
              <>
                <h2 className="display mt-2 text-3xl lg:text-4xl">{polling.name}</h2>
                <p className="mt-2 text-lg">
                  {polling.address}, {polling.city} {polling.zip}
                </p>
                <p className="text-foreground/70">Precinct {polling.precinct}</p>
                <p className="mt-3 font-semibold">Election Day · Tuesday, Nov 3, 2026</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={result.officialLookupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    Confirm with the county ↗
                  </a>
                  <a
                    href={directions(polling.lat, polling.lon)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                  >
                    Get directions ↗
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg">
                  We couldn&apos;t match this address to a precinct. Use the county&apos;s lookup below.
                </p>
                <div className="mt-5">
                  <a
                    href={result.officialLookupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    Confirm with the county ↗
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {earlyVoting.length > 0 && (
            <section className="card p-5">
              <h2 className="display text-2xl">Early voting nearby</h2>
              <ul className="mt-2 divide-y divide-foreground/10">
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
            </section>
          )}

          <section className="panel-purple p-5">
            <h2 className="display text-2xl">Before you go</h2>
            <ul className="mt-3 space-y-3">
              {[
                "Confirm your assigned location",
                "Check current voting hours",
                "Bring a photo ID with your signature",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-background">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <p className="card px-4 py-3 text-sm">
        Locations and schedules can change. Verify all details with the Miami-Dade Supervisor of
        Elections.
      </p>
    </main>
  );
}
