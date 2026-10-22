import { EARLY_VOTING_HOURS, dayNumber, todayNumber, weekdayDate, windowStatus } from "./dates";
import type { Answers, Placement } from "./match";
import { matchRace } from "./raceMatch";
import type { Candidate, LookupResult } from "./types";

// The take-to-the-polls sheet: one half-letter page (5.5 x 8.5 in) built in the browser, so
// the voter's answers and address never leave the device. One type size for everything but
// the title, and the races as a table: Race | Your closest match | Match | Evidence. On a
// phone the page shows at about one point per pixel; it prints on Letter fitted.
// It says "closest match", never "vote for": the same match, label and caveat as the screen.

type JsPdf = InstanceType<(typeof import("jspdf"))["jsPDF"]>;
type Rgb = [number, number, number];

const PAGE_W = 396; // 5.5 in
const PAGE_H = 612; // 8.5 in
const MARGIN = 26;
const W = PAGE_W - 2 * MARGIN;
const BODY = 9; // the one text size
const LEADING = 1.3;
const PAD = 3.5;
const INK: Rgb = [17, 17, 17];
const MUTED: Rgb = [95, 95, 95];
const MINT: Rgb = [14, 138, 104]; // the app's mint, darkened so it holds up on white paper
const BAND: Rgb = [228, 245, 239];
const RULE: Rgb = [215, 215, 215];
const ELECTION_DAY = "Tue, Nov 3, 2026";
// Race | Your closest match | Match | Evidence: always the full width; only type scales.
const COLS = [0.32, 0.42, 0.1, 0.16].map((f) => f * W);
const HEAD = ["Race", "Your closest match", "Match", "Evidence"];

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
// "Arthur LeMar \"Marty\" McNeil" -> "McNeil"; "James Bush III" -> "Bush III"
const surname = (name: string) => {
  const words = name.replace(/"[^"]*"/g, "").trim().split(/\s+/);
  const last = words.pop() ?? name;
  return /^(Jr\.?|Sr\.?|II|III|IV)$/.test(last) && words.length ? `${words.pop()} ${last}` : last;
};
// Office names short enough for the Race column.
const shortOffice = (office: string) =>
  office
    .replace(/^Florida State (Senate|House) · District (\d+)$/, "State $1 $2")
    .replace(/^Circuit Judge, 11th Judicial Circuit · Group (\d+)$/, "Circuit Judge, Group $1")
    .replace(/^Justice of the Supreme Court of Florida - retention$/, "Supreme Court: retain?")
    .replace(/^Judge, 3rd District Court of Appeal - retention$/, "3rd District Court of Appeal: retain?")
    .replace(/^Commissioner of Agriculture$/, "Agriculture Commissioner");
// "Amendment 1: Budget Stabilization Fund (HJR 5019)" -> ["Amendment 1", "Budget Stabilization Fund"]
// The county and city questions use " - " where the state amendments use ":".
const measureParts = (name: string) => {
  const t = name.replace(/\s*\([^)]*\)\s*$/, "");
  const cuts = [t.indexOf(":"), t.indexOf(" - ")].filter((n) => n > 0);
  const i = cuts.length ? Math.min(...cuts) : -1;
  return i > 0 ? [t.slice(0, i), t.slice(i).replace(/^(:| - )\s*/, "")] : [t, ""];
};

// ["Amendment 1", "Amendment 2", "County Referendum 1 - Charter Amendment", ...]
//   -> "Amendment 1, 2 · County Referendum 1 - Charter Amendment, ..." grouped by the words around the number.
const groupLabels = (labels: string[]) => {
  const groups = new Map<string, { head: string; nums: string[]; tail: string }>();
  for (const l of labels) {
    const m = l.match(/^(.*?)(\d+)(.*)$/);
    const key = m ? `${m[1]}#${m[3]}` : l;
    const g = groups.get(key) ?? { head: m ? m[1] : l, nums: [], tail: m ? m[3] : "" };
    if (m) g.nums.push(m[2]);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => `${g.head}${g.nums.join(", ")}${g.tail}`).join(" · ");
};

type Row =
  | { kind: "band"; text: string }
  | { kind: "head" }
  | { kind: "row"; cells: string[]; strong?: boolean; muted?: boolean };

export type VotingPlanInput = { result: LookupResult; answers: Answers; me: Placement | null };

