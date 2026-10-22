#!/usr/bin/env node
// Deploys exactly what is committed at HEAD to production, never the working tree. Other
// sessions may have unfinished edits on disk (data rebuilds, half-done screens); a plain
// `vercel --prod` would upload those too. This checks HEAD out into a temporary git
// worktree, deploys from there, and removes it.
// Usage: node scripts/deploy-clean.mjs [--preview]
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });
const read = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

const root = read("git rev-parse --show-toplevel");
const sha = read("git rev-parse --short HEAD");
const unpushed = read("git log @{upstream}..HEAD --oneline");
if (unpushed) {
  console.error(`HEAD has unpushed commits; push first so the deploy matches the remote:\n${unpushed}`);
  process.exit(1);
}

const dir = path.join(mkdtempSync(path.join(tmpdir(), "deploy-clean-")), "app");
console.log(`deploying ${sha} from a clean worktree at ${dir}`);
run(`git worktree add --detach "${dir}" HEAD`, root);
try {
  // The Vercel project link is gitignored, so it has to be carried over.
  mkdirSync(path.join(dir, ".vercel"), { recursive: true });
  copyFileSync(path.join(root, ".vercel", "project.json"), path.join(dir, ".vercel", "project.json"));
  run(process.argv.includes("--preview") ? "vercel --yes" : "vercel --prod --yes", dir);
  console.log(`deployed ${sha}`);
} finally {
  // Windows can hold a file lock for a moment after vercel exits; a failed removal is
  // not a failed deploy, so fall back to pruning the worktree record.
  try {
    run(`git worktree remove --force "${dir}"`, root);
  } catch {
    run("git worktree prune", root);
    console.log(`worktree pruned; delete ${dir} by hand if it is still on disk`);
  }
}
