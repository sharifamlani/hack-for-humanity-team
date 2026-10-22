"use client";

import { useEffect, useState } from "react";
import { compare, matchScore, placeCandidate, positionOf, tally, type Answers, type Cell, type Placement } from "@/lib/match";
import { ESTIMATE_CHECK, QUESTIONS, THEMES, closestOf, hasEvidence, stanceOf, voteOf, type Theme } from "@/lib/questions";
import type { Candidate, LookupResult } from "@/lib/types";

const MARK: Record<Cell, { icon: string; label: string; style: string }> = {
  agree: { icon: "✓", label: "agrees with you", style: "bg-wildlife text-background" },
  differ: { icon: "✗", label: "differs from you", style: "bg-foreground text-background" },
  none: { icon: "◌", label: "no public position found", style: "border border-foreground/25 text-foreground/40" },
  skipped: { icon: "–", label: "you skipped this", style: "text-foreground/30" },
};

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const pct = (x: number) => `${((Math.max(-1, Math.min(1, x)) + 1) / 2) * 100}%`;

// Everyone in a race on one left-right line. Members of Congress sit at their published
// DW-NOMINATE score; everyone else at a rough index built from their yes/no positions.
function SpectrumLine({ me, placing, people }: { me: Placement | null; placing: boolean; people: { letter: string; name: string; at: Placement | null }[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(id);
  }, []);
  const slide = "left 1.4s cubic-bezier(.2,.8,.2,1)";
  return (
    <div className="mt-3 rounded-2xl bg-background p-4">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-foreground/50">
        <span>◀ more liberal</span>
        <span>more conservative ▶</span>
      </div>
      <div className="relative mt-7 h-9">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground/15" />
        <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/30" />
        {people.map(
          (p) =>
            p.at && (
              <div
                key={p.letter}
                title={p.name}
                className={`absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md text-xs font-black ${
                  p.at.source === "guess"
                    ? "border-2 border-dashed border-foreground/50 bg-background text-foreground/60"
                    : p.at.source === "words"
                      ? "border-2 border-accent bg-card"
                    : p.at.source === "record"
                      ? "bg-foreground text-background"
                      : p.at.source === "donors"
                        ? "bg-water text-background"
                        : "border border-foreground/25 bg-card"
                }`}
                style={{ left: ready ? pct(p.at.x) : "50%", transition: slide }}
              >
                {p.letter}
              </div>
            ),
        )}
        {me?.low != null && me.high != null && (
          <div
            className="absolute top-1/2 h-4 -translate-y-1/2 rounded-full bg-accent/25"
            style={{ left: pct(me.low), width: `calc(${pct(me.high)} - ${pct(me.low)})` }}
          />
        )}
        {me && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: ready ? pct(me.x) : "50%", transition: slide }}>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-accent">YOU</span>
            <div className="h-5 w-5 rounded-full border border-foreground/25 bg-accent" />
          </div>
        )}
      </div>
      <ul className="mt-2 space-y-0.5 text-xs">
        {people.map((p) => {
          const record = p.at?.source === "record";
          return (
            <li key={p.letter}>
              <b>{p.letter}</b> {p.name}{" "}
              <span className="text-foreground/60">
                {!p.at
                  ? "— not enough to place"
                  : record
                    ? `— from ${p.at.answers} votes in Congress (DW-NOMINATE ${p.at.x.toFixed(2)})`
                    : p.at.source === "donors"
                      ? `— from who funded their ${p.at.cycle} campaign (CFscore ${(p.at.raw ?? 0).toFixed(2)})`
                      : p.at.source === "words"
                      ? `— estimated by Gemma 4 from ${p.at.answers} passages of their own words`
                      : p.at.source === "guess"
                      ? "— mostly a party guess"
                      : `— from ${p.at.answers} positions`}
              </span>
            </li>
          );
        })}
        {!me && <li className="text-foreground/60">Answer two or more of the questions to place yourself.</li>}
        {me?.source === "conversation" && (
          <li>
            <b className="text-accent">YOU</b>{" "}
            <span className="text-foreground/60">— placed by Gemma 4 from what you said. {me.why}</span>
          </li>
        )}
        {me && me.source !== "conversation" && (
          <li className="text-foreground/60">
            <b className="text-accent">YOU</b> —{" "}
            {placing ? "rough spot while Gemma 4 reads what you said…" : `rough spot from ${me.answers} of your answers`}
          </li>
        )}
      </ul>
      <p className="mt-2 text-[11px] text-foreground/50">
        Rough placement. White = measured from votes in Congress (DW-NOMINATE, Voteview). Blue =
        from past campaign donors (CFscore, Bonica&apos;s DIME). Outlined = our estimate from published
        positions. Mint outline = Gemma 4&apos;s estimate from their own words (checked on sitting
        members: right side {ESTIMATE_CHECK.correctSide} of {ESTIMATE_CHECK.of}, average miss{" "}
        {ESTIMATE_CHECK.averageMiss.toFixed(2)}). Dashed = party guess. The shaded band is the range
        for your own spot. These scales are not identical.
      </p>
    </div>
  );
}

