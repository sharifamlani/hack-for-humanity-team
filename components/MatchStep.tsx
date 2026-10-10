"use client";

import { useEffect, useState } from "react";
import { compare, matchScore, placeCandidate, placeVoter, tally, type Answers, type Cell, type Placement } from "@/lib/match";
import { QUESTIONS, THEMES, closestOf, hasRecord, stanceOf, voteOf } from "@/lib/questions";
import type { Candidate, LookupResult } from "@/lib/types";

const MARK: Record<Cell, { icon: string; label: string; style: string }> = {
  agree: { icon: "✓", label: "agrees with you", style: "bg-wildlife text-white" },
  differ: { icon: "✗", label: "differs from you", style: "bg-foreground text-background" },
  none: { icon: "◌", label: "no public position found", style: "border border-foreground/25 text-foreground/40" },
  skipped: { icon: "–", label: "you skipped this", style: "text-foreground/30" },
};

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const pct = (x: number) => `${((Math.max(-1, Math.min(1, x)) + 1) / 2) * 100}%`;

// Everyone in a race on one left-right line. Members of Congress sit at their published
// DW-NOMINATE score; everyone else at a rough index built from their yes/no positions.
function SpectrumLine({ me, people }: { me: Placement | null; people: { letter: string; name: string; at: Placement | null }[] }) {
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
                    : p.at.source === "record"
                      ? "bg-foreground text-background"
                      : p.at.source === "donors"
                        ? "bg-water text-white"
                        : "border-2 border-foreground bg-card"
                }`}
                style={{ left: pct(p.at.x) }}
              >
                {p.letter}
              </div>
            ),
        )}
        {me && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(me.x) }}>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-accent">YOU</span>
            <div className="h-5 w-5 rounded-full border-2 border-foreground bg-accent" />
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
                      ? `— from who funded their ${p.at.cycle} campaign (CFscore ${(p.at.x * 2).toFixed(2)})`
                      : p.at.source === "guess"
                      ? "— mostly a party guess"
                      : `— from ${p.at.answers} positions`}
              </span>
            </li>
          );
        })}
        {!me && <li className="text-foreground/60">Answer two or more of the questions to place yourself.</li>}
      </ul>
      <p className="mt-2 text-[11px] text-foreground/50">
        Rough placement. Dark = measured from votes in Congress (DW-NOMINATE, Voteview). Blue =
        from past campaign donors (CFscore, Bonica&apos;s DIME). Outlined = our estimate from published
        positions. Dashed = party guess. The three scales are not identical.
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
  onNext,
}: {
  result: LookupResult;
  answers: Answers;
  said: Record<string, string>;
  // Set when the voter used the open mode: what they told us they care about.
  openSaid: string;
  onNext: () => void;
}) {
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
    .filter((r) => r.candidates.some((c) => hasRecord(c.candidate_id)))
    .sort((a, b) => Number(b.office.startsWith("U.S. House")) - Number(a.office.startsWith("U.S. House")));

  // The suggested ballot: in each race, the candidate closest to what the voter told us.
  const suggestions = races
    .map((race) => {
      const ranked = race.candidates
        .map((c) => ({ c, m: matchScore(answers, c.candidate_id, c.party) }))
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

  return (
    <main className="flex flex-1 flex-col gap-5">
      <h2 className="text-3xl font-black tracking-tight">Where you stand</h2>

      {answered && suggestions.length > 0 && (
        <section className="rounded-3xl border-2 border-foreground bg-card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-accent">Your suggested ballot</p>
          <ul className="mt-2 divide-y divide-foreground/10">
            {suggestions.map((s) => (
              <li key={s.office} className="flex items-baseline justify-between gap-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-foreground/60">{s.office}</p>
                  <p className="text-lg font-black leading-tight">
                    {s.tie ? "Too close to call" : s.best.c.name}
                  </p>
                </div>
                {!s.tie && (
                  <span className="shrink-0 rounded-full bg-wildlife px-3 py-1 text-sm font-black text-white">
                    {Math.round(s.best.m.score * 100)}% match
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-foreground/60">
            The closest candidate in each race to what you told us. A match, not an endorsement — the
            evidence for every race is below, and other races on your ballot are not scored yet.
          </p>
        </section>
      )}

      {openSaid && (
        <section className="rounded-3xl border-2 border-foreground bg-card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-accent">
            You talked about{ask.topic ? `: ${ask.topic}` : ""}
          </p>
          <p className="mt-2 text-sm italic">“{openSaid.trim()}”</p>
          {ask.loading && (
            <p className="mt-3 animate-pulse text-foreground/60">
              Gemma 4 is reading what your candidates have published…
            </p>
          )}
          {ask.error && <p className="mt-3 text-sm font-semibold text-accent">{ask.error}</p>}
          {ask.findings?.map((f) => (
            <div key={f.id} className="mt-4 border-t border-foreground/10 pt-3 text-sm">
              <p className="font-black">{f.name}</p>
              {f.quote ? (
                <>
                  <p className="mt-1">{f.said}</p>
                  <p className="mt-1 text-foreground/80">
                    “{f.quote}”{" "}
                    <a className="font-semibold underline" href={f.url} target="_blank" rel="noreferrer">
                      source ↗
                    </a>
                  </p>
                </>
              ) : (
                <p className="mt-1 text-foreground/60">◌ Nothing found on this in what they&apos;ve published.</p>
              )}
            </div>
          ))}
          {ask.findings && (
            <p className="mt-3 text-xs text-foreground/50">Read and summarised by Gemma 4. Quotes are exact.</p>
          )}
        </section>
      )}

      {races.length === 0 && (
        <p className="rounded-3xl bg-card p-5">
          We haven&apos;t collected what the candidates on your ballot have said yet.
        </p>
      )}

      {(answered || !openSaid) && races.map((race) => (
        <section key={race.office} className="rounded-3xl bg-card p-5">
          <h3 className="text-sm font-bold text-accent">{race.office}</h3>
          <SpectrumLine
            me={placeVoter(answers)}
            people={race.candidates.map((c, i) => ({
              letter: LETTERS[i] ?? "?",
              name: c.name,
              at: placeCandidate(c.candidate_id, c.party),
            }))}
          />

          <div
            className="mt-3 grid items-center gap-x-2 gap-y-1"
            style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${race.candidates.length}, 3.75rem)` }}
          >
            <span />
            {race.candidates.map((c) => (
              <span key={c.candidate_id} className="truncate text-center text-[11px] font-black" title={c.name}>
                {lastName(c.name)}
              </span>
            ))}

            {QUESTIONS.map((q) => {
              const key = `${race.office}|${q.id}`;
              return (
                <div key={q.id} className="contents">
                  <button
                    type="button"
                    onClick={() => toggle(key, q.id, race.candidates)}
                    className="py-2 text-left text-sm font-bold"
                  >
                    {THEMES[q.theme].emoji} {q.short}
                    <span className="ml-1 text-xs text-accent">{open === key ? "hide" : "why?"}</span>
                  </button>
                  {race.candidates.map((c) => {
                    const { cell, basis } = compare(answers, c.candidate_id, c.party, q.id);
                    const mark = MARK[cell];
                    // A party guess is drawn hollow and dashed so it never looks like a quote.
                    const guess = basis === "party" && (cell === "agree" || cell === "differ");
                    // No yes/no, but they have said something on the topic: show a speech mark.
                    const spoke = cell === "none" && !!closestOf(c.candidate_id, q.id);
                    return (
                      <button
                        key={c.candidate_id}
                        type="button"
                        onClick={() => toggle(key, q.id, race.candidates)}
                        aria-label={`${c.name}: ${guess ? "party guess, " : basis === "leans" ? "leans, " : ""}${mark.label}`}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                          guess
                            ? "border-2 border-dashed border-foreground/50 text-foreground/60"
                            : spoke
                              ? "border border-foreground/40 bg-background"
                              : `${mark.style} ${basis === "leans" ? "opacity-60" : ""}`
                        }`}
                      >
                        {guess ? `~${mark.icon}` : spoke ? "💬" : mark.icon}
                      </button>
                    );
                  })}

                  {open === key && (
                    <div className="col-span-full mb-2 rounded-2xl bg-background p-4 text-sm">
                      <p className="font-semibold">{q.question}</p>
                      <p className="mt-2">
                        You:{" "}
                        <b>
                          {answers[q.id] === "yea" ? "Yes" : answers[q.id] === "nay" ? "No" : answers[q.id] === "unsure" ? "Not sure" : "skipped"}
                        </b>
                        {said[q.id] && <span className="italic"> — “{said[q.id].trim()}”</span>}
                      </p>
                      {race.candidates.map((c) => {
                        const s = stanceOf(c.candidate_id, q.id);
                        const guess = q.partyLean?.[c.party];
                        const near = closestOf(c.candidate_id, q.id);
                        const vote = voteOf(c.candidate_id, q.id);
                        return (
                          <p key={c.candidate_id} className="mt-2">
                            <b>{c.name}:</b>{" "}
                            {vote && (
                              <>
                                🗳 {vote.text}{" "}
                                <a className="font-semibold underline" href={vote.url} target="_blank" rel="noreferrer">
                                  roll call ↗
                                </a>{" "}
                              </>
                            )}
                            {s && s.stance !== "none" ? (
                              <>
                                {s.reading === "leans" && (
                                  <span className="text-foreground/60">leans {s.stance} — </span>
                                )}
                                “{s.quote}”{" "}
                                <a className="font-semibold underline" href={s.url} target="_blank" rel="noreferrer">
                                  source ↗
                                </a>
                              </>
                            ) : vote ? null : (
                              <>
                                {near ? (
                                  <>
                                    <span className="text-foreground/60">no clear yes or no. Closest thing they&apos;ve said: </span>
                                    “{near.text}”{" "}
                                    <a className="font-semibold underline" href={near.url} target="_blank" rel="noreferrer">
                                      source ↗
                                    </a>
                                  </>
                                ) : (
                                  <span className="text-foreground/60">nothing found on this in what they&apos;ve published.</span>
                                )}
                                {guess && (
                                  <span className="text-foreground/60">
                                    {" "}
                                    Party guess: {c.party} candidates usually say {guess}. This is not{" "}
                                    {lastName(c.name)}&apos;s statement.
                                  </span>
                                )}
                              </>
                            )}
                          </p>
                        );
                      })}
                      {explain[key]?.loading && (
                        <p className="mt-3 animate-pulse text-foreground/60">Gemma 4 is reading…</p>
                      )}
                      {explain[key]?.text && (
                        <p className="mt-3 border-t border-foreground/10 pt-3">
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

          <ul className="mt-4 space-y-1 border-t border-foreground/10 pt-3 text-sm">
            {race.candidates.map((c) => {
              const t = tally(answers, c.candidate_id, c.party);
              const m = matchScore(answers, c.candidate_id, c.party);
              return (
                <li key={c.candidate_id}>
                  <b>{c.name}</b>{" "}
                  {m && <span className="font-black text-wildlife">{Math.round(m.score * 100)}% match · </span>}
                  {t.own.of > 0
                    ? `lines up with you on ${t.own.agree} of ${t.own.of} from their own words`
                    : "— nothing in their own words to compare yet"}
                  {t.guess.of > 0 && (
                    <span className="text-foreground/60">
                      {" "}
                      · {t.guess.agree} of {t.guess.of} by party guess
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-xs text-foreground/60">
            Counted only on issues where you answered yes or no.
          </p>
        </section>
      ))}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/70">
        {(["agree", "differ", "none"] as Cell[]).map((k) => (
          <li key={k}>
            <b>{MARK[k].icon}</b> {MARK[k].label}
          </li>
        ))}
        <li>
          <b>faded</b> their words lean that way
        </li>
        <li>
          <b>~ dashed</b> party guess, not their words
        </li>
        <li>
          <b>💬</b> said something on this, no clear yes or no
        </li>
      </ul>

      <p className="text-xs text-foreground/60">
        How this works: we collected what each candidate has published on their own websites and
        press releases. A search finds the passages closest to each question, Gemma 4 reads them
        and decides whether they answer it yes or no, and a position is shown only when its quote
        is on the page word for word. Where we found nothing, a dashed mark fills in the usual
        position of the candidate&apos;s party — a rough guess, never their own statement. A blank
        circle means we found nothing and made no guess. The match percentage averages two
        things: how often you and the candidate agree (a party guess counts half), and how close
        you sit on the left-right line. It is a starting point, not an endorsement.
      </p>

      <button
        type="button"
        onClick={onNext}
        className="rounded-2xl bg-accent px-4 py-4 text-lg font-bold text-white shadow-[0_4px_0_0_var(--foreground)] active:translate-y-1 active:shadow-none"
      >
        Where do I vote? ▶
      </button>
    </main>
  );
}
