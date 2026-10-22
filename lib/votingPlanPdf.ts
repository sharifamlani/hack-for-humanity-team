import { EARLY_VOTING_HOURS, dayNumber, todayNumber, weekdayDate, windowStatus } from "./dates";
import type { Answers, Placement } from "./match";
import { matchRace } from "./raceMatch";
import type { Candidate, LookupResult } from "./types";

// The take-to-the-polls sheet: one half-letter page (5.5 x 8.5 in) built in the browser, so
// the voter's answers and address never leave the device. On a phone the page shows at about
// one point per pixel, so the 11 pt names read like 11 px text; it prints on Letter fitted.
// It says "closest match", never "vote for": the same match, label and caveat as the screen.

type JsPdf = InstanceType<(typeof import("jspdf"))["jsPDF"]>;
type Rgb = [number, number, number];
type Marker = "match" | "thin" | "tie";
type Line = {
  text: string;
  size: number;
  bold?: boolean;
  color?: Rgb;
  indent?: number;
  gap?: number; // space above, in points
  marker?: Marker;
  rule?: boolean; // a thin divider instead of text
  oneLine?: boolean; // cut to one line with an ellipsis instead of wrapping
};

const PAGE_W = 396; // 5.5 in
const PAGE_H = 612; // 8.5 in
const MARGIN = 28;
const FOOTER_H = 58;
const LEADING = 1.28;
const INK: Rgb = [17, 17, 17];
const MUTED: Rgb = [90, 90, 90];
const MINT: Rgb = [14, 138, 104]; // the app's mint, darkened so it holds up on white paper
const CORAL: Rgb = [200, 70, 55];
const ELECTION_DAY = "Tue, Nov 3, 2026";

// The built-in Helvetica only covers Latin-1 plus a few typographic marks.
const clean = (s: string) =>
  s.replace(/[^\x20-\xFF–—‘’“”•…]/g, "").replace(/\s+/g, " ").trim();

const PARTY: Record<string, string> = {
  Republican: "REP",
  Democratic: "DEM",
  "No Party Affiliation": "NPA",
  "No Party": "NPA",
  Libertarian: "LPF",
};
const party = (c: Candidate) => PARTY[c.party] ?? c.party.slice(0, 3).toUpperCase();
const pct = (score: number | undefined) => (score == null ? "" : ` · ${Math.round(score * 100)}%`);
// "Amendment 1: Budget Stabilization Fund (HJR 5019)" -> "Amendment 1: Budget Stabilization Fund"
const shortMeasure = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, "");

export type VotingPlanInput = { result: LookupResult; answers: Answers; me: Placement | null };

