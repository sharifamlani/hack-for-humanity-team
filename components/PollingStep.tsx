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

export function PollingStep({ result }: { result: LookupResult }) {
  const { polling, earlyVoting } = result;
  return (
    <main className="flex flex-1 flex-col gap-5">
      {result.savedExample && (
        <p className="rounded-xl bg-jobs/30 px-3 py-2 text-sm font-semibold">
          Showing a saved example — live lookup unavailable.
        </p>
      )}

      <section className="rounded-3xl border-2 border-foreground bg-card p-5">
        <p className="text-xs font-black uppercase tracking-widest text-accent">
          📍 Your polling place (most likely)
        </p>
        {polling ? (
          <>
            <h2 className="mt-2 text-2xl font-black leading-tight">{polling.name}</h2>
            <p className="mt-1">
              {polling.address}, {polling.city} {polling.zip}
            </p>
            <p className="text-sm text-foreground/70">Precinct {polling.precinct}</p>
            <p className="mt-3 font-semibold">Election Day: Tuesday, Nov 3, 2026</p>
            <a
              href={directions(polling.lat, polling.lon)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-2xl bg-accent px-4 py-4 text-center text-lg font-bold text-white shadow-[0_4px_0_0_var(--foreground)]"
            >
              Get directions ▶
            </a>
          </>
        ) : (
          <p className="mt-2">
            We couldn&apos;t match this address to a precinct. Use the county&apos;s lookup below.
          </p>
        )}
        <a
          href={result.officialLookupUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-2xl border-2 border-foreground px-4 py-3 text-center font-bold"
        >
          Confirm on the county&apos;s site ↗
        </a>
        <p className="mt-3 text-xs text-foreground/60">
          From Miami-Dade County open data. Precincts can move — always confirm with the
          Supervisor of Elections before you go.
        </p>
      </section>

      {earlyVoting.length > 0 && (
        <section className="rounded-3xl bg-card p-5">
          <p className="text-xs font-black uppercase tracking-widest">Early voting near you</p>
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
                  className="mt-1 inline-block text-sm font-semibold underline"
                >
                  Directions ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
