---
description: BEANS - Autonomous development (create issue → research → plan → build → land)
argument-hint: ["description" | issue-id | status | --quick]
---

# /beans - Autonomous Development

Single command for the entire development lifecycle.

## Usage

```bash
/beans                              # List ready issues
/beans status                       # Show current task status
/beans "Add OAuth2 login"           # Full flow: issue → research → plan → build
/beans "Add OAuth2 login" --quick   # Quick mode: skip interactive phases
/beans task-001                     # Continue existing issue
```

## What It Does

1. **Creates issue** in beads (`bd create`)
2. **Researches** your codebase
3. **Plans** requirements, design, and tasks
4. **Builds** by executing tasks autonomously
5. **Lands** with commit, push, and issue close

## Arguments

| Argument | Action |
|----------|--------|
| (none) | List ready issues (`bd ready`) |
| `status` | Show current spec + issue status |
| `"description"` | Create issue and start full flow |
| `issue-id` | Continue work on existing issue |
| `--quick` | Skip interactive phases |

## Flow

```
/beans "Add feature X"
         │
         ▼
    Create Issue (bd create)
         │
         ▼
    Research Codebase
         │
         ▼
    Generate Plan (requirements → design → tasks)
         │
         ▼
    Execute Tasks (with quality checks)
         │
         ▼
    Land (commit, push, close issue)
```

## Implementation

When invoked, determine the action:

### List Issues (no args or "list")
```bash
bd ready
```

### Show Status
```bash
bd list --status in_progress
cat ./specs/.current-spec 2>/dev/null
```

### New Feature (quoted description)

```bash
# 1. Create beads issue
ISSUE=$(bd create "$description" -t feature --json | jq -r '.id')
mkdir -p ./specs/${ISSUE}

# 2. Initialize state
cat > ./specs/${ISSUE}/.beans-state.json << EOF
{"issueId": "$ISSUE", "phase": "research", "description": "$description"}
EOF
```

**3. Invoke research-analyst** (uses Valyu MCP + code intelligence):
```
Task: Research codebase and external sources for: $description

Use valyu:knowledge MCP for external research.
Use ast-grep/repomix for codebase analysis.
Output: ./specs/${ISSUE}/research.md

subagent_type: research-analyst
```

**4. Invoke product-manager** → requirements.md

**5. Invoke architect-reviewer** → design.md

**6. Invoke task-planner** → tasks.md

**7. Invoke spec-executor** (iterates until complete):
```
Task: Execute tasks from ./specs/${ISSUE}/tasks.md

Read each task, implement, verify with tests/lint.
Mark complete in .beans-state.json.

subagent_type: spec-executor
```

**8. Land:**
```bash
bd close $ISSUE --reason "Implemented"
bd sync && git push
```

### Existing Issue (issue-id pattern)
1. Load issue: `bd show <id>`
2. Check for existing spec in `./specs/`
3. Resume from current phase or start fresh

### Quick Mode (--quick flag)
Skip interactive review between phases. Auto-generate all artifacts and start execution immediately.
