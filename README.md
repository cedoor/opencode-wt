# opencode-wt

Create git worktrees and open opencode in them.

## Usage

```bash
# Create a detached worktree
npx opencode-wt

# Create a worktree with a new branch
npx opencode-wt auth
```

Worktrees are created in `.worktrees/` at the git root (auto-added to `.gitignore`).
