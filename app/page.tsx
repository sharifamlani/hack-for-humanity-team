"use client";

import { useState } from "react";
import { STEPS, StepBar } from "@/components/StepBar";

const VENUE_ADDRESS = "2750 NW 3rd Ave, Miami, FL 33127";

const THEMES = [
  { emoji: "🌊", label: "Water · air · land · fire", color: "bg-water" },
  { emoji: "🐢", label: "Wildlife", color: "bg-wildlife" },
  { emoji: "🎓", label: "Jobs & staying in Miami", color: "bg-jobs" },
];

// What each later step will show once it is wired. Shown on screen so nobody
// mistakes the shell for a working feature.
const COMING: Record<number, { title: string; body: string }> = {
  1: {
    title: "Who's on your ballot",
    body: "Your district on the new 2026 map, who represents you today, and every candidate on your Nov 3 ballot with sourced quotes.",
  },
  2: {
    title: "Ten real votes, your call",
    body: "Yes / No / Skip on questions Congress actually voted on, one card at a time.",
  },
  3: {
    title: "Where you stand",
    body: "You and the candidates on one scale for each theme, with a Gemma 4 explanation of where you differ.",
  },
  4: {
    title: "Your polling place",
    body: "Where to vote on Tuesday, Nov 3, early voting near you, and directions.",
  },
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <span className="text-xl font-black tracking-tight">
          305 <span className="text-accent">VOTES</span>
        </span>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded-full bg-foreground px-3 py-1 text-background">
            Vote
          </span>
          <span className="rounded-full border border-foreground/20 px-3 py-1 text-foreground/40">
            Housing · soon
          </span>
          <span className="rounded-full border border-foreground/20 px-3 py-1 text-foreground/40">
            Climate · soon
          </span>
        </div>
      </header>

      <StepBar step={step} onStep={setStep} />

      {step === 0 ? (
        <main className="flex flex-1 flex-col gap-6">
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
            Your ballot.
            <br />
            Your block.
            <br />
            <span className="text-accent">Two minutes.</span>
          </h1>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (address.trim()) next();
            }}
          >
            <label htmlFor="address" className="text-sm font-semibold">
              Your home address
            </label>
            <input
              id="address"
              type="text"
              autoComplete="street-address"
              placeholder="123 Main St, Miami, FL"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-2xl border-2 border-foreground bg-card px-4 py-4 text-lg outline-none focus:ring-4 focus:ring-accent/30"
            />
            <button
              type="submit"
              disabled={!address.trim()}
              className="rounded-2xl bg-accent px-4 py-4 text-lg font-bold text-white shadow-[0_4px_0_0_var(--foreground)] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
            >
              Show my ballot ▶
            </button>
            <button
              type="button"
              onClick={() => setAddress(VENUE_ADDRESS)}
              className="self-start rounded-full border border-foreground/30 px-3 py-1.5 text-sm"
            >
              Try: 2750 NW 3rd Ave — we&apos;re here
            </button>
            <p className="text-sm text-foreground/70">
              🔒 We never store your address.
            </p>
          </form>

          <ul className="mt-auto flex flex-col gap-2">
            {THEMES.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm font-semibold"
              >
                <span className={`h-3 w-3 rounded-full ${t.color}`} />
                <span>
                  {t.emoji} {t.label}
                </span>
              </li>
            ))}
          </ul>
        </main>
      ) : (
        <main className="flex flex-1 flex-col gap-6">
          <section className="rounded-3xl bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Not built yet
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              {COMING[step].title}
            </h2>
            <p className="mt-3 text-foreground/80">{COMING[step].body}</p>
            {address && (
              <p className="mt-4 rounded-xl bg-background px-3 py-2 text-sm">
                Address entered: {address}
              </p>
            )}
          </section>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={next}
              className="rounded-2xl bg-foreground px-4 py-4 text-lg font-bold text-background"
            >
              Next: {STEPS[step + 1]} ▶
            </button>
          )}
        </main>
      )}

      <footer className="text-center text-xs text-foreground/60">
        We describe. We never recommend. · Open source, MIT · Hack for Humanity:
        Miami 2026
      </footer>
    </div>
  );
}
