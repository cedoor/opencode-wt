# opencode-wt

Creates git worktrees and opens opencode in them.

## Usage

```bash
# Create a detached worktree
npx opencode-wt

# Create a worktree for an issue (requires a GitHub repository)
npx opencode-wt 42

# Create a worktree for an issue with a specific agent
npx opencode-wt 42 my-agent
```

- `issueNumber` — creates a branch named `issue-<number>` and opens opencode in it. Requires the repository to be hosted on GitHub and the [`gh`](https://cli.github.com/) CLI to be installed.
- `agent` — optional, passes `--agent` to opencode

Worktrees are created in `.worktrees/` at the git root (auto-added to `.gitignore`).

## Flags

```
-h, --help      Show help message
-v, --version   Show version number
```
