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
  issue-number    GitHub issue number (creates branch issue-<N> and tells the agent about it)
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

// Install dependencies and build if a lockfile is present
const lockfiles = {
  "pnpm-lock.yaml": { install: "pnpm install", build: "pnpm build" },
  "package-lock.json": { install: "npm install", build: "npm run build" },
  "yarn.lock": { install: "yarn install", build: "yarn build" },
  "bun.lockb": { install: "bun install", build: "bun run build" },
};
for (const [file, { install, build }] of Object.entries(lockfiles)) {
  if (existsSync(join(wtDir, file))) {
    execSync(install, { cwd: wtDir, stdio: "inherit" });
    const pkgPath = join(wtDir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.scripts?.build) {
        execSync(build, { cwd: wtDir, stdio: "inherit" });
      }
    }
    break;
  }
}

let prompt = `Welcome the user and ask what they'd like to work on. You are running inside a git worktree at "${wtDir}" — a separate working directory linked to the main repo. Always use "${wtDir}" as your working directory — worktrees have separate working directories, so files created in the main repo won't be visible here, and vice versa.`;
if (issueNumber) {
  prompt += ` The user created this worktree for issue #${issueNumber}. Use your GitHub tools to fetch the issue details and ask if they'd like to start working on it.`;
}
if (!isGitignored) {
  prompt += ' Also, .worktrees/ is not in .gitignore — ask the user if they\'d like to add it. If they do, edit the .gitignore at the worktree path ("' + wtDir + '/.gitignore") — do not edit files outside the worktree.';
}
const agentFlag = agent ? ` --agent ${agent}` : "";
execSync(`opencode --prompt "${prompt}"${agentFlag}`, { cwd: wtDir, stdio: "inherit" });
