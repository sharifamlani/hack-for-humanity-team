// What a voter shares with friends: only the app's address and a neutral invite, never their
// own address, answers or matches. Plain links, no share scripts, so no network sees a visit
// until someone taps.

export const SHARE_URL = "https://yourballotyourblock.com";
export const SHARE_DOMAIN = "yourballotyourblock.com";
export const SHARE_TEXT =
  "Miami-Dade redrew its districts. See who's really on your ballot, in their own words, and where you vote on Nov 3:";

// The whole message, as pasted into a post.
export const SHARE_MESSAGE = `${SHARE_TEXT} ${SHARE_URL}`;

export type ShareNetwork = "linkedin" | "facebook" | "x" | "whatsapp" | "sms";

// The message goes in the post wherever the network allows it, and the link in it unfurls into
// the preview card (app/layout.tsx, app/opengraph-image.tsx). LinkedIn's feed composer takes the
// text; Facebook does not allow any site to fill in the post, so ShareCard copies the message
// for the voter to paste.
export function shareLinks(url = SHARE_URL, text = SHARE_TEXT): Record<ShareNetwork, string> {
  const u = encodeURIComponent(url);
  const withUrl = encodeURIComponent(`${text} ${url}`);
  return {
    linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${withUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${u}`,
    whatsapp: `https://wa.me/?text=${withUrl}`,
    // "?&body=" works in both iOS and Android messaging apps.
    sms: `sms:?&body=${withUrl}`,
  };
}
