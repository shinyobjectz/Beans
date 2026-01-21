---
name: ralph-loop
description: >
  Continuous iteration until success criteria are met. The Ralph 
  Wiggum Loop pattern for autonomous, self-improving development.
allowed-tools: "Read,Bash(claude:*,git:*,npm:*,pytest:*,go:*)"
version: "2.5.0"
author: "Geoffrey Huntley / tzachbon"
license: "MIT"
---

# Ralph Loop - Iterative Execution

Run Claude Code in a loop until task is complete.

## Core Concept

```
while (iteration < max && !successCriteriaMet):
    1. Build context (task + tests + git + research)
    2. Send to Claude
    3. Claude implements/fixes
    4. Run tests
    5. Check success criteria
    6. Commit iteration
    7. Log progress
```

## Success Criteria

Machine-checkable completion signals:

```bash
# Basic checks
all tests pass              # npm test exits 0
no linting errors           # eslint/pylint clean
coverage >= 85%             # Coverage threshold

# Advanced
file_exists src/auth.ts     # File must exist
<promise>Done</promise>     # Agent signals completion

# Compound
all tests pass && coverage >= 85% && no linting errors
```

## Iteration Tracking

Each iteration logged to `.beads/progress.txt`:
```
## Iteration 3 - 2026-01-21 14:30:00
- Tests: 25/42 passing
- Coverage: 65%
- Error: Token validation incomplete
- Commit: abc123
```

## Integration with Beads

Ralph updates Beads after each iteration:
- `beans.ralph_iteration` - Current count
- `beans.ralph_last_error` - Most recent error
- `beans.iterations[]` - Full history

## Plugins

Two spec-driven approaches available:
- **ralph-speckit** - Constitution-first, GitHub spec-kit methodology
- **ralph-specum** - Research → Requirements → Design → Tasks → Implement
