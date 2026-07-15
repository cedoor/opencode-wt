#!/usr/bin/env node
import { execSync } from "child_process";
import { mkdirSync, existsSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";

const name = process.argv[2];
let root;
try {
  root = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
} catch {
  console.error("Error: not inside a git repository");
  process.exit(1);
}

const worktreesDir = join(root, ".worktrees");
const wtDir = join(worktreesDir, name || Date.now().toString());

// Check if .worktrees is git-ignored
const gitignore = join(root, ".gitignore");
const isGitignored =
  existsSync(gitignore) && readFileSync(gitignore, "utf-8").includes(".worktrees/");

mkdirSync(worktreesDir, { recursive: true });

if (name) {
  try {
    execSync(`git worktree add "${wtDir}" -b ${name}`, { stdio: "inherit" });
  } catch {
    execSync(`git worktree add "${wtDir}" ${name}`, { stdio: "inherit" });
  }
} else {
  execSync(`git worktree add --detach "${wtDir}"`, { stdio: "inherit" });
}

let prompt = `Welcome the user and ask what they'd like to work on. You are running inside a git worktree at "${wtDir}" — a separate working directory linked to the main repo. The main repo is at "${root}". Keep this in mind for file paths and git operations. Always use "${wtDir}" as your working directory — worktrees have separate working directories, so files created in the main repo won't be visible here, and vice versa.`;
if (!isGitignored) {
  prompt += " Also, .worktrees/ is not in .gitignore — ask the user if they'd like to add it (editing .gitignore here affects the main repo since worktrees share the same git root).";
}
execSync(`opencode "${wtDir}" --prompt "${prompt}"`, { stdio: "inherit" });