function contentLines({ result, answers, me }: VotingPlanInput, collapse: boolean): Line[] {
  const { geo, polling, earlyVoting } = result;
  const lines: Line[] = [];
  const add = (l: Line) => lines.push({ ...l, text: clean(l.text) });

  add({ text: geo.matchedAddress ?? geo.city ?? "Miami-Dade", size: 10, bold: true, gap: 4 });
  add({
    text: `FL-${geo.congressional}${result.districtChanged ? ` (new map; was FL-${result.oldDistrict})` : ""} · State Senate ${geo.stateSenate} · State House ${geo.stateHouse}`,
    size: 8.5,
    color: MUTED,
  });

  add({ text: "WHERE YOU VOTE (most likely; confirm with the county)", size: 7.5, bold: true, color: MINT, gap: 9 });
  if (polling) {
    add({ text: polling.name, size: 11, bold: true, gap: 2 });
    add({ text: `${polling.address}, ${polling.city} ${polling.zip} · Precinct ${polling.precinct}`, size: 8.5 });
    if (polling.temporary) add({ text: "Temporary location for this election.", size: 8.5, bold: true, color: CORAL });
    add({ text: `Election Day, ${ELECTION_DAY} · 7 AM – 7 PM`, size: 8.5 });
  } else {
    add({ text: "Find your polling place at votemiamidade.gov", size: 9, gap: 2 });
  }

  const opens = earlyVoting.map((s) => s.opens).filter((n): n is number => n != null);
  const closes = earlyVoting.map((s) => s.closes).filter((n): n is number => n != null);
  if (opens.length && closes.length && earlyVoting[0]) {
    const first = Math.min(...opens);
    const last = Math.max(...closes);
    if (windowStatus(todayNumber(), dayNumber(first), dayNumber(last)) !== "after") {
      add({ text: "EARLY VOTING", size: 7.5, bold: true, color: MINT, gap: 7 });
      add({ text: `${weekdayDate(first)} – ${weekdayDate(last)} · ${EARLY_VOTING_HOURS}`, size: 8.5, gap: 2 });
      const near = earlyVoting[0];
      add({ text: `Nearest: ${near.name}, ${near.address}`, size: 8.5 });
    }
  }

  add({ text: "", size: 0, rule: true, gap: 9 });
  add({ text: "YOUR CLOSEST MATCH IN EACH RACE", size: 9, bold: true, gap: 8 });
  const answered = Object.values(answers).some((a) => a === "yea" || a === "nay");
  if (!answered) {
    add({ text: "You skipped the questions, so no race is scored. Every race is your call.", size: 8.5, color: MUTED, gap: 2 });
  }

  for (const section of result.ballot) {
    add({ text: section.section.toUpperCase(), size: 7.5, bold: true, color: MINT, gap: 8 });
    if (section.section === "Ballot questions") {
      add({ text: "Your call, not scored. Read each one on the official sample ballot.", size: 8.5, color: MUTED, gap: 2 });
      const titles = section.races.flatMap((r) => r.candidates.map((c) => shortMeasure(c.name)));
      if (collapse) add({ text: titles.join(" · "), size: 8, indent: 8, oneLine: true });
      else titles.forEach((t) => add({ text: t, size: 8, indent: 8, oneLine: true }));
      continue;
    }
    for (const race of section.races) {
      add({ text: race.office, size: 9, bold: true, indent: 6, gap: 4 });
      const m = matchRace(race, answers, me);
      if (m.best) {
        const score = m.scores.get(m.best.candidate_id)?.score;
        add({
          text: `${m.best.name} (${party(m.best)})${pct(score)}${m.thin ? ` · thin evidence (${m.bestPositions})` : ""}`,
          size: 11,
          bold: !m.thin,
          indent: 18,
          marker: m.thin ? "thin" : "match",
          gap: 1,
        });
      } else if (m.tie && m.ranked.length > 1) {
        const [a, b] = m.ranked;
        add({ text: `Too close to call: ${a.name} (${party(a)}) / ${b.name} (${party(b)})`, size: 10, indent: 18, marker: "tie", gap: 1 });
      } else {
        const names = race.candidates.map((c) => `${c.name} (${party(c)})`).join(", ");
        add({ text: `Your call, not scored: ${names}`, size: 8.5, color: MUTED, indent: 18, gap: 1, oneLine: collapse });
      }
    }
  }

  if (result.unopposed?.length) {
    add({ text: "NOT ON YOUR BALLOT", size: 7.5, bold: true, color: MINT, gap: 8 });
    result.unopposed.forEach((u) =>
      add({ text: `${u.office}: filled unopposed (${u.name})`, size: 8.5, color: MUTED, indent: 6, gap: 2 }),
    );
  }
  return lines;
}

function setType(doc: JsPdf, l: Line, k: number) {
  doc.setFont("helvetica", l.bold ? "bold" : "normal");
  doc.setFontSize(l.size * k);
}

const MARK_W = 12; // room left of a marked line for its dot

function wrap(doc: JsPdf, l: Line, k: number): string[] {
  setType(doc, l, k);
  const width = PAGE_W - 2 * MARGIN - (l.indent ?? 0) * k;
  const parts: string[] = doc.splitTextToSize(l.text, width);
  if (!l.oneLine || parts.length <= 1) return parts;
  // One line only: trim the first line until it fits with an ellipsis.
  let first = parts[0];
  while (first.length > 1 && doc.getTextWidth(`${first}…`) > width) first = first.slice(0, -1);
  return [`${first.trimEnd()}…`];
}

function lineHeight(doc: JsPdf, l: Line, k: number) {
  if (l.rule) return (l.gap ?? 0) * k + 1;
  return (l.gap ?? 0) * k + wrap(doc, l, k).length * l.size * k * LEADING;
}

