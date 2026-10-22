// What a voter shares with friends: only the app's address and a neutral invite, never their
// own address, answers or matches. Plain links, no share scripts, so no network sees a visit
// until someone taps.

export const SHARE_URL = "https://yourballotyourblock.com";
export const SHARE_DOMAIN = "yourballotyourblock.com";
export const SHARE_TEXT =
  "Miami-Dade redrew its districts. See who's really on your ballot, in their own words, and where you vote on Nov 3:";

export type ShareNetwork = "linkedin" | "facebook" | "x" | "whatsapp" | "sms";

// LinkedIn and Facebook take only the URL and build the post from the page's preview tags
// (app/layout.tsx, app/opengraph-image.tsx); the others carry the invite text too.
export function shareLinks(url = SHARE_URL, text = SHARE_TEXT): Record<ShareNetwork, string> {
  const u = encodeURIComponent(url);
  const withUrl = encodeURIComponent(`${text} ${url}`);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${u}`,
    whatsapp: `https://wa.me/?text=${withUrl}`,
    // "?&body=" works in both iOS and Android messaging apps.
    sms: `sms:?&body=${withUrl}`,
  };
}
