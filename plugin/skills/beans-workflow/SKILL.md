---
name: beans-workflow
description: >
  BEANS autonomous development workflow combining Beads (memory), 
  Ralph Loop (iteration), and Valyu (research) for extended 
  development horizons with persistent context.
allowed-tools: "Read,Bash(bd:*,beans:*,git:*,npm:*,bun:*)"
version: "1.0.0"
author: "Project.Social"
license: "MIT"
---

# BEANS Workflow

Autonomous development from prompt to PR.

## Core Components

| Component | Purpose | Package |
|-----------|---------|---------|
| **Beads** | Git-backed memory, issue tracking | `package/beads` |
| **Ralph Loop** | Iterative execution until success | `package/smart-ralph` |
| **Valyu** | Knowledge retrieval, research | `package/valyu` |

## Workflow Phases

### 1. Task Creation
```bash
bd create "Feature description" -t feature
# Or via /beans "Feature description"
```

### 2. Research (Valyu)
- Auto-generates queries from task keywords
- Searches academic, web, financial sources
- Caches results for 7 days
- Injects context into prompts

### 3. Iteration (Ralph Loop)
```
while (iteration < max && !success):
  1. Read task context from Beads
  2. Fetch research from Valyu
  3. Build prompt (context + tests + git)
  4. Send to Claude
  5. Run tests, check criteria
  6. Commit changes
  7. Update Beads
```

### 4. Completion
- Success criteria met → Create PR, close issue
- Max iterations → Human review needed

## Success Criteria Syntax

```
all tests pass                    # Exit code 0
coverage >= 85%                   # Threshold
no linting errors                 # Zero violations
all tests pass && coverage >= 85% # Compound
```

## Session Protocol

**Always land the plane:**
```bash
/beans:land
# Or: bd sync && git push
```

## Resources

- [BEANS-Integration-Plan.md](../../BEANS-Integration-Plan.md) - Full architecture
- [package/beads](../../package/beads) - Beads CLI
- [package/smart-ralph](../../package/smart-ralph) - Ralph plugins
- [package/valyu](../../package/valyu) - Valyu MCP
