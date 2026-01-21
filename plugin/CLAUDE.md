# BEANS v2.0

> **B**eads + r**A**lph + val**U** = BEA**NS**

Autonomous development plugin for Claude Code.

## Commands

Only 3 commands to remember:

| Command | Description |
|---------|-------------|
| `/beans "Add feature X"` | Full autonomous flow |
| `/beans:status` | Show current task status |
| `/beans:land` | Commit, push, close issue |

### Usage Examples

```bash
/beans                              # List ready issues
/beans "Add OAuth2 login"           # Create issue → research → plan → build → land
/beans "Add OAuth2 login" --quick   # Skip interactive phases
/beans task-001                     # Continue existing issue
/beans:status                       # Check progress
/beans:land                         # Finish and push
```

## What `/beans` Does

```
/beans "Add feature X"
         │
         ├─→ Create Issue (beads)
         │
         ├─→ Research Codebase
         │
         ├─→ Generate Plan
         │     ├── requirements.md
         │     ├── design.md
         │     └── tasks.md
         │
         ├─→ Execute Tasks
         │     └── (with quality checks)
         │
         └─→ Land
               ├── commit
               ├── push
               └── close issue
```

## Subagents (Internal)

BEANS uses 13 specialized subagents internally:

| Agent | Role |
|-------|------|
| research-analyst | Codebase analysis |
| product-manager | Requirements |
| architect-reviewer | Design |
| task-planner | Task breakdown |
| spec-executor | Implementation |
| code-reviewer | Quality checks |
| test-engineer | Test coverage |
| optimizer | Fix issues |
| doc-generator | Documentation |
| integration-tester | E2E tests |

## Configuration

API keys stored in `~/.beans/config.json`:

```bash
beans config --valyu    # Set Valyu API key (research)
beans config --github   # Set GitHub token (PRs)
beans config --show     # Show current config
```

## Data Directories

```
.beans/                 # BEANS state
├── analysis/           # Code analysis results
├── context/            # Codebase snapshots
├── cache/              # Cached data
└── logs/               # Subagent logs

.beads/                 # Beads issue tracker
├── issues.jsonl        # Issue data
└── config.yaml         # Beads config

specs/                  # Spec artifacts
└── <feature>/
    ├── research.md
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Under the Hood

BEANS combines:
- **Beads** - 31 commands for issue tracking (`bd` CLI)
- **Ralph** - 13 commands for spec-driven development
- **Code Intelligence** - ast-grep, repomix, tree-sitter

These are available if needed but abstracted by the `/beans` command.