function tableRows({ result, answers, me }: VotingPlanInput): Row[] {
  const rows: Row[] = [{ kind: "head" }];
  for (const section of result.ballot) {
    rows.push({ kind: "band", text: section.section });
    if (section.section === "Ballot questions") {
      // One row naming every question: a long ballot has a dozen, too many for a row each.
      const labels = groupLabels(section.races.flatMap((r) => r.candidates).map((c) => measureParts(c.name)[0]));
      rows.push({ kind: "row", cells: [`${section.races.flatMap((r) => r.candidates).length} questions`, `Your call: ${labels}. Read each on the official sample ballot.`, "–", "Not scored"], muted: true });
      continue;
    }
    for (const race of section.races) {
      const office = shortOffice(race.office);
      const m = matchRace(race, answers, me);
      if (m.best) {
        const score = m.scores.get(m.best.candidate_id)?.score;
        rows.push({
          kind: "row",
          cells: [
            office,
            `${m.best.name} (${party(m.best)})`,
            score == null ? "–" : `${Math.round(score * 100)}%`,
            m.thin ? `Thin (${m.bestPositions})` : "Strong",
          ],
          strong: !m.thin,
        });
      } else if (m.tie && m.ranked.length > 1) {
        const [a, b] = m.ranked;
        rows.push({ kind: "row", cells: [office, `Too close to call: ${surname(a.name)} (${party(a)}) or ${surname(b.name)} (${party(b)})`, "–", "Tie"] });
      } else {
        const names = race.candidates.map((c) => surname(c.name)).join(", ");
        rows.push({ kind: "row", cells: [office, `Your call: ${names}`, "–", "Not scored"], muted: true });
      }
    }
  }
  if (result.unopposed?.length) {
    rows.push({ kind: "band", text: "Not on your ballot" });
    result.unopposed.forEach((u) =>
      rows.push({ kind: "row", cells: [shortOffice(u.office), `${u.name}, elected unopposed`, "–", "Decided"], muted: true }),
    );
  }
  return rows.map((r) => (r.kind === "row" ? { ...r, cells: r.cells.map(clean) } : r));
}

// The plan above the table: label / value pairs, all at the one body size.
function planLines({ result }: VotingPlanInput): [string, string][] {
  const { geo, polling, earlyVoting } = result;
  const lines: [string, string][] = [
    ["Address", geo.matchedAddress ?? geo.city ?? "Miami-Dade"],
    [
      "Districts",
      `FL-${geo.congressional}${result.districtChanged ? ` (new map; was FL-${result.oldDistrict})` : ""} · State Senate ${geo.stateSenate} · State House ${geo.stateHouse}`,
    ],
  ];
  // Same two lanes as the screen: early voting at ANY site in the county, Election Day only at
  // the precinct's polling place.
  const opens = earlyVoting.map((s) => s.opens).filter((n): n is number => n != null);
  const closes = earlyVoting.map((s) => s.closes).filter((n): n is number => n != null);
  if (opens.length && closes.length && earlyVoting[0]) {
    const first = Math.min(...opens);
    const last = Math.max(...closes);
    if (windowStatus(todayNumber(), dayNumber(first), dayNumber(last)) !== "after") {
      const near = earlyVoting[0];
      lines.push([
        "Vote early",
        `${weekdayDate(first)} – ${weekdayDate(last)} · ${EARLY_VOTING_HOURS} Any early-voting site in Miami-Dade works. Closest: ${near.name}, ${near.address}`,
      ]);
    }
  }
  if (polling) {
    lines.push([
      "Election Day",
      `${ELECTION_DAY} · 7 AM – 7 PM · only at your precinct's polling place: ${polling.name}${polling.temporary ? " (temporary site)" : ""}, ${polling.address}, ${polling.city} ${polling.zip} · Precinct ${polling.precinct} · most likely; confirm with the county`,
    ]);
  } else {
    lines.push(["Election Day", `${ELECTION_DAY} · 7 AM – 7 PM · find your polling place at votemiamidade.gov`]);
  }
  return lines.map(([a, b]) => [a, clean(b)]);
}

function font(doc: JsPdf, bold: boolean, size: number) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
}

const LABEL_W = 78;
const planBold = (label: string) => label === "Election Day" || label === "Address";

function planHeight(doc: JsPdf, lines: [string, string][], k: number) {
  return lines.reduce((h, [label, v]) => {
    font(doc, planBold(label), BODY * k);
    return h + doc.splitTextToSize(v, W - LABEL_W).length * BODY * k * LEADING + 2 * k;
  }, 0);
}

const cellBold = (row: { strong?: boolean }, i: number) => i === 0 || (i === 1 && !!row.strong);

