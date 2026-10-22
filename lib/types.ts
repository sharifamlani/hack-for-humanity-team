export type Candidate = {
  candidate_id: string;
  name: string;
  party: string;
  office_level: string;
  office: string;
  district: string;
  jurisdiction: string;
  incumbent: boolean;
  is_incumbent_of_this_seat_under_old_lines: boolean;
  on_general_ballot: boolean;
  election_date: string;
  campaign_url: string;
  bioguide_id: string;
  source_url: string;
  source_name: string;
  verification: string;
  notes: string;
};

export type Geo = {
  matchedAddress: string | null;
  lat: number;
  lon: number;
  county: string | null;
  city: string | null;
  // District numbers on the lines in force for the Nov 3, 2026 election.
  congressional: string | null;
  stateSenate: string | null;
  stateHouse: string | null;
};

export type PollingPlace = {
  precinct: number;
  name: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  // A temporary site for this election (marked "T" on the official list). Optional: the
  // saved venue example predates it.
  temporary?: boolean;
};

export type EarlyVotingSite = {
  name: string;
  address: string;
  city: string;
  accessible: boolean;
  dropBox: boolean;
  opens: number | null;
  closes: number | null;
  miles: number;
  lat: number;
  lon: number;
};

export type BallotRace = { office: string; candidates: Candidate[] };

export type LookupResult = {
  geo: Geo;
  // Congressional district under the pre-2026 map, and who holds that seat today.
  oldDistrict: string | null;
  currentRep: string | null;
  currentRepBioguide: string | null;
  districtChanged: boolean;
  polling: PollingPlace | null;
  earlyVoting: EarlyVotingSite[];
  ballot: { section: string; races: BallotRace[] }[];
  // Races we know exist but cannot place this address in yet.
  notPlaced: string[];
  // This voter's seats filled without a contest (not printed on the ballot). Optional: the
  // saved venue example predates it.
  unopposed?: { office: string; name: string }[];
  officialLookupUrl: string;
  savedExample?: boolean;
};
