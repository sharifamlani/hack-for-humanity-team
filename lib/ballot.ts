import candidatesJson from "@/data/candidates.json";
import type { BallotRace, Candidate, Geo } from "./types";

const CANDIDATES = candidatesJson as Candidate[];

const SECTIONS: [string, (c: Candidate) => boolean][] = [
  ["Congress", (c) => c.office_level === "federal"],
  ["Florida", (c) => c.office_level === "state"],
  ["Miami-Dade & your city", (c) => ["county", "school_board", "municipal"].includes(c.office_level)],
  ["Judges", (c) => c.office_level === "judicial"],
  ["Ballot questions", (c) => c.office_level === "ballot_measure"],
];

// Seats elected by a district this app cannot look up for an address yet.
const UNPLACED_OFFICES = ["County Commissioner", "School Board Member"];

function onThisBallot(c: Candidate, geo: Geo): boolean {
  if (!c.on_general_ballot) return false;
  if (c.office === "U.S. House") return c.district === `FL-${geo.congressional}`;
  if (c.office === "Florida State Senate") return c.district === geo.stateSenate;
  if (c.office === "Florida State House") return c.district === geo.stateHouse;
  if (UNPLACED_OFFICES.includes(c.office)) return false;
  if (c.jurisdiction.startsWith("City of ")) return c.jurisdiction === `City of ${geo.city}`;
  return true;
}

export function buildBallot(geo: Geo) {
  const mine = CANDIDATES.filter((c) => onThisBallot(c, geo));
  const ballot = SECTIONS.map(([section, inSection]) => {
    const races: BallotRace[] = [];
    for (const c of mine.filter(inSection)) {
      const office =
        c.office_level === "ballot_measure"
          ? c.jurisdiction
          : c.district && c.district !== "statewide"
            ? `${c.office} · ${/^\d+$/.test(c.district) ? "District " : ""}${c.district}`
            : c.office;
      const race = races.find((r) => r.office === office);
      if (race) race.candidates.push(c);
      else races.push({ office, candidates: [c] });
    }
    return { section, races };
  }).filter((s) => s.races.length > 0);

  const notPlaced = UNPLACED_OFFICES.filter((office) =>
    CANDIDATES.some((c) => c.on_general_ballot && c.office === office),
  );
  return { ballot, notPlaced };
}
