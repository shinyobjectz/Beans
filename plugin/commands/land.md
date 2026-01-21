---
description: End session - commit, push, cleanup
argument-hint: [task-id]
---

# /beans:land - Land the Plane

Session cleanup protocol - ensures all work is saved and pushed.

## Usage

```bash
/beans:land                  # Land current task
/beans:land task-001         # Land specific task
```

## What It Does

1. **Updates beads** with final iteration state
2. **Commits** all uncommitted changes
3. **Pushes** branch to origin
4. **Creates PR** if task is complete
5. **Generates handoff** prompt for next session
6. **Returns to main** branch

## Session Handoff

Creates `.beads/handoff.md` with:
- Progress summary (iterations, tests, coverage)
- Last known error
- Next steps
- Files changed
- Research findings used

## Critical Rule

**Never end a session without landing the plane.**

Work is NOT complete until `git push` succeeds.
