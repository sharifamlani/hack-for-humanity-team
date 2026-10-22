import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const DESCRIPTION =
  "Miami-Dade redrew its districts. See who's really on your ballot, in their own words, and where you vote on Nov 3.";

// The preview tags LinkedIn, Facebook, WhatsApp and X read when someone shares the link; the
// image comes from app/opengraph-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL("https://yourballotyourblock.com"),
  title: "Your Ballot. Your Block.",
  description: DESCRIPTION,
  openGraph: {
    title: "Your Ballot. Your Block.",
    description: DESCRIPTION,
    url: "/",
    siteName: "Your Ballot. Your Block.",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "Your Ballot. Your Block.", description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