function rowHeight(doc: JsPdf, row: Row, k: number) {
  const line = BODY * k * LEADING;
  if (row.kind !== "row") return line + 2 * PAD * k;
  const lines = row.cells.map((c, i) => {
    font(doc, cellBold(row, i), BODY * k);
    return doc.splitTextToSize(c, COLS[i] - 2 * PAD).length;
  });
  return Math.max(...lines) * line + 2 * PAD * k;
}

function drawPlan(doc: JsPdf, lines: [string, string][], k: number, top: number) {
  let y = top;
  const line = BODY * k * LEADING;
  for (const [label, value] of lines) {
    font(doc, true, BODY * k);
    doc.setTextColor(...MINT);
    doc.text(label, MARGIN, y + line * 0.78);
    font(doc, planBold(label), BODY * k);
    doc.setTextColor(...INK);
    const parts: string[] = doc.splitTextToSize(value, W - LABEL_W);
    parts.forEach((p, i) => doc.text(p, MARGIN + LABEL_W, y + line * (i + 0.78)));
    y += parts.length * line + 2 * k;
  }
  return y;
}

function drawTable(doc: JsPdf, rows: Row[], k: number, top: number) {
  let y = top;
  const line = BODY * k * LEADING;
  const xs = COLS.map((_, i) => MARGIN + COLS.slice(0, i).reduce((a, b) => a + b, 0));
  const width = W;
  for (const row of rows) {
    const h = rowHeight(doc, row, k);
    if (row.kind === "head") {
      font(doc, true, BODY * k);
      doc.setTextColor(...MUTED);
      HEAD.forEach((t, i) => doc.text(t.toUpperCase(), xs[i] + PAD, y + PAD * k + line * 0.78));
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.8);
      doc.line(MARGIN, y + h, MARGIN + width, y + h);
    } else if (row.kind === "band") {
      doc.setFillColor(...BAND);
      doc.rect(MARGIN, y, width, h, "F");
      font(doc, true, BODY * k);
      doc.setTextColor(...MINT);
      doc.text(row.text.toUpperCase(), MARGIN + PAD * k, y + PAD * k + line * 0.78);
    } else {
      row.cells.forEach((c, i) => {
        font(doc, cellBold(row, i), BODY * k);
        doc.setTextColor(...(row.muted && i > 0 ? MUTED : INK));
        const parts: string[] = doc.splitTextToSize(c, COLS[i] - 2 * PAD);
        parts.forEach((p, j) => doc.text(p, xs[i] + PAD, y + PAD * k + line * (j + 0.78)));
      });
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + h, MARGIN + width, y + h);
    }
    y += h;
  }
  return y;
}

function drawHeader(doc: JsPdf): number {
  font(doc, true, 10);
  doc.setTextColor(...INK);
  doc.text("Your Ballot.", MARGIN, MARGIN + 8);
  const w = doc.getTextWidth("Your Ballot. ");
  doc.setTextColor(...MINT);
  doc.text("Your Block.", MARGIN + w, MARGIN + 8);
  doc.setTextColor(...INK);
  doc.text(`Election Day: ${ELECTION_DAY}`, PAGE_W - MARGIN, MARGIN + 8, { align: "right" });
  font(doc, true, 17);
  doc.text("Take this to the polls", MARGIN, MARGIN + 30);
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, MARGIN + 38, PAGE_W - MARGIN, MARGIN + 38);
  return MARGIN + 44;
}

// Builds the page; if the ballot is long, everything shrinks together (one size) until it fits.
export async function buildVotingPlanPdf(input: VotingPlanInput): Promise<JsPdf> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: [PAGE_W, PAGE_H], orientation: "portrait" });
  doc.setProperties({ title: "Your Ballot. Your Block. - take this to the polls", creator: "yourballotyourblock.com" });

  const top = drawHeader(doc);
  const room = PAGE_H - MARGIN - top;
  const plan = planLines(input);
  const rows = tableRows(input);
  const GAP = 10;
  let k = 1;
  for (const candidate of [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65]) {
    k = candidate;
    const height = planHeight(doc, plan, k) + GAP * k + rows.reduce((h, r) => h + rowHeight(doc, r, k), 0);
    if (height <= room) break;
  }
  const afterPlan = drawPlan(doc, plan, k, top);
  drawTable(doc, rows, k, afterPlan + GAP * k);
  return doc;
}

export const VOTING_PLAN_FILE = "your-ballot-your-block-plan.pdf";
