"use client";

import { useEffect, useRef, useState } from "react";
import { INTERVIEW_ORDER, THEMES, type Item } from "@/lib/items";
import { LiveVoice, type VoiceState } from "@/lib/liveVoice";
import type { Answers, Stance } from "./InterviewStep";

const QUESTIONS = INTERVIEW_ORDER.slice(0, 6); // two votes per theme

const SYSTEM = `You are the voice of 305 Votes, a friendly and strictly neutral civic interviewer talking with an 18 to 25 year old in Miami. You ask about real votes in the U.S. House, one at a time. Sound warm and relaxed, like a friend who follows the news, and keep everything short.
Rules:
- Messages in [brackets] are instructions from the app, not from the person. Never read them aloud.
- When told to ask a question, ask it out loud in one or two natural sentences.
- When the person answers, call record_answer with their stance on the bill: "yes", "no", or "unsure". Supporting something a bill removes means "no" on the bill.
- If they ask what the bill does, explain briefly using only the summary you were given, then ask again. Do not call record_answer until they give an answer.
- After record_answer returns, say one short neutral acknowledgement (under 10 words), then ask the next question it gives you. If it says the interview is complete, say what it tells you to say.
- Never give your own opinion, never argue, never mention political parties, never recommend a candidate.`;

const DONE_LINE =
  "The interview is complete. Tell them that is enough to place them, and to tap See where I stand.";

const askLine = (item: Item) => `Summary: ${item.summary} Question: ${item.question}`;

const LABEL: Record<Stance, string> = { yea: "Yes", nay: "No", unsure: "Not sure", skip: "Skipped" };

const STATUS: Record<VoiceState, string> = {
  connecting: "Connecting…",
  speaking: "Speaking…",
  listening: "Listening — talk, then tap me when you're done",
  thinking: "Thinking…",
  ended: "All done",
  error: "Voice is off — use the buttons",
};

