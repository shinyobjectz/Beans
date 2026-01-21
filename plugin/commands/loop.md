---
description: Run Ralph Loop on active task
argument-hint: [task-id] [--iterations N]
---

# /beans:loop - Execute Ralph Loop

Run the autonomous iteration loop on a task until success criteria are met.

## Usage

```bash
/beans:loop task-001                 # Run loop on task
/beans:loop task-001 --iterations 20 # Custom max iterations
/beans:loop --continue               # Resume last active task
```

## What It Does

Each iteration:
1. Reads task context from beads
2. Fetches research from Valyu (if enabled)
3. Builds prompt with context, tests, git status
4. Sends to Claude for implementation
5. Runs tests, checks success criteria
6. Commits changes, updates beads
7. Repeats until success or max iterations

## Success Criteria

Defined per-task, e.g.:
```
all tests pass && coverage >= 85% && no linting errors
```

## Monitoring

```bash
tail -f .beads/progress.txt
beans watch --show all
```
