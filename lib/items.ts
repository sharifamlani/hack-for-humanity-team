import itemsJson from "@/data/items.json";

export type Theme = "forces" | "wildlife" | "jobs";

export type Item = {
  roll: number;
  theme: Theme;
  bill: string;
  title: string;
  date: string;
  result: string;
  yea: number;
  nay: number;
  cutpoint: number;
  yeaDirection: number;
  memberVotes: Record<string, "yea" | "nay" | null>;
  question: string;
  summary: string;
  hook: string;
  billUrl: string;
  voteUrl: string;
};

export const ITEMS = itemsJson.items as Item[];
export const MEMBERS = itemsJson.members as Record<string, { name: string; nominate_dim1: number }>;

export const THEMES: Record<Theme, { emoji: string; label: string; color: string }> = {
  forces: { emoji: "🌊", label: "Water · air · land · fire", color: "bg-water" },
  wildlife: { emoji: "🐢", label: "Wildlife", color: "bg-wildlife" },
  jobs: { emoji: "🎓", label: "Jobs & staying in Miami", color: "bg-jobs" },
};

export const THEME_KEYS = Object.keys(THEMES) as Theme[];

// Interview order: one vote from each theme in turn, so stopping early still covers all three.
export const INTERVIEW_ORDER: Item[] = (() => {
  const groups = THEME_KEYS.map((t) => ITEMS.filter((i) => i.theme === t));
  const out: Item[] = [];
  for (let i = 0; i < Math.max(...groups.map((g) => g.length)); i++) {
    for (const g of groups) if (g[i]) out.push(g[i]);
  }
  return out;
})();
