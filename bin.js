#!/usr/bin/env node
const { execSync } = require("child_process");
const { mkdirSync, existsSync, readFileSync, appendFileSync } = require("fs");
const { join } = require("path");

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

// Ensure .worktrees is git-ignored
const gitignore = join(root, ".gitignore");
if (!existsSync(gitignore) || !readFileSync(gitignore, "utf-8").includes(".worktrees/")) {
  appendFileSync(gitignore, "\n# Local worktrees\n.worktrees/\n");
}

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

execSync(`opencode "${wtDir}"`, { stdio: "inherit" });
