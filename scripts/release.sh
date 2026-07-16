#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: pnpm release <version>" >&2
  echo "  e.g. pnpm release 1.5.0" >&2
  exit 1
fi

version="$1"
# Strip leading v if provided
version="${version#v}"

if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: invalid semver version: $version" >&2
  exit 1
fi

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

# Ensure we're on main
branch="$(git branch --show-current)"
if [[ "$branch" != "main" ]]; then
  echo "Error: must be on main branch (currently on $branch)" >&2
  exit 1
fi

# Update version in package.json
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$version';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Commit and tag
git add package.json
git commit -m "v$version"
git tag "v$version"
git push origin main --tags

echo "Released v$version"
