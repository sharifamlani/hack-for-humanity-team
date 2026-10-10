# data/

Research data the app reads. Everything here was collected during the build window on
Oct 10, 2026.

## candidates/

The roster of who Miami and Miami Beach voters see on the **Tuesday Nov 3, 2026** ballot, from
U.S. Senate down to local offices.

| File | Contents | Built by |
|---|---|---|
| `candidates/federal.csv` | U.S. Senate, U.S. House FL-24 to FL-28 (new 2026 lines) | research pass |
| `candidates/state.csv` | Governor, Cabinet, State Senate, State House, statewide measures | research pass |
| `candidates/local.csv` | Miami-Dade County, school board, judicial, City of Miami, City of Miami Beach, local measures | research pass |
| `candidates.csv` | All three merged — **the file the app reads** | `scripts/merge-candidates.mjs` |

Check it with `node scripts/verify-candidates.mjs`.

### Columns

`candidate_id, name, party, office_level, office, district, jurisdiction, incumbent,
is_incumbent_of_this_seat_under_old_lines, on_general_ballot, election_date, covers_miami,
covers_miami_beach, campaign_url, bioguide_id, source_url, source_name, retrieved_date,
verification, notes`

### The sourcing rule

- Every row carries the `source_url` of the page it was taken from.
- `verification` is `primary` (official elections office or FEC), `secondary` (Ballotpedia or
  news only) or `unverified`. The app shows only `primary` and `secondary` rows.
- Nothing is filled in from memory or by a model's guess. An empty cell means "not confirmed".
- Rows with `on_general_ballot=false` are current officeholders who are not being voted on
  this November; they are kept so the app can still say who represents the user.

Positions and quiz-item stances are added in a separate file once the roster is settled; the
same rule applies — a stance with no source link is not shown.
