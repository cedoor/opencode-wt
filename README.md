# opencode-wt

Create git worktrees and open opencode in them.

## Usage

```bash
# Create a detached worktree
npx opencode-wt

# Create a worktree for an issue
npx opencode-wt 42

# Create a worktree for an issue with a specific agent
npx opencode-wt 42 my-agent
```

- `issueNumber` — creates a branch named `issue-<number>` and opens opencode in it
- `agent` — optional, passes `--agent` to opencode

Worktrees are created in `.worktrees/` at the git root (auto-added to `.gitignore`).
