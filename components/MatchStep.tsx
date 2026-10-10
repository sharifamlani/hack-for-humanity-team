"use client";

import { useState } from "react";
import { ITEMS, MEMBERS, THEMES, THEME_KEYS, type Item, type Theme } from "@/lib/items";
import { agreement, estimatePosition, type Answer, type Position } from "@/lib/scale";
import type { LookupResult } from "@/lib/types";
import type { Answers } from "./InterviewStep";

const MIN_ANSWERS = 2; // fewer than this in a theme and we do not place the person
const LETTERS = ["A", "B", "C", "D"];

type Person = { id: string; name: string; role: string; letter: string };

const pct = (theta: number) => `${((Math.max(-1, Math.min(1, theta)) + 1) / 2) * 100}%`;

function ScaleLine({
  me,
  others,
}: {
  me: Position | null;
  others: { letter: string; pos: Position | null }[];
}) {
  return (
    <div className="relative mt-7 h-10">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground/15" />
      <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-foreground/30" />
      {me && (
        <>
          <div
            className="absolute top-1/2 h-4 -translate-y-1/2 rounded-full bg-accent/25"
            style={{ left: pct(me.low), width: `calc(${pct(me.high)} - ${pct(me.low)})` }}
          />
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(me.theta) }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-accent">
              YOU
            </span>
            <div className="h-5 w-5 rounded-full border-2 border-foreground bg-accent" />
          </div>
        </>
      )}
      {others.map(
        (o) =>
          o.pos && (
            <div
              key={o.letter}
              className="absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border-2 border-foreground bg-card text-xs font-black"
              style={{ left: pct(o.pos.theta) }}
            >
              {o.letter}
            </div>
          ),
      )}
    </div>
  );
}

export function MatchStep({
  result,
  answers,
  onNext,
}: {
  result: LookupResult;
  answers: Answers;
  onNext: () => void;
}) {
  const [open, setOpen] = useState<Theme | null>(null);
  const [explain, setExplain] = useState<Record<string, { text?: string; loading?: boolean }>>({});

  // Only clear yes/no answers place someone; "not sure" and skips are left out.
  const mine: Record<number, Answer> = {};
  for (const [roll, stance] of Object.entries(answers)) {
    if (stance === "yea" || stance === "nay") mine[Number(roll)] = stance;
  }

  // People with a real voting record on these bills: the current member, and any
  // incumbent on this ballot. Everyone else cannot be placed.
  const people: Person[] = [];
  const add = (id: string | null | undefined, name: string, role: string) => {
    if (id && MEMBERS[id] && !people.some((p) => p.id === id)) {
      people.push({ id, name, role, letter: LETTERS[people.length] });
    }
  };
  if (result.currentRep) {
    add(result.currentRepBioguide, result.currentRep, `represents you now · FL-${result.oldDistrict}`);
  }
  const houseRace = result.ballot
    .flatMap((s) => s.races)
    .find((r) => r.office.startsWith("U.S. House"));
  for (const c of houseRace?.candidates ?? []) {
    add(c.bioguide_id, c.name, `on your ballot · ${c.office} ${c.district}`);
  }
  const unplaced = (houseRace?.candidates ?? []).filter((c) => !MEMBERS[c.bioguide_id]);

  const votesOf = (id: string, items: Item[]) =>
    Object.fromEntries(items.map((i) => [i.roll, i.memberVotes[id]]));

  const rows: { key: Theme | "all"; label: string; items: Item[] }[] = [
    ...THEME_KEYS.map((t) => ({
      key: t,
      label: `${THEMES[t].emoji} ${THEMES[t].label}`,
      items: ITEMS.filter((i) => i.theme === t),
    })),
    { key: "all", label: "Everything together", items: ITEMS },
  ];

  async function toggle(theme: Theme) {
    setOpen(open === theme ? null : theme);
    if (explain[theme] || people.length === 0) return;
    setExplain((e) => ({ ...e, [theme]: { loading: true } }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme, answers: mine, bioguideIds: people.map((p) => p.id) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setExplain((e) => ({ ...e, [theme]: { text: json.text } }));
    } catch {
      setExplain((e) => ({ ...e, [theme]: {} }));
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-5">
      <h2 className="text-3xl font-black tracking-tight">Where you stand</h2>

      <section className="rounded-3xl bg-card p-5">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-foreground/50">
          <span>◀ votes more with the left</span>
          <span>votes more with the right ▶</span>
        </div>

        {rows.map((row) => {
          const answeredHere = row.items.filter((i) => mine[i.roll]).length;
          const me = answeredHere >= MIN_ANSWERS ? estimatePosition(row.items, mine) : null;
          const others = people.map((p) => ({
            letter: p.letter,
            pos: estimatePosition(row.items, votesOf(p.id, row.items)),
          }));
          const isTheme = row.key !== "all";
          return (
            <div key={row.key} className="border-b border-foreground/10 py-4 last:border-0">
              <button
                type="button"
                disabled={!isTheme}
                onClick={() => isTheme && toggle(row.key as Theme)}
                className="flex w-full items-center justify-between text-left font-black"
              >
                <span>{row.label}</span>
                {isTheme && <span className="text-xs text-accent">{open === row.key ? "hide" : "why? ⚡"}</span>}
              </button>
              <ScaleLine me={me} others={others} />
              {!me && (
                <p className="mt-1 text-xs text-foreground/60">
                  Answer at least {MIN_ANSWERS} questions here to place you.
                </p>
              )}

              {isTheme && open === row.key && (
                <div className="mt-3 rounded-2xl bg-background p-4 text-sm">
                  {people.map((p) => {
                    const a = agreement(row.items, mine, votesOf(p.id, row.items));
                    return (
                      <p key={p.id} className="font-semibold">
                        You and {p.name} agreed on {a.same} of {a.of} real votes.
                      </p>
                    );
                  })}
                  {explain[row.key]?.loading && (
                    <p className="mt-2 animate-pulse text-foreground/60">Gemma 4 is reading the votes…</p>
                  )}
                  {explain[row.key]?.text && (
                    <p className="mt-2">
                      {explain[row.key].text}
                      <span className="ml-1 text-xs text-foreground/50">— written by Gemma 4</span>
                    </p>
                  )}
                  <ul className="mt-3 space-y-1 text-xs">
                    {row.items
                      .filter((i) => mine[i.roll])
                      .map((i) => (
                        <li key={i.roll}>
                          <a className="underline" href={i.voteUrl} target="_blank" rel="noreferrer">
                            {i.bill} ↗
                          </a>{" "}
                          you: {mine[i.roll] === "yea" ? "yes" : "no"}
                          {people.map((p) => ` · ${p.letter}: ${i.memberVotes[p.id] ?? "no vote"}`)}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}

        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-accent align-middle" />
            You — the shaded band is how sure we are
          </li>
          {people.map((p) => (
            <li key={p.id}>
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md border-2 border-foreground text-[10px] font-black">
                {p.letter}
              </span>
              {p.name} <span className="text-foreground/60">({p.role})</span>
            </li>
          ))}
          {unplaced.map((c) => (
            <li key={c.candidate_id} className="text-foreground/60">
              ◌ {c.name} — not enough public record to place
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-foreground/60">
        How this works: you and members of Congress are placed from the same real House votes,
        using each vote&apos;s published dividing line from Voteview. A few answers give a rough
        position, so read the band, not the dot. Members are placed from how they actually voted;
        candidates who have never voted in Congress are not placed. We describe. We never
        recommend.
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