type Finding = { id: string; name: string; said: string; quote: string; url: string };

const lastName =(name: string) =>
  name.replace(/["“”].*?["“”]/g, "").replace(/\b(Jr\.?|Sr\.?|III|II|IV)\b/g, "").trim().split(/\s+/).pop() ?? name;

export function MatchStep({
  result,
  answers,
  said,
  openSaid,
  office,
  embedded = false,
  me,
  placing,
  onNext,
  onBack,
}: {
  result: LookupResult;
  answers: Answers;
  said: Record<string, string>;
  // Set when the voter used the open mode: what they told us they care about.
  openSaid: string;
  // The one race being shown.
  office: string;
  // Shown inside the ballot, under its race, instead of as a screen of its own.
  embedded?: boolean;
  me: Placement | null;
  placing: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const [theme, setTheme] = useState<Theme | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [ask, setAsk] = useState<{ loading: boolean; topic?: string; findings?: Finding[]; error?: string }>({
    loading: !!openSaid,
  });
  const answered = Object.values(answers).some((a) => a === "yea" || a === "nay");

  useEffect(() => {
    if (!openSaid) return;
    const house = result.ballot.flatMap((s) => s.races).find((r) => r.office.startsWith("U.S. House"));
    fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        said: openSaid,
        candidates: (house?.candidates ?? []).map((c) => ({ id: c.candidate_id, name: c.name })),
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setAsk({ loading: false, topic: json.topic, findings: json.findings });
      })
      .catch((e) => setAsk({ loading: false, error: e.message || "We couldn't look that up right now." }));
  }, [openSaid, result]);
  const [explain, setExplain] = useState<Record<string, { text?: string; loading?: boolean }>>({});


  // The races we have collected candidates' own words for: U.S. House, then U.S. Senate.
  const races = result.ballot
    .flatMap((s) => s.races)
    .filter((r) => r.office === office && r.candidates.some((c) => hasEvidence(c.candidate_id)))
    .sort((a, b) => Number(b.office.startsWith("U.S. House")) - Number(a.office.startsWith("U.S. House")));

  // The suggested ballot: in each race, the candidate closest to what the voter told us.
  const suggestions = races
    .map((race) => {
      const ranked = race.candidates
        .map((c) => ({ c, m: matchScore(answers, c.candidate_id, c.party, me) }))
        .filter((x): x is { c: Candidate; m: NonNullable<ReturnType<typeof matchScore>> } => x.m !== null)
        .sort((a, b) => b.m.score - a.m.score);
      // Within three points is a coin flip, not a match.
      const tie = ranked.length > 1 && ranked[0].m.score - ranked[1].m.score < 0.03;
      return { office: race.office, best: ranked[0], tie };
    })
    .filter((s) => s.best);

  async function toggle(key: string, questionId: string, candidates: Candidate[]) {
    setOpen(open === key ? null : key);
    const mine = answers[questionId];
    if (explain[key] || (mine !== "yea" && mine !== "nay")) return;
    setExplain((e) => ({ ...e, [key]: { loading: true } }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: questionId,
          stance: mine,
          said: said[questionId] ?? "",
          candidates: candidates.map((c) => ({ id: c.candidate_id, name: c.name })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setExplain((e) => ({ ...e, [key]: { text: json.text } }));
    } catch {
      setExplain((e) => ({ ...e, [key]: {} }));
    }
  }

  const shown = QUESTIONS.filter((q) => theme === "all" || q.theme === theme);

  return (
    <main className={embedded ? "drop mt-2 flex flex-col gap-4" : "flex flex-1 flex-col gap-5"}>
      <div className={embedded ? "hidden" : ""}>
        <button type="button" onClick={onBack} className="mb-3 font-bold hover:text-accent">
          ← Back to my ballot
        </button>
        <h1 className="display text-5xl lg:text-6xl">{office}</h1>
        <p className="mt-2 text-lg text-foreground/80">The match and the evidence. Explore the records, then make your own decision.</p>
      </div>

      {false && answered && suggestions.length > 0 && (
        <section className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
          <p className="eyebrow text-accent">Closest to what you told us</p>
          {suggestions.map((s) => (
            <p key={s.office} className="text-sm">
              <span className="text-foreground/60">{s.office}: </span>
              <b>{s.tie ? "Too close to call" : s.best.c.name}</b>
              {!s.tie && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-black text-background">
                  {Math.round(s.best.m.score * 100)}% match
                </span>
              )}
            </p>
          ))}
          <p className="w-full text-xs text-foreground/60">
            A match, not an endorsement. The evidence for every race is below.
          </p>
        </section>
      )}

      {openSaid && (
        <section className="card p-5">
          <p className="eyebrow text-accent">You talked about{ask.topic ? `: ${ask.topic}` : ""}</p>
          <p className="mt-2 text-sm italic">“{openSaid.trim()}”</p>
          {ask.loading && (
            <p className="mt-3 animate-pulse text-foreground/60">
              Gemma 4 is reading what your candidates have published…
            </p>
          )}
          {ask.error && <p className="mt-3 text-sm font-semibold text-coral">{ask.error}</p>}
          <div className="grid gap-x-6 md:grid-cols-2">
            {ask.findings?.map((f) => (
              <div key={f.id} className="mt-4 border-t border-foreground/15 pt-3 text-sm">
                <p className="display text-lg">{f.name}</p>
                {f.quote ? (
                  <>
                    <p className="mt-1">{f.said}</p>
                    <p className="mt-1 text-foreground/80">
                      “{f.quote}”{" "}
                      <a className="link-mint" href={f.url} target="_blank" rel="noreferrer">
                        View source ↗
                      </a>
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-foreground/60">Nothing found on this in what they&apos;ve published.</p>
                )}
              </div>
            ))}
          </div>
          {ask.findings && (
            <p className="mt-3 text-xs text-foreground/50">Read and summarised by Gemma 4. Quotes are exact.</p>
          )}
        </section>
      )}

      {races.length === 0 && (
        <p className="card p-5">We haven&apos;t collected what the candidates on your ballot have said yet.</p>
      )}

      {(answered || !openSaid) && races.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["all", ...Object.keys(THEMES)] as (Theme | "all")[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold ${
                theme === t ? "bg-accent text-background" : "border border-foreground/25 bg-card hover:border-accent"
              }`}
            >
              {t === "all" ? "All issues" : `${THEMES[t].emoji} ${THEMES[t].label}`}
            </button>
          ))}
        </div>
      )}

      {(answered || !openSaid) && races.map((race) => {
        // Narrow enough minimums that a three-way race fits the ballot column at 1280px.
        const cols = { gridTemplateColumns: `minmax(150px,1.1fr) repeat(${race.candidates.length}, minmax(140px,1fr))` };
        return (
          <section key={race.office} className={embedded ? "flex flex-col" : "card flex flex-col p-5"}>
            <div className="overflow-x-auto">
              <div className="grid gap-x-5" style={cols}>
                <p className="text-sm text-foreground/70">{race.office}</p>
                {race.candidates.map((c) => {
                  const t = tally(answers, c.candidate_id, c.party);
                  const m = matchScore(answers, c.candidate_id, c.party, me);
                  return (
                    <div key={c.candidate_id} className="border-l border-foreground/15 pb-3 pl-4">
                      <p className="display text-xl">{c.name}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          c.party.startsWith("Rep")
                            ? "bg-coral text-background"
                            : c.party.startsWith("Dem")
                              ? "bg-sky text-background"
                              : "bg-foreground/20"
                        }`}
                      >
                        {c.party}
                        {c.incumbent && " · incumbent"}
                      </span>
                      <p className="mt-1.5 text-xs text-foreground/70">
                        {m && <b className="text-accent">{Math.round(m.score * 100)}% match · </b>}
                        {t.own.of > 0 ? `${t.own.agree} of ${t.own.of} from their own words` : "nothing in their own words yet"}
                        {t.guess.of > 0 && ` · ${t.guess.agree} of ${t.guess.of} by party guess`}
                      </p>
                    </div>
                  );
                })}

                {shown.map((q) => {
                  const key = `${race.office}|${q.id}`;
                  return (
                    <div key={q.id} className="contents">
                      <div className="border-t border-foreground/15 py-4 pr-2">
                        <p className="display text-lg">
                          {THEMES[q.theme].emoji} {q.short}
                        </p>
                        <p className="mt-1 text-sm text-foreground/70">{q.question}</p>
                        <p className="mt-1 text-xs text-foreground/60">
                          You:{" "}
                          <b className="text-foreground">
                            {answers[q.id] === "yea" ? "Yes" : answers[q.id] === "nay" ? "No" : answers[q.id] === "unsure" ? "Not sure" : "skipped"}
                          </b>
                        </p>
                        {(answers[q.id] === "yea" || answers[q.id] === "nay") && (
                          <button type="button" onClick={() => toggle(key, q.id, race.candidates)} className="link-mint mt-1 text-left text-sm">
                            {open === key ? "Hide comparison" : "How do we compare? ⚡ Gemma 4"}
                          </button>
                        )}
                      </div>
                      {race.candidates.map((c) => {
                        const { cell, basis } = compare(answers, c.candidate_id, c.party, q.id);
                        const theirs = positionOf(c.candidate_id, c.party, q.id);
                        const s = stanceOf(c.candidate_id, q.id);
                        const near = closestOf(c.candidate_id, q.id);
                        const vote = voteOf(c.candidate_id, q.id);
                        const guess = theirs.basis === "party";
                        const head =
                          cell === "agree"
                            ? "✓ Agrees with you"
                            : cell === "differ"
                              ? "✗ Differs from you"
                              : theirs.stance
                                ? `Says ${theirs.stance}`
                                : near
                                  ? "💬 No clear yes or no"
                                  : "Nothing found";
                        return (
                          <div
                            key={c.candidate_id}
                            aria-label={`${c.name}: ${guess ? "party guess, " : basis === "leans" ? "leans, " : ""}${MARK[cell].label}`}
                            className="border-l border-t border-foreground/15 py-4 pl-4 text-sm"
                          >
                            <p
                              className={`display text-base ${
                                guess
                                  ? "text-foreground/60"
                                  : cell === "agree"
                                    ? "text-accent"
                                    : cell === "differ"
                                      ? "text-coral"
                                      : ""
                              } ${basis === "leans" ? "opacity-70" : ""}`}
                            >
                              {guess ? `~ Party guess: ${head.replace(/^[✓✗] /, "").toLowerCase()}` : head}
                              {basis === "leans" && " (leans)"}
                            </p>
                            {vote && (
                              <p className="mt-1 text-foreground/80">
                                🗳 {vote.text}{" "}
                                <a className="link-mint whitespace-nowrap" href={vote.url} target="_blank" rel="noreferrer">
                                  Roll call ↗
                                </a>
                              </p>
                            )}
                            {s && s.stance !== "none" ? (
                              <>
                                <p className="mt-1 line-clamp-5 text-foreground/80" title={s.quote}>“{s.quote}”</p>
                                <a className="link-mint" href={s.url} target="_blank" rel="noreferrer">
                                  View source ↗
                                </a>
                              </>
                            ) : vote ? null : near ? (
                              <>
                                <p className="mt-1 line-clamp-4 text-foreground/70" title={near.text}>
                                  Closest thing they&apos;ve said: “{near.text}”
                                </p>
                                <a className="link-mint" href={near.url} target="_blank" rel="noreferrer">
                                  View source ↗
                                </a>
                              </>
                            ) : (
                              <p className="mt-1 text-foreground/60">
                                {guess
                                  ? `${c.party} candidates usually say ${theirs.stance}. This is not ${lastName(c.name)}'s statement.`
                                  : "Nothing on this in what they've published."}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {open === key && (
                        <div className="col-span-full mb-3 rounded-xl bg-background p-4 text-sm">
                          {said[q.id] && <p className="italic">You said: “{said[q.id].trim()}”</p>}
                          {explain[key]?.loading && <p className="animate-pulse text-foreground/60">Gemma 4 is reading…</p>}
                          {explain[key]?.text && (
                            <p className="mt-1">
                              {explain[key].text}
                              <span className="ml-1 text-xs text-foreground/50">— written by Gemma 4</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="border-t border-foreground/15 pt-3 text-sm text-foreground/70">
              ⓘ Missing information does not imply support or opposition.
            </p>

            <details open className="order-first mb-4">
              <summary className="cursor-pointer text-sm font-bold">Where everyone sits, left to right</summary>
              <SpectrumLine
                me={me}
                placing={placing}
                people={race.candidates.map((c, i) => ({
                  letter: LETTERS[i] ?? "?",
                  name: c.name,
                  at: placeCandidate(c.candidate_id, c.party),
                }))}
              />
            </details>
          </section>
        );
      })}

      <div className={embedded ? "hidden" : "grid items-start gap-4 lg:grid-cols-[auto_1fr_1.1fr]"}>
        <button type="button" onClick={onBack} className="px-2 py-3 text-left font-bold hover:text-accent">
          ← Back to my ballot
        </button>
        <button type="button" onClick={onNext} className="btn-primary text-lg">
          Build my voting plan →
        </button>
        <details className="card px-5 py-4 text-sm">
          <summary className="display cursor-pointer text-lg">What informs this view?</summary>
          <p className="mt-2 text-foreground/70">
            We collected what each candidate has published on their own websites and press releases.
            A search finds the passages closest to each question, Gemma 4 reads them and decides
            whether they answer it yes or no, and a position is shown only when its quote is on the
            page word for word. Where we found nothing, a party guess fills in the usual position of
            the candidate&apos;s party — a rough guess, never their own statement. The match
            percentage averages two things: how often you and the candidate agree (a party guess
            counts half), and how close you sit on the left-right line. It is a starting point, not
            an endorsement.
          </p>
        </details>
      </div>
    </main>
  );
}
