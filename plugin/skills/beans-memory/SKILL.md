---
name: beads-memory
description: >
  Git-backed distributed memory for multi-session work. Persistent 
  task tracking that survives conversation compaction.
allowed-tools: "Read,Bash(bd:*)"
version: "0.48.0"
author: "Steve Yegge"
license: "MIT"
---

# Beads - Persistent Task Memory

Git-backed issue tracker for AI agents.

## bd vs TodoWrite

| bd (persistent) | TodoWrite (ephemeral) |
|-----------------|----------------------|
| Multi-session work | Single-session tasks |
| Complex dependencies | Linear execution |
| Survives compaction | Conversation-scoped |
| Git-backed, team sync | Local to session |

**Decision**: "Will I need this in 2 weeks?" → YES = bd

## Essential Commands

```bash
bd prime          # Load AI-optimized context (auto on session start)
bd ready          # List unblocked, ready work
bd show <id>      # Full task details
bd create "title" # Create new issue
bd update <id>    # Modify task
bd close <id>     # Complete task
bd sync           # Persist to git
```

## Session Protocol

1. `bd ready` — Find unblocked work
2. `bd show <id>` — Get context
3. `bd update <id> --status in_progress` — Start
4. Work on task, add notes
5. `bd close <id> --reason "..."` — Complete
6. `bd sync` — **Always run at session end**

## BEANS Extension

Beads extended with `beans` metadata:
- `ralph_iteration` - Current iteration count
- `ralph_success_criteria` - Completion conditions
- `research_enabled` - Valyu integration
- `git_branch` - Associated branch
