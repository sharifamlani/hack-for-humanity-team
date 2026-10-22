// Calendar-day math in Miami time. Everything is computed at render time, so the screens
// stay right tomorrow and flip to "closed" by themselves.

const ZONE = "America/New_York";
const MS_PER_DAY = 86_400_000;

// en-CA formats as YYYY-MM-DD.
const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// A whole-day counter (days since 1970-01-01) for the Miami calendar date of an instant.
export function dayNumber(ms: number): number {
  const [y, m, d] = ymd.format(ms).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

// Today's Miami calendar date, as the same counter.
export function todayNumber(): number {
  return dayNumber(Date.now());
}

// The same counter for a plain "YYYY-MM-DD" calendar date.
export function dayNumberOfIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

// "Sun, Nov 1" — the Miami calendar date of an instant.
export function weekdayDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: ZONE,
  });
}

export type Window = "before" | "open" | "after";

// Where today falls against an inclusive first..last day range.
export function windowStatus(today: number, first: number, last: number): Window {
  return today < first ? "before" : today > last ? "after" : "open";
}

// The county feed has no usable hours; these are from the Supervisor of Elections' published
// early-voting schedule for Nov 3, 2026 (docs/qa-polling-2026-10-22.md): every site, every day.
export const EARLY_VOTING_HOURS = "Open 7 AM – 7 PM every day.";
