"use client";

import { useState } from "react";
import { BallotStep } from "@/components/BallotStep";
import { InterviewStep } from "@/components/InterviewStep";
import { MatchStep } from "@/components/MatchStep";
import { OpenTalk } from "@/components/OpenTalk";
import { VoiceInterview } from "@/components/VoiceInterview";
import { PollingStep } from "@/components/PollingStep";
import { Shapes } from "@/components/Shapes";
import { STEPS, StepBar } from "@/components/StepBar";
import type { Answers, Stance } from "@/lib/match";
import { usePlacement } from "@/lib/usePlacement";
import type { LookupResult } from "@/lib/types";

const VENUE_ADDRESS = "2750 NW 3rd Ave, Miami, FL 33127";

const NAV = [
  { label: "Home", step: 0, steps: [0] },
  { label: "Priorities", step: 1, steps: [1] },
  { label: "My ballot", step: 2, steps: [2] },
  { label: "Voting plan", step: 3, steps: [3] },
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");

  const [result, setResult] = useState<LookupResult | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [said, setSaid] = useState<Record<string, string>>({});
  const [typed, setTyped] = useState(false);
  const [openMode, setOpenMode] = useState(false);
  const [openSaid, setOpenSaid] = useState("");
  // The race whose evidence is open; null shows the whole ballot.
  const [race, setRace] = useState<string | null>(null);
  const show = (office: string | null) => {
    setRace(office);
    window.scrollTo(0, 0);
  };
  const { me, placing } = usePlacement(answers, said, openSaid, step >= 2);

  // Record an answer and, when we have them, the voter's own words for it.
  const record = (id: string, stance: Stance, words?: string) => {
    setAnswers((a) => ({ ...a, [id]: stance }));
    if (words?.trim()) setSaid((s) => ({ ...s, [id]: words }));
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  // Later steps need a lookup result; without one, stay on the address screen.
  const goTo = (target: number) => {
    setRace(null);
    setStep(result ? target : 0);
  };

  async function lookup(query: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookup?${query}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
      setStep(1);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("This browser can't share a location. Type your address instead.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => lookup(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => {
        setLoading(false);
        setError("We couldn't get your location. Type your address instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-foreground/20 pb-4">
        <button type="button" onClick={() => setStep(0)} className="display text-xl lg:text-2xl">
          Your Ballot, <span className="text-coral">Your Block.</span>
        </button>
        <nav aria-label="Sections" className="hidden gap-7 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <button
              key={n.label}
              type="button"
              onClick={() => goTo(n.step)}
              className={`border-b-2 pb-1 ${
                n.steps.includes(step) ? "border-accent text-accent" : "border-transparent hover:text-accent"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <span
          title="We never store your address or location."
          className="rounded-full border border-foreground/40 px-4 py-1.5 text-sm font-semibold"
        >
          🛡 Privacy
        </span>
      </header>

      <div className="flex items-start justify-between gap-6">
        <StepBar step={step} onStep={goTo} />
        <Shapes className="hidden h-24 shrink-0 md:block" />
      </div>

      {step === 0 ? (
        <main className="grid flex-1 items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="display text-6xl lg:text-7xl">
              Your ballot.
              <br />
              Your block.
              <br />
              <span className="text-accent">Two minutes.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-foreground/80">
              Miami-Dade redrew its districts this year. See who is really on your ballot, what
              they have said in their own words, and where you vote on Tuesday, Nov 3.
            </p>
          </div>

          <form
            className="card flex flex-col gap-3 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (address.trim()) lookup(`address=${encodeURIComponent(address.trim())}`);
            }}
          >
            <label htmlFor="address" className="eyebrow text-foreground/70">
              Your home address
            </label>
            <input
              id="address"
              type="text"
              autoComplete="street-address"
              placeholder="123 Main St, Miami, FL"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl border border-foreground/30 bg-background px-4 py-4 text-lg outline-none focus:border-accent focus:ring-4 focus:ring-accent/25"
            />
            <button type="submit" disabled={!address.trim() || loading} className="btn-primary text-lg">
              {loading ? "Finding your district…" : "Start →"}
            </button>
            {error && (
              <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-semibold text-coral">
                {error}
              </p>
            )}
            <button type="button" onClick={useMyLocation} disabled={loading} className="btn-ghost">
              📍 Use my location
            </button>
            <button
              type="button"
              onClick={() => setAddress(VENUE_ADDRESS)}
              className="self-start rounded-full border border-foreground/30 px-3 py-1.5 text-sm hover:border-accent"
            >
              Try: 2750 NW 3rd Ave — we&apos;re here
            </button>
            <p className="text-sm text-foreground/70">🔒 We never store your address or location.</p>
          </form>
        </main>
      ) : result && step === 1 ? (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          {openMode ? (
            <OpenTalk
              onBack={() => setOpenMode(false)}
              onDone={(words) => {
                setOpenSaid(words);
                setOpenMode(false);
                // What they talked about is answered on the U.S. House race screen.
                show(result.ballot.flatMap((s) => s.races).find((r) => r.office.startsWith("U.S. House"))?.office ?? null);
                setStep(2);
              }}
            />
          ) : !typed ? (
            <VoiceInterview
              answers={answers}
              onAnswer={record}
              onDone={next}
              onOpen={() => setOpenMode(true)}
              onTypeInstead={() => setTyped(true)}
            />
          ) : (
            <InterviewStep answers={answers} onAnswer={record} onDone={next} />
          )}
        </div>
      ) : result && step === 2 ? (
        <BallotStep
          result={result}
          answers={answers}
          me={me}
          placing={placing}
          openRace={race}
          onRace={(office) => setRace(race === office ? null : office)}
          evidence={(office) => (
            <MatchStep
              key={office}
              result={result}
              answers={answers}
              said={said}
              openSaid={openSaid}
              office={office}
              embedded
              me={me}
              placing={placing}
              onNext={next}
              onBack={() => setRace(null)}
            />
          )}
          onNext={next}
        />
      ) : result ? (
        <PollingStep result={result} />
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/20 pt-4 text-xs text-foreground/60">
        <span className="display text-lg text-foreground">
          Your Ballot, <span className="text-coral">Your Block.</span>
        </span>
        <span>A match, not an endorsement · Open source, MIT · Hack for Humanity: Miami 2026</span>
      </footer>
    </div>
  );
}
