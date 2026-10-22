"use client";

import { useEffect, useRef, useState } from "react";
import type { Answers, Stance } from "@/lib/match";
import { QUESTIONS, THEMES, type Question } from "@/lib/questions";

// The typed version of the interview — the fallback when someone would rather not talk.

type Message = { from: "ai" | "me"; text: string };

const STANCE_LABEL: Record<Stance, string> = {
  yea: "YES",
  nay: "NO",
  unsure: "NOT SURE",
  skip: "SKIPPED",
};

export function InterviewStep({
  answers,
  onAnswer,
  onDone,
}: {
  answers: Answers;
  onAnswer: (id: string, stance: Stance, said?: string) => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "ai",
      text: `Hey! I'm going to ask you about ${QUESTIONS.length} things that matter in Miami. Answer in your own words, or just tap. There are no right answers.`,
    },
    { from: "ai", text: QUESTIONS[0].question },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const question = QUESTIONS[index] as Question | undefined;
  const answered = Object.keys(answers).length;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  function record(stance: Stance, mine: string, reply?: string, said?: string) {
    if (!question) return;
    onAnswer(question.id, stance, said);
    const next = QUESTIONS[index + 1];
    const ack =
      reply ??
      (stance === "skip"
        ? "No problem, skipping that one."
        : `Got it — counting that as ${STANCE_LABEL[stance]} on ${question.short.toLowerCase()}.`);
    setMessages((m) => [
      ...m,
      { from: "me", text: mine },
      { from: "ai", text: ack },
      { from: "ai", text: next ? next.question : "That's all of them. Let's see where you stand." },
    ]);
    setIndex(index + 1);
  }

  async function sendTyped() {
    const text = draft.trim();
    if (!text || !question || thinking) return;
    setDraft("");
    setThinking(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: question.id, answer: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.stance === "unclear") {
        // Stay on the same question; the reply is a follow-up.
        setMessages((m) => [...m, { from: "me", text }, { from: "ai", text: json.reply }]);
      } else {
        const stance: Stance = json.stance === "yes" ? "yea" : json.stance === "no" ? "nay" : "unsure";
        record(stance, text, `${json.reply} (Recorded: ${STANCE_LABEL[stance]}.)`, text);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "me", text },
        {
          from: "ai",
          text:
            e instanceof Error && e.message
              ? e.message
              : "I didn't catch that. Tap Yes, No or Not sure instead.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
        <span>{question ? THEMES[question.theme].label : "Interview"}</span>
        <span className="text-foreground/50">
          {Math.min(index + 1, QUESTIONS.length)} of {QUESTIONS.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {messages.map((m, i) =>
          m.from === "ai" ? (
            <div key={i} className="max-w-[88%] self-start rounded-3xl rounded-bl-md bg-card px-4 py-3">
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[88%] self-end rounded-3xl rounded-br-md bg-foreground px-4 py-3 text-background"
            >
              {m.text}
            </div>
          ),
        )}
        {thinking && (
          <div className="max-w-[88%] animate-pulse self-start rounded-3xl rounded-bl-md bg-card px-4 py-3 text-foreground/60">
            Gemma 4 is reading your answer…
          </div>
        )}
        {/* Scroll target: its margin keeps the last bubble clear of the sticky button panel. */}
        <div ref={bottom} className="scroll-mb-72" />
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 bg-background pb-2 pt-3">
        {question && (
          <>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendTyped();
              }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your answer…"
                aria-label="Your answer"
                disabled={thinking}
                className="min-w-0 flex-1 rounded-2xl border border-foreground/25 bg-card px-4 py-3 outline-none focus:ring-4 focus:ring-accent/30"
              />
              <button
                type="submit"
                disabled={!draft.trim() || thinking}
                aria-label="Send"
                className="rounded-2xl bg-foreground px-4 font-bold text-background disabled:opacity-40"
              >
                ➤
              </button>
            </form>
            <div className="grid grid-cols-4 gap-2 text-sm font-bold">
              <button type="button" disabled={thinking} onClick={() => record("yea", "Yes")} className="rounded-xl border border-foreground/25 bg-card py-2.5 disabled:opacity-40">
                👍 Yes
              </button>
              <button type="button" disabled={thinking} onClick={() => record("nay", "No")} className="rounded-xl border border-foreground/25 bg-card py-2.5 disabled:opacity-40">
                👎 No
              </button>
              <button type="button" disabled={thinking} onClick={() => record("unsure", "Not sure")} className="rounded-xl border border-foreground/30 py-2.5 disabled:opacity-40">
                Not sure
              </button>
              <button type="button" disabled={thinking} onClick={() => record("skip", "Skip")} className="rounded-xl border border-foreground/30 py-2.5 disabled:opacity-40">
                Skip
              </button>
            </div>
          </>
        )}
        {(!question || answered >= 2) && (
          <button
            type="button"
            onClick={onDone}
            className={`rounded-2xl px-4 py-4 text-lg font-bold ${
              question ? "border border-foreground/25" : "bg-accent text-background"
            }`}
          >
            See where I stand ▶
          </button>
        )}
        <p className="text-center text-xs text-foreground/60">
          Gemma 4 reads your answers · {answered} recorded
        </p>
      </div>
    </main>
  );
}
