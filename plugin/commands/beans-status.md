---
description: Show current BEANS task and spec status
---

# /beans:status

Show the current state of your BEANS workflow.

## Usage

```bash
/beans:status
```

## Output

Shows:
1. **Current Issue** - Active beads issue (if any)
2. **Current Spec** - Active spec and phase
3. **Progress** - Tasks completed vs remaining
4. **Recent Activity** - Last few actions

## Implementation

```bash
# Current beads status
echo "=== Issues ==="
bd list --status in_progress

# Current spec
echo ""
echo "=== Spec ==="
if [ -f ./specs/.current-spec ]; then
  SPEC=$(cat ./specs/.current-spec)
  echo "Active: $SPEC"
  
  if [ -f "./specs/$SPEC/.ralph-state.json" ]; then
    cat "./specs/$SPEC/.ralph-state.json" | jq '{phase, taskIndex, totalTasks}'
  fi
else
  echo "No active spec"
fi

# Recent git activity
echo ""
echo "=== Recent Commits ==="
git log --oneline -5
```
