---
name: beans-workflow
description: >
  BEANS autonomous development: /beans "feature" → research → plan → build → land.
  Combines Beads (memory), Ralph (iteration), Valyu (research), Code Intelligence.
allowed-tools: "Read,Write,Bash,Grep,Glob,MCP(valyu:knowledge)"
version: "2.0.0"
author: "Project.Social"
license: "MIT"
---

# BEANS Workflow

Single command autonomous development: `/beans "Add feature X"`

## The `/beans` Command

```bash
/beans                         # List ready issues
/beans "Add OAuth2 login"      # Full flow: issue → research → plan → build
/beans task-001                # Continue existing issue
/beans:status                  # Show progress
/beans:land                    # Commit, push, close
```

## What Happens

```
/beans "Add feature"
    │
    ├─→ bd create (beads issue)
    │
    ├─→ research-analyst (Valyu MCP + ast-grep)
    │         ↓
    │    specs/<id>/research.md
    │
    ├─→ product-manager → requirements.md
    ├─→ architect-reviewer → design.md  
    ├─→ task-planner → tasks.md
    │
    ├─→ spec-executor (loops until done)
    │         ↓
    │    Code changes
    │
    └─→ bd close + bd sync + git push
```

## Subagents

| Agent | Phase | Tools |
|-------|-------|-------|
| research-analyst | Research | Valyu MCP, ast-grep, repomix |
| product-manager | Requirements | Read, Grep |
| architect-reviewer | Design | Read, Grep |
| task-planner | Tasks | Read, Grep |
| spec-executor | Build | Read, Write, Bash |
| code-reviewer | Quality | ReadLints, Grep |
| test-engineer | Testing | Bash |

Invoke via Task tool with `subagent_type: <agent-name>`.

## Communication Style

- Be extremely concise. Fragments over sentences.
- Tables over paragraphs. Bullets over prose.
- Skip filler: "It should be noted that...", "In order to..."

## Reality Verification

Never assume success. Always verify:
- Run commands, check exit codes
- Read files after writing
- Run tests after changes
- Check lints before commit

## Session Protocol

**Always land the plane at session end:**
```bash
/beans:land  # Or: bd sync && git push
```

## Related Skills

- [beads/](../beads/) - Advanced issue tracking (dependencies, molecules, worktrees)
- [ralph/](../ralph/) - Advanced iteration (PRD format, exit conditions)
- [beans-research/](../beans-research/) - Valyu MCP details
