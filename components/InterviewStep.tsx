"use client";

import { useEffect, useRef, useState } from "react";
import { INTERVIEW_ORDER, THEMES, type Item } from "@/lib/items";

export type Stance = "yea" | "nay" | "unsure" | "skip";
export type Answers = Record<number, Stance>;

type Message = { from: "ai" | "me"; text: string; item?: Item };

const FIRST_ROUND = 6; // two votes per theme; enough to place someone, short enough to finish

const STANCE_LABEL: Record<Stance, string> = {
  yea: "YES",
  nay: "NO",
  unsure: "NOT SURE",
  skip: "SKIPPED",
};

const ask = (item: Item): Message => ({ from: "ai", text: `${item.hook} ${item.question}`, item });

export function InterviewStep({
  answers,
  onAnswer,
  onDone,
}: {
  answers: Answers;
  onAnswer: (roll: number, stance: Stance) => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "ai",
      text: "Hey! I'm going to ask you about a few things Congress actually voted on. Answer in your own words, or just tap. There are no right answers.",
    },
    ask(INTERVIEW_ORDER[0]),
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const item = INTERVIEW_ORDER[index] as Item | undefined;
  const answered = Object.keys(answers).length;
  const atBreak = index === FIRST_ROUND && !keepGoing;
  const finished = !item;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  function record(stance: Stance, mine: string, reply?: string) {
    if (!item) return;
    onAnswer(item.roll, stance);
    const nextItem = INTERVIEW_ORDER[index + 1];
    const ack =
      reply ??
      (stance === "skip"
        ? "No problem, skipping that one."
        : `Got it — counting that as ${STANCE_LABEL[stance]} on ${item.bill}.`);
    const out: Message[] = [{ from: "me", text: mine }, { from: "ai", text: ack }];
    if (index + 1 === FIRST_ROUND) {
      out.push({
        from: "ai",
        text: "That's enough to place you. Want to see where you stand, or answer a few more for a sharper picture?",
      });
    } else if (nextItem) {
      out.push(ask(nextItem));
    } else {
      out.push({ from: "ai", text: "That's all of them. Let's see where you stand." });
    }
    setMessages((m) => [...m, ...out]);
    setIndex(index + 1);
  }

  async function sendTyped() {
    const text = draft.trim();
    if (!text || !item || thinking) return;
    setDraft("");
    setThinking(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roll: item.roll, answer: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.stance === "unclear") {
        // Stay on the same vote; the reply is a follow-up question.
        setMessages((m) => [...m, { from: "me", text }, { from: "ai", text: json.reply }]);
      } else {
        const stance: Stance = json.stance === "yes" ? "yea" : json.stance === "no" ? "nay" : "unsure";
        record(stance, text, `${json.reply} (Recorded: ${STANCE_LABEL[stance]} on ${item.bill}.)`);
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
        <span>
          {item && !atBreak ? `${THEMES[item.theme].emoji} ${THEMES[item.theme].label}` : "Interview"}
        </span>
        <span className="text-foreground/50">
          {Math.min(index + (item && !atBreak ? 1 : 0), INTERVIEW_ORDER.length)} of{" "}
          {keepGoing ? INTERVIEW_ORDER.length : FIRST_ROUND}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {messages.map((m, i) =>
          m.from === "ai" ? (
            <div key={i} className="max-w-[88%] self-start rounded-3xl rounded-bl-md bg-card px-4 py-3">
              <p>{m.text}</p>
              {m.item && (
                <details className="mt-2 text-sm text-foreground/70">
                  <summary className="cursor-pointer font-semibold">
                    Real vote: {m.item.bill} · {m.item.date} ⓘ
                  </summary>
                  <p className="mt-1">{m.item.summary}</p>
                  <p className="mt-1">
                    {m.item.result} {m.item.yea}–{m.item.nay}.{" "}
                    <a className="underline" href={m.item.billUrl} target="_blank" rel="noreferrer">
                      Read the bill ↗
                    </a>{" "}
                    <a className="underline" href={m.item.voteUrl} target="_blank" rel="noreferrer">
                      See the roll call ↗
                    </a>
                  </p>
                </details>
              )}
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
        <div ref={bottom} />
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 bg-background pb-2 pt-3">
        {atBreak || finished ? (
          <>
            <button
              type="button"
              onClick={onDone}
              className="rounded-2xl bg-accent px-4 py-4 text-lg font-bold text-white shadow-[0_4px_0_0_var(--foreground)] active:translate-y-1 active:shadow-none"
            >
              See where I stand ▶
            </button>
            {atBreak && (
              <button
                type="button"
                onClick={() => {
                  setKeepGoing(true);
                  setMessages((m) => [...m, ask(INTERVIEW_ORDER[FIRST_ROUND])]);
                }}
                className="rounded-2xl border-2 border-foreground px-4 py-3 font-bold"
              >
                Ask me {INTERVIEW_ORDER.length - FIRST_ROUND} more
              </button>
            )}
          </>
        ) : (
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
                className="min-w-0 flex-1 rounded-2xl border-2 border-foreground bg-card px-4 py-3 outline-none focus:ring-4 focus:ring-accent/30"
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
              <button type="button" disabled={thinking} onClick={() => record("yea", "Yes")} className="rounded-xl border-2 border-foreground bg-card py-2.5 disabled:opacity-40">
                👍 Yes
              </button>
              <button type="button" disabled={thinking} onClick={() => record("nay", "No")} className="rounded-xl border-2 border-foreground bg-card py-2.5 disabled:opacity-40">
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
        <p className="text-center text-xs text-foreground/60">
          ⚡ Gemma 4 reads your answers · {answered} recorded · based on real House votes
        </p>
      </div>
    </main>
  );
}
