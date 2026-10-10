# data/positions/

What each candidate has said in their own words, and how it was read. Everything here was
collected and built during the event on Oct 10, 2026.

| File | What it is | Built by |
|---|---|---|
| `../candidates/sites/*.csv` | The pages we read: candidate, URL, kind of page, how it was found | research agents, checked by fetching each URL |
| `chunks.json` | The exact visible text of those pages, cut into short passages, each with its URL | `scripts/scrape-positions.mjs` |
| `embeddings.json` | One vector per passage and per interview question (`gemini-embedding-2`) | `scripts/embed-positions.mjs` |
| `stances.json` | Candidate × question: yes / no / none, with the quote and link | `scripts/build-stances.mjs` |

Check it with `node scripts/verify-stances.mjs`.

## How a position gets on screen

1. Cosine similarity finds the candidate's five closest passages to a question.
2. **Gemma 4** reads those passages and decides whether they answer the question yes, no, or
   not at all. It is told to answer "none" when in doubt.
3. The position is kept **only if the quote Gemma gives is in the passage word for word.**
   Otherwise it is recorded as "none".

## Rules

- Only the candidate's own pages are used: campaign sites, official government sites, press
  releases. News articles are left out because they quote several people.
- "none" means we found nothing that clearly answers the question. It does not mean the
  candidate has no view.
- Two candidates have no website we could find (Meidinger Hosey, Jassenoff), so they have no
  positions here.
- The embedding model only finds passages. Every decision is Gemma 4's, and every one is
  checkable against the linked page.
