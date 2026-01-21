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
1. Create beads issue: `bd create "$description" -t feature`
2. Extract issue ID from output
3. Create spec directory: `./specs/<name>/`
4. Delegate to research-analyst agent
5. After research → delegate to product-manager
6. After requirements → delegate to architect-reviewer  
7. After design → delegate to task-planner
8. After tasks → delegate to spec-executor
9. On completion → `bd close <id>` + `bd sync` + `git push`

### Existing Issue (issue-id pattern)
1. Load issue: `bd show <id>`
2. Check for existing spec in `./specs/`
3. Resume from current phase or start fresh

### Quick Mode (--quick flag)
Skip interactive review between phases. Auto-generate all artifacts and start execution immediately.
