# Pre-event checklist

**Event: Saturday Oct 10, 2026. Check-in 10:00 AM. Build 10:45 AM–3:30 PM. Submit by 3:45 PM.**

The rule that shapes this list: **all code must be written during the event.** So everything
here is deliberately *not code* — credentials, verification, decisions, logistics, and
practice. That is a large and underused prep budget. Most teams show up having prepped none
of it and lose the first ninety minutes to setup.

Ordered by what hurts most if skipped.

---

## P0 — Will cost you the day if missed

- [ ] **Get a GEMINI API key into `.env`** (`mlh.link/gemma`). Not an Anthropic key — Gemma 4
      via the Gemini API is what makes the project eligible for Challenge 2 (Best Open-Source
      AI Project) **and** Challenge 3 (Best Use of Gemma 4); a closed-weight model forfeits
      both. `.env` is **empty (0 bytes)**. Smoke S4 cannot pass until this lands. An
      AI-powered entry with no working key at 11 AM is a dead entry.
- [ ] **Confirm the account has credit / is not rate-limited.** A key that authenticates but
      402s on the third call is worse than no key, because you will not suspect it.
- [ ] **Make one real API call** and see a completion come back. Status 200 on a models list
      is not the same proof as a completion.
- [ ] **Census API key** (`api.census.gov/data/key_signup.html`) — only if Brain Gain is in
      play. Free, instant. Census returns **HTTP 200 with an HTML error page** without it.
- [ ] **Charge the laptop. Pack the charger.** Also: phone charged, hotspot tested.
- [ ] **Sleep.** Four hours forty-five minutes of fast decisions on no sleep is a worse trade
      than any item below.

## P1 — Buys back build-day time

- [ ] **Warm the pnpm store** so install at the venue is not fighting conference Wi-Fi:
      run `pnpm store add next react react-dom tailwindcss` tonight. This populates the global
      cache **without creating a project** — no code, no `package.json`, nothing in the repo.
      At the venue, install then pulls from local disk.
- [ ] **Practice the scaffold command once, outside this repo**, in a throwaway folder — then
      delete it. Knowing the exact `create-next-app` flags by heart saves ten minutes of
      reading prompts. Practice is not event code; just keep it out of this repo.
- [ ] **Pre-create the Vercel project** (infra, not code). Vercel CLI is already authenticated
      as `sharifamlani` — verified tonight.
- [ ] **Pre-create a Supabase project if the idea needs a database.** Provisioning takes
      several minutes of waiting you do not want at 11 AM. CLI v2.95.4 verified installed.
      Only do this if the idea actually needs persistence — many good demos do not.
- [ ] **Decide the model now.** Sonnet 5 for latency-sensitive paths, Opus 5 where answer
      quality is the demo. Decide once; do not A/B models at 2 PM.
- [ ] **Bookmark or save the API docs you will need offline**, in case venue Wi-Fi is bad.

## P2 — Decisions better made now than at 10:40 AM

- [ ] **Pick the track.** See `data-sources-verified.md` for which tracks actually have live
      data. Data to Action and Four Forces are the well-supported ones; Wild Miami is the
      weakest on local open data.
- [ ] **Shortlist 2–3 ideas and a #2 fallback** in `idea-shortlist.md`.
- [ ] **Confirm the team roster (1–4) and who does the talking.** Solo versus a team of four
      changes scope enormously. The demoer should be decided before 3 PM, not at 3:44.
- [ ] **Sketch the one screen** that has to look finished. Not four screens. One.
- [ ] **Pre-write the 311 queries** you expect to need as `curl` lines in a notes file — URL
      strings are not application code, and getting ArcGIS query syntax right at the venue
      costs twenty minutes.

## P3 — Logistics

- [ ] Venue: **The LAB Miami, 2750 NW 3rd Avenue, Miami, FL 33127**. Check parking.
- [ ] Arrive for **10:00 AM check-in** — opening remarks at 10:20 may announce sponsor prizes
      or constraints that change the idea choice.
- [ ] Water, food, headphones.
- [ ] Repo URL ready to paste into the submission form:
      `https://github.com/sharifamlani/hack-for-humanity`

---

## Ask at check-in (open questions)

- Exact submission mechanism — Devpost, MLH form, Google Form? What fields?
- Is a **deployed public URL** required, or is a localhost demo acceptable?
- Is pre-existing framework boilerplate explicitly permitted?
- Any sponsor-specific API or tooling prizes?
- Venue Wi-Fi reliability — is a hotspot needed?

---

## Already verified tonight, so you can stop worrying about it

| Thing | Status |
|---|---|
| Public GitHub repo, MIT license | ✅ `github.com/sharifamlani/hack-for-humanity` — GitHub reports `private: false`, `license: MIT` |
| Git push auth | ✅ pushes clean as `sharifamlani` |
| Toolchain | ✅ node v22.14.0, pnpm 10.28.2, git 2.28.0 |
| Vercel CLI | ✅ v50.1.3, logged in as `sharifamlani` |
| Supabase CLI | ✅ v2.95.4 installed |
| Miami civic data sources | ✅ 13 probed, 11 live — see `data-sources-verified.md` |
| Claude Code CLI | ✅ **2.1.296** (was 2.1.123 — 173 behind). `--bg`, agent view, cross-session messaging, workflows all verified |
| Parallel-agent tooling | ✅ 2 skills + 5 subagents + pre-approved permissions + `.worktreeinclude` — see `parallel-build-playbook.md` |
| **Gemini API key (Gemma 4)** | ✅ **verified** — 62 models, `gemma-4-31b-it` returned a real completion. S4 PASS |
| Gemma 4 integration traps | ⚠️ **2 found** — closed-weight default + `thought` parts. See `gemma4-integration.md`. Add `GEMMA_MODEL=gemma-4-31b-it` to `.env` |
| Census API key | ❌ not set (only needed for Brain Gain) |
