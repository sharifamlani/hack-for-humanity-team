"use client";

import { useState } from "react";
import { SHARE_DOMAIN, SHARE_MESSAGE, SHARE_TEXT, SHARE_URL, shareLinks } from "@/lib/share";

const LINKS = shareLinks();
// LinkedIn and Facebook are drawn on their own below; these are the plain links.
const NETWORKS: { label: string; href: string }[] = [
  { label: "WhatsApp", href: LINKS.whatsapp },
  { label: "X", href: LINKS.x },
  { label: "Text", href: LINKS.sms },
];
const pill =
  "rounded-full border border-foreground/30 px-4 py-2 text-center text-sm font-semibold hover:border-accent hover:text-accent";

// "Share it with your friends": the QR plus one-tap shares. Only the app's address goes out,
// never anything about the voter.
export function ShareCard() {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Copies inside the tap itself. navigator.clipboard.writeText can wait indefinitely when the
  // tab is not focused, which left the button with no feedback, so the synchronous copy goes
  // first and the async API is the fallback.
  function copyLink(then?: string, value = SHARE_URL) {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let done = false;
    try {
      done = document.execCommand("copy");
    } catch {
      done = false;
    }
    area.remove();
    if (!done && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => setHint(`Copy this: ${value}`));
      done = true;
    }
    if (!done) {
      setHint(`Copy this: ${value}`);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setHint(then ?? null);
  }

  // Instagram has no web share link: phones get the system share sheet (which lists
  // Instagram); elsewhere the link is copied with a pointer to paste it.
  async function instagram() {
    // Desktop browsers have a share sheet too, but Instagram is only in the phone's.
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Your Ballot. Your Block.", text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch {
        // Cancelled or refused: fall through to copying.
      }
    }
    copyLink("Link copied: paste it in your Instagram story, or save the QR code to post.");
  }

  return (
    <section className="card flex flex-col items-center gap-5 p-5 md:flex-row md:items-start">
      {/* White padding so the code scans off a dark projector. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/qr-live-site.png"
        alt={`QR code linking to ${SHARE_DOMAIN}`}
        width={168}
        height={168}
        className="h-[168px] w-[168px] shrink-0 rounded-lg bg-white p-2"
      />
      <div className="flex w-full min-w-0 flex-col gap-3">
        <div>
          <p className="display text-2xl">Share it with your friends</p>
          <p className="text-sm text-foreground/70">Help someone on your block find their ballot.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className={pill}>
            LinkedIn
          </a>
          {/* Facebook does not let sites fill in the post, so the message is copied on the way out. */}
          <a
            href={LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on Facebook"
            onClick={() => copyLink("Message copied: paste it in your Facebook post.", SHARE_MESSAGE)}
            className={pill}
          >
            Facebook
          </a>
          <button type="button" onClick={instagram} aria-label="Share on Instagram" className={pill}>
            Instagram
          </button>
          {NETWORKS.map((n) => (
            <a
              key={n.label}
              href={n.href}
              target={n.label === "Text" ? undefined : "_blank"}
              rel="noopener noreferrer"
              aria-label={n.label === "Text" ? "Share by text message" : `Share on ${n.label}`}
              className={pill}
            >
              {n.label}
            </a>
          ))}
          <button type="button" onClick={() => copyLink()} aria-label="Copy the link" className={pill}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <a href="/qr-live-site.png" download="your-ballot-your-block-qr.png" aria-label="Save the QR code" className={pill}>
            Save QR code
          </a>
        </div>
        <p className="text-sm font-semibold text-accent">{SHARE_DOMAIN}</p>
        {hint && <p className="text-sm text-foreground/80">{hint}</p>}
      </div>
    </section>
  );
}
