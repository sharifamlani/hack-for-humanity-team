"use client";

import { useState } from "react";
import { SHARE_DOMAIN, SHARE_TEXT, SHARE_URL, shareLinks } from "@/lib/share";

const LINKS = shareLinks();
const NETWORKS: { label: string; href: string }[] = [
  { label: "LinkedIn", href: LINKS.linkedin },
  { label: "Facebook", href: LINKS.facebook },
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

  async function copyLink(then?: string) {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setHint(then ?? null);
    } catch {
      setHint(`Copy this link: ${SHARE_URL}`);
    }
  }

  // Instagram has no web share link: phones get the system share sheet (which lists
  // Instagram); elsewhere the link is copied with a pointer to paste it.
  async function instagram() {
    if (navigator.share) {
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
          {NETWORKS.slice(0, 2).map((n) => (
            <a key={n.label} href={n.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${n.label}`} className={pill}>
              {n.label}
            </a>
          ))}
          <button type="button" onClick={instagram} aria-label="Share on Instagram" className={pill}>
            Instagram
          </button>
          {NETWORKS.slice(2).map((n) => (
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
