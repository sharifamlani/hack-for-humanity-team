# Position data QA — Oct 22, 2026 (before DeepStation AI Demo Night)

Scope: every candidate position the app shows today, from Gemma 4's readings
(`data/positions/stances.json`, `stances-state.json`) and recorded votes
(`data/positions/records.json`). Not in scope: the "closest thing they've said" passages
(`closest.json`), which the main session is reviewing separately.

## What was checked

| Check | How | Result |
|---|---|---|
| Quote is on the candidate's page word for word | `node scripts/verify-stances.mjs` | 0 missing |
| Every shown position answers the question as asked | Read all 108 shown readings by hand; 89 are on the ten active questions | 7 removed, listed below |
| Quote attributed to the wrong person | Scan for other roster candidates' names and reported speech ("said", "according to") | None misattributed. Two hits are the candidate quoting others in their own statement (Gilbert, Moskowitz) |
| Garbled characters in quotes or passages | Search for U+FFFD in shown quotes and all 2,136 passages | None |
| Recorded votes point the right way | Read all 19 votes on active questions | All consistent with the vote and the question |

## Removed (added to `data/positions/reviewed-out.json`)

| Candidate | Question | Why |
|---|---|---|
| Lucia Baez-Geller (FL House 106) | FEMA | Quote is about resilience for oceans and the water supply, not FEMA or hurricane relief |
| Lucia Baez-Geller (FL House 106) | Rent and housing | Quote is about insurance premiums and cost of living, not building housing or helping renters |
| Daphne Campbell (FL House 108) | Path to legal status | Quote only says she worked on "the HFRP", a family-reunification parole program |
| Wancito Francius (FL House 108) | Immigration enforcement | Generic "fair, lawful, dignity" language |
| Wancito Francius (FL House 108) | Path to legal status | Generic "just and humane immigration policies" heading |
| Ileana Garcia (FL Senate 36) | FEMA | "Championed flood mitigation efforts in our community" is local flood work |
| Oliver Gilbert (U.S. House FL-24) | Path to legal status | Quote is about ICE arrests, already counted under enforcement |

Four of the seven are on the venue address's ballot (FL-24, State Senate 36, State House 108),
so match percentages there shift slightly.

## Kept, but weak (judgment calls)

- Jose Javier Rodriguez (AG): housing ("stop algorithmic rent setting") and insurance ("investigate Big Insurance"). State action, not federal, but the direction is right.
- Fabián Basabe: transit ("modernizing our infrastructure"). Generic.
- George Lavin: housing ("affordable-housing approaches that give communities a real say").
- Scott Singer: flooding is labelled "stated" but the quote ("federal support to lower costs") is closer to insurance. It should be "leans"; the label lives in `stances.json`, owned by the new-data session today.
- Four quotes are reused for two questions each (Brown, Singer, Baez-Geller, Garcia). Allowed, but thin.