export function VoiceInterview({
  answers,
  onAnswer,
  onDone,
  onTypeInstead,
}: {
  answers: Answers;
  onAnswer: (roll: number, stance: Stance) => void;
  onDone: () => void;
  onTypeInstead: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<VoiceState>("connecting");
  const [index, setIndex] = useState(0);
  const [aiLine, setAiLine] = useState("");
  const [myLine, setMyLine] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [checking, setChecking] = useState<Record<number, boolean>>({});
  const [micOff, setMicOff] = useState(false);

  const voice = useRef<LiveVoice | null>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(0);
  const heard = useRef("");
  const newAiTurn = useRef(true);

  useEffect(() => () => voice.current?.stop(), []);

  const item = QUESTIONS[index] as Item | undefined;
  const recorded = Object.keys(answers).length;

  // Move to the next question and say what the voice should be told about it.
  function advance(): string {
    const next = QUESTIONS[indexRef.current + 1];
    indexRef.current += 1;
    setIndex(indexRef.current);
    heard.current = "";
    setMyLine("");
    if (!next) voice.current?.finish();
    return next ? askLine(next) : DONE_LINE;
  }

  // Gemma 4 is the reader of record: it re-reads what the person actually said and its
  // reading replaces the voice model's quick one.
  async function confirmWithGemma(roll: number, said: string) {
    if (!said.trim()) return;
    setChecking((c) => ({ ...c, [roll]: true }));
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roll, answer: said }),
      });
      const json = await res.json();
      if (res.ok && json.stance !== "unclear") {
        onAnswer(roll, json.stance === "yes" ? "yea" : json.stance === "no" ? "nay" : "unsure");
      }
    } catch {
      // Keep the provisional reading.
    } finally {
      setChecking((c) => ({ ...c, [roll]: false }));
    }
  }

  async function start() {
    setStarted(true);
    const v = new LiveVoice(SYSTEM, {
      onState: (s) => {
        setState(s);
        if (s === "speaking" && newAiTurn.current) {
          newAiTurn.current = false;
          setAiLine("");
        }
        if (s === "listening" || s === "thinking") newAiTurn.current = true;
      },
      onAiText: (delta) => setAiLine((t) => t + delta),
      onUserText: (delta) => {
        heard.current += delta;
        setMyLine(heard.current);
      },
      onLevel: (level) => {
        if (orb.current) orb.current.style.transform = `scale(${1 + Math.min(level * 2.5, 0.25)})`;
      },
      onAnswer: (stance) => {
        const current = QUESTIONS[indexRef.current];
        if (!current) return { recorded: false, next: DONE_LINE };
        const said = heard.current;
        onAnswer(current.roll, stance === "yes" ? "yea" : stance === "no" ? "nay" : "unsure");
        confirmWithGemma(current.roll, said);
        return { recorded: true, next: advance() };
      },
      onError: (message) => setNote(message),
    });
    voice.current = v;
    try {
      await v.start(
        `Greet the person in one short sentence, tell them you'll ask about ${QUESTIONS.length} things Congress really voted on and there are no wrong answers, then ask the first one. ${askLine(QUESTIONS[0])}`,
      );
      setMicOff(!v.micAvailable);
    } catch (e) {
      setState("error");
      setNote(e instanceof Error ? e.message : "Voice isn't available right now.");
    }
  }

  function tap(stance: Stance) {
    if (!item) return;
    onAnswer(item.roll, stance);
    const next = advance();
    voice.current?.instruct(
      `The person tapped "${LABEL[stance]}" on screen for the current question. Acknowledge in a few words, then continue. ${next}`,
    );
  }

  if (!started) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-black tracking-tight">Let&apos;s talk it through</h2>
        <p className="text-foreground/80">
          I&apos;ll ask you out loud about {QUESTIONS.length} things Congress really voted on. Just
          answer like you&apos;re talking to a friend.
        </p>
        <button
          type="button"
          onClick={start}
          className="flex h-44 w-44 items-center justify-center rounded-full bg-accent text-xl font-black text-white shadow-[0_8px_0_0_var(--foreground)] active:translate-y-1"
        >
          🎙 Start
        </button>
        <p className="text-sm text-foreground/60">Turn your sound on. We&apos;ll ask to use your mic.</p>
        <button type="button" onClick={onTypeInstead} className="text-sm font-semibold underline">
          I&apos;d rather type
        </button>
      </main>
    );
  }

  const done = !item;
  return (
    <main className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-xs font-black uppercase tracking-widest">
        <span>{item ? `${THEMES[item.theme].emoji} ${THEMES[item.theme].label}` : "Interview"}</span>
        <span className="text-foreground/50">
          {Math.min(index + 1, QUESTIONS.length)} of {QUESTIONS.length}
        </span>
      </div>

      <div className="relative my-4 flex h-44 w-44 items-center justify-center">
        {(state === "speaking" || state === "listening") && (
          <span
            className={`absolute inset-0 animate-ping rounded-full opacity-30 ${state === "listening" ? "bg-wildlife" : "bg-accent"}`}
          />
        )}
        <button
          ref={orb}
          type="button"
          onClick={() => voice.current?.endTurn()}
          aria-label={state === "listening" ? "I'm done talking" : "Voice assistant"}
          className={`relative h-40 w-40 rounded-full border-4 border-foreground text-5xl transition-transform duration-100 ${
            state === "listening" ? "bg-wildlife" : state === "thinking" || state === "connecting" ? "animate-pulse bg-jobs" : "bg-accent"
          }`}
        >
          {state === "listening" ? "👂" : state === "thinking" || state === "connecting" ? "💭" : "🗣️"}
        </button>
      </div>
      <p className="text-sm font-bold">{micOff && state === "listening" ? "Mic is off — tap your answer below" : STATUS[state]}</p>
      {note && <p className="rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">{note}</p>}

      <div className="w-full rounded-3xl bg-card p-4">
        <p className="min-h-12">{aiLine || (item ? item.question : "That's everything. Let's see where you stand.")}</p>
        {item && (
          <details className="mt-2 text-sm text-foreground/70">
            <summary className="cursor-pointer font-semibold">
              Real vote: {item.bill} · {item.date} ⓘ
            </summary>
            <p className="mt-1">{item.summary}</p>
            <p className="mt-1">
              <a className="underline" href={item.billUrl} target="_blank" rel="noreferrer">
                Read the bill ↗
              </a>{" "}
              <a className="underline" href={item.voteUrl} target="_blank" rel="noreferrer">
                See the roll call ↗
              </a>
            </p>
          </details>
        )}
        {myLine && <p className="mt-3 border-t border-foreground/10 pt-3 text-sm italic">You: “{myLine.trim()}”</p>}
      </div>

      {recorded > 0 && (
        <ul className="flex w-full flex-wrap gap-2 text-xs font-bold">
          {QUESTIONS.filter((q) => answers[q.roll]).map((q) => (
            <li key={q.roll} className="rounded-full border border-foreground/20 bg-card px-3 py-1">
              {q.bill}: {LABEL[answers[q.roll]]}
              <span className="ml-1 font-normal text-foreground/50">
                {checking[q.roll] ? "· Gemma 4 checking…" : "✓"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex w-full flex-col gap-2 pt-2">
        {!done && (
          <div className="grid grid-cols-4 gap-2 text-sm font-bold">
            <button type="button" onClick={() => tap("yea")} className="rounded-xl border-2 border-foreground bg-card py-2.5">
              👍 Yes
            </button>
            <button type="button" onClick={() => tap("nay")} className="rounded-xl border-2 border-foreground bg-card py-2.5">
              👎 No
            </button>
            <button type="button" onClick={() => tap("unsure")} className="rounded-xl border border-foreground/30 py-2.5">
              Not sure
            </button>
            <button type="button" onClick={() => tap("skip")} className="rounded-xl border border-foreground/30 py-2.5">
              Skip
            </button>
          </div>
        )}
        {(done || recorded >= 2) && (
          <button
            type="button"
            onClick={() => {
              voice.current?.stop();
              onDone();
            }}
            className={`rounded-2xl px-4 py-4 text-lg font-bold ${
              done
                ? "bg-accent text-white shadow-[0_4px_0_0_var(--foreground)]"
                : "border-2 border-foreground"
            }`}
          >
            See where I stand ▶
          </button>
        )}
        <p className="text-center text-xs text-foreground/60">
          🗣 Voice: Gemini Live · ⚡ Gemma 4 reads what you said and records your answer · {recorded} recorded
        </p>
      </div>
    </main>
  );
}
