import { NextResponse } from "next/server";
import { nearestEarlyVoting, oldCongressionalDistrict, pollingPlace } from "@/lib/arcgis";
import { buildBallot } from "@/lib/ballot";
import { geocodeAddress, geocodePoint } from "@/lib/census";
import type { LookupResult } from "@/lib/types";
import venueFixture from "@/data/fixtures/venue.json";

const OFFICIAL_LOOKUP_URL = "https://www.votemiamidade.gov/elections/home.page";
const VENUE = /2750\s+NW\s+3(rd)?\s+AVE/i;

// GET /api/lookup?address=...   or   /api/lookup?lat=..&lon=..
// Nothing is stored or logged: the address is used for this one request only.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const address = params.get("address")?.trim() ?? "";
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const hasPoint = params.has("lat") && params.has("lon") && isFinite(lat) && isFinite(lon);

  if (!address && !hasPoint) {
    return NextResponse.json({ error: "Enter an address or share your location." }, { status: 400 });
  }

  try {
    const geo = hasPoint ? await geocodePoint(lat, lon) : await geocodeAddress(address);
    if (!geo) {
      return NextResponse.json(
        { error: "We couldn't find that address. Try adding the city and ZIP." },
        { status: 404 },
      );
    }
    if (geo.county !== "Miami-Dade") {
      return NextResponse.json(
        { error: "That location is outside Miami-Dade County. 305 Votes covers Miami-Dade only for now." },
        { status: 422 },
      );
    }

    // Each county lookup may fail on its own without taking the ballot down with it.
    const [old, polling, earlyVoting] = await Promise.all([
      oldCongressionalDistrict(geo.lat, geo.lon).catch(() => ({ district: null, rep: null })),
      pollingPlace(geo.lat, geo.lon).catch(() => null),
      nearestEarlyVoting(geo.lat, geo.lon).catch(() => []),
    ]);

    const result: LookupResult = {
      geo,
      oldDistrict: old.district,
      currentRep: old.rep,
      districtChanged: !!old.district && !!geo.congressional && old.district !== geo.congressional,
      polling,
      earlyVoting,
      ...buildBallot(geo),
      officialLookupUrl: OFFICIAL_LOOKUP_URL,
    };
    return NextResponse.json(result);
  } catch {
    // Demo safety net: only the venue address has a saved answer, and it is labelled as saved.
    if (VENUE.test(address)) {
      return NextResponse.json({ ...venueFixture, savedExample: true });
    }
    return NextResponse.json(
      { error: "The district lookup service isn't answering right now. Try again in a moment." },
      { status: 502 },
    );
  }
}
