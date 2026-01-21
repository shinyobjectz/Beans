---
description: Complete work - commit, push, close issue, sync
---

# /beans:land

Finish your current work and push to remote.

## Usage

```bash
/beans:land
/beans:land task-001    # Land specific issue
```

## What It Does

1. **Commits** any uncommitted changes
2. **Pushes** to remote branch
3. **Closes** the beads issue
4. **Syncs** beads state with git

## Implementation

```bash
# Get current issue (from spec or argument)
if [ -n "$1" ]; then
  ISSUE_ID="$1"
elif [ -f ./specs/.current-spec ]; then
  SPEC=$(cat ./specs/.current-spec)
  # Extract issue ID from spec state if stored
  ISSUE_ID=$(cat "./specs/$SPEC/.ralph-state.json" 2>/dev/null | jq -r '.issueId // empty')
fi

# Commit any changes
git add -A
git commit -m "feat: complete $SPEC" || true

# Push
git push origin HEAD

# Close issue if we have one
if [ -n "$ISSUE_ID" ]; then
  bd close "$ISSUE_ID" --reason "Implemented via BEANS"
fi

# Sync beads
bd sync

echo "✅ Landed successfully!"
```