function drawMarker(doc: JsPdf, marker: Marker, x: number, y: number, size: number) {
  const r = size * 0.24;
  const cy = y - size * 0.33;
  doc.setLineWidth(1);
  if (marker === "match") {
    doc.setFillColor(...MINT);
    doc.circle(x + r, cy, r, "F");
  } else if (marker === "thin") {
    doc.setDrawColor(...MINT);
    doc.circle(x + r, cy, r, "S");
  } else {
    doc.setTextColor(...MINT);
    doc.setFont("helvetica", "bold");
    doc.text("=", x, y);
  }
}

function drawLines(doc: JsPdf, lines: Line[], k: number, top: number, bottom: number) {
  let y = top;
  for (const l of lines) {
    if (l.rule) {
      y += (l.gap ?? 0) * k;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 1;
      continue;
    }
    const parts = wrap(doc, l, k);
    const step = l.size * k * LEADING;
    y += (l.gap ?? 0) * k;
    if (y + parts.length * step > bottom) {
      // Last resort: never spill onto a second page.
      setType(doc, { text: "", size: 8 }, 1);
      doc.setTextColor(...MUTED);
      doc.text("More races on your official sample ballot.", MARGIN, Math.min(y + 8, bottom));
      return;
    }
    const x = MARGIN + (l.indent ?? 0) * k;
    parts.forEach((p, i) => {
      const baseline = y + (i + 1) * step - step * 0.22;
      if (i === 0 && l.marker) drawMarker(doc, l.marker, x - MARK_W * k, baseline, l.size * k);
      setType(doc, l, k);
      doc.setTextColor(...(l.color ?? INK));
      doc.text(p, x, baseline);
    });
    y += parts.length * step;
  }
}

function drawHeader(doc: JsPdf): number {
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Your Ballot.", MARGIN, MARGIN + 8);
  const w = doc.getTextWidth("Your Ballot. ");
  doc.setTextColor(...MINT);
  doc.text("Your Block.", MARGIN + w, MARGIN + 8);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("ELECTION DAY", PAGE_W - MARGIN, MARGIN + 3, { align: "right" });
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(ELECTION_DAY, PAGE_W - MARGIN, MARGIN + 14, { align: "right" });
  doc.setFontSize(18);
  doc.text("Take this to the polls", MARGIN, MARGIN + 34);
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, MARGIN + 42, PAGE_W - MARGIN, MARGIN + 42);
  return MARGIN + 44;
}

function drawFooter(doc: JsPdf, now: Date) {
  const top = PAGE_H - MARGIN - FOOTER_H + 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, top, PAGE_W - MARGIN, top);
  let x = MARGIN;
  const y = top + 13;
  const legend: [Marker, string][] = [
    ["match", "Closest match, on 4+ of their own words or votes"],
    ["thin", "Closest, thin evidence"],
    ["tie", "Within 3 points"],
  ];
  doc.setFontSize(7);
  for (const [marker, label] of legend) {
    drawMarker(doc, marker, x, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(label, x + 9, y);
    x += 9 + doc.getTextWidth(label) + 10;
  }
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("A match, not an endorsement. The choice is yours.", MARGIN, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  const made = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
  doc.text(`From your answers on ${made} · made on your device, nothing stored · yourballotyourblock.com`, MARGIN, y + 25);
  doc.text("Print it, or keep it on your phone.", MARGIN, y + 34);
}

// Builds the page, shrinking type step by step until everything fits on one page.
export async function buildVotingPlanPdf(input: VotingPlanInput, now = new Date()): Promise<JsPdf> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: [PAGE_W, PAGE_H], orientation: "portrait" });
  doc.setProperties({ title: "Your Ballot. Your Block. — take this to the polls", creator: "yourballotyourblock.com" });

  const top = drawHeader(doc);
  const bottom = PAGE_H - MARGIN - FOOTER_H;
  const room = bottom - top;
  let chosen: { lines: Line[]; k: number } | null = null;
  for (const collapse of [false, true]) {
    const lines = contentLines(input, collapse);
    for (const k of [1, 0.94, 0.88, 0.82, 0.76, 0.72]) {
      const height = lines.reduce((h, l) => h + lineHeight(doc, l, k), 0);
      if (height <= room) {
        chosen = { lines, k };
        break;
      }
    }
    if (chosen) break;
  }
  chosen ??= { lines: contentLines(input, true), k: 0.72 };
  drawLines(doc, chosen.lines, chosen.k, top, bottom);
  drawFooter(doc, now);
  return doc;
}

export const VOTING_PLAN_FILE = "your-ballot-your-block-plan.pdf";
