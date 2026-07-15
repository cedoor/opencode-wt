#!/usr/bin/env node
import { execSync } from "child_process";
import { mkdirSync, existsSync, readFileSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const flag = process.argv[2];
if (flag === "--version" || flag === "-v") {
  const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));
  console.log(pkg.version);
  process.exit(0);
}
if (flag === "--help" || flag === "-h") {
  console.log(`Usage: opencode-wt [issue-number] [agent]

Create a git worktree and open opencode in it.

Arguments:
  issue-number    GitHub issue number (creates branch issue-<N> and fetches issue context)
  agent           Optional agent name passed to opencode

Flags:
  -h, --help      Show this help message
  -v, --version   Show version number

Examples:
  npx opencode-wt              # detached worktree
  npx opencode-wt 42           # worktree for issue #42
  npx opencode-wt 42 my-agent  # worktree for issue #42 with a specific agent`);
  process.exit(0);
}

const issueNumber = flag;
const agent = process.argv[3];
const name = issueNumber ? `issue-${issueNumber}` : undefined;
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

let issueContext = "";
if (issueNumber) {
  try {
    const issue = JSON.parse(
      execSync(`gh issue view ${issueNumber} --json title,body`, { encoding: "utf-8" })
    );
    issueContext = `\n\nThe user created this worktree for issue #${issueNumber}.\nTitle: ${issue.title}`;
    if (issue.body) {
      issueContext += `\nDescription:\n${issue.body}`;
    }
    issueContext += `\n\nAsk the user if they'd like to start working on this issue.`;
  } catch {
    issueContext = `\n\nThe user created this worktree for issue #${issueNumber}, but the issue could not be fetched from GitHub. Ask them what they'd like to work on.`;
  }
}

let prompt = `Welcome the user and ask what they'd like to work on. You are running inside a git worktree at "${wtDir}" — a separate working directory linked to the main repo. Always use "${wtDir}" as your working directory — worktrees have separate working directories, so files created in the main repo won't be visible here, and vice versa.${issueContext}`;
if (!isGitignored) {
  prompt += ' Also, .worktrees/ is not in .gitignore — ask the user if they\'d like to add it. If they do, edit the .gitignore at the worktree path ("' + wtDir + '/.gitignore") — do not edit files outside the worktree.';
}
const agentFlag = agent ? ` --agent ${agent}` : "";
execSync(`opencode "${wtDir}" --prompt "${prompt}"${agentFlag}`, { stdio: "inherit" });
