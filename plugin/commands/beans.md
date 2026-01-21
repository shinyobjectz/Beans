---
description: BEANS - Unified autonomous development (Beads + Ralph + Valyu)
argument-hint: [description | issue-id | list | status | --quick]
allowed-tools: [Read, Write, Bash, Task, AskUserQuestion]
---

# /beans - Unified Autonomous Development

BEANS combines three systems:
- **Beads** (`bd` CLI) - Git-backed issue tracking and memory
- **Ralph** - Spec-driven autonomous execution
- **Valyu** - Knowledge retrieval and research

## Usage

```bash
/beans                              # List ready issues (bd ready)
/beans list                         # Same as above
/beans status                       # Show current spec and task status
/beans "Add OAuth2 login"           # Full flow: create issue → spec → execute
/beans "Add OAuth2 login" --quick   # Quick mode: skip spec phases
/beans task-001                     # Build from existing beads issue
```

## Workflow

### Standard Mode (`/beans "goal"`)

1. **Create Issue**: `bd create "goal" -t feature`
2. **Start Spec**: Create `./specs/<name>/` directory
3. **Research Phase**: Analyze codebase, search web (delegates to research-analyst)
4. **Requirements Phase**: Generate user stories (delegates to product-manager)
5. **Design Phase**: Technical architecture (delegates to architect-reviewer)
6. **Tasks Phase**: Break into executable tasks (delegates to task-planner)
7. **Execute**: Run tasks one-by-one until complete (delegates to spec-executor)
8. **Complete**: Close issue, commit, push

### Quick Mode (`/beans "goal" --quick`)

Skips spec phases, auto-generates all artifacts, starts execution immediately.

## Detection Logic

```
1. Parse $ARGUMENTS
   |
   +-- "list" or empty → Run: bd ready
   |
   +-- "status" → Show spec status + beads status
   |
   +-- Looks like issue ID (e.g., task-001) → Load issue, start spec
   |
   +-- Text description → Create issue + start spec
       |
       +-- Has --quick → Quick mode (auto-generate, execute)
       +-- No --quick → Normal mode (interactive phases)
```

## Implementation

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **command**: list, status, or goal/issue-id
- **--quick**: Enable quick mode
- **--fresh**: Force new spec if exists

### Step 2: Route to Handler

```javascript
if (args === "" || args === "list") {
  // Run bd ready
  exec("bd ready");
}
else if (args === "status") {
  // Show combined status
  exec("bd list --status in_progress");
  exec("cat ./specs/.current-spec 2>/dev/null");
}
else if (args.match(/^[a-z]+-\d+$/i)) {
  // Issue ID - load and start spec
  const issue = exec(`bd show ${args} --json`);
  startSpec(issue.title, issue.id);
}
else {
  // Goal description - create issue and start spec
  const goal = args.replace(/--quick|--fresh/g, '').trim();
  const issueId = exec(`bd create "${goal}" -t feature`);
  startSpec(goal, issueId, args.includes('--quick'));
}
```

### Step 3: Start Spec Flow

For new specs, delegate to `/ralph:start`:

```
Task: Invoke /ralph:start with spec name and goal
Arguments: $specName "$goal" [--quick if quick mode]
```

This delegates to the ralph-specum workflow which handles:
- Research (research-analyst agent)
- Requirements (product-manager agent)
- Design (architect-reviewer agent)
- Tasks (task-planner agent)
- Execution (spec-executor agent)

### Step 4: Track in Beads

After spec creation, update beads issue:
```bash
bd update $issueId --status in_progress
bd update $issueId --notes "Spec: ./specs/$specName/"
```

After completion:
```bash
bd close $issueId --reason "Implemented via BEANS"
bd sync
```

## Subcommands

These map to underlying commands:

| Beans Command | Maps To |
|---------------|---------|
| `/beans` | `bd ready` |
| `/beans list` | `bd ready` |
| `/beans status` | `bd list` + spec status |
| `/beans:create` | `bd create` |
| `/beans:show <id>` | `bd show <id>` |
| `/beans:research` | `/ralph:research` |
| `/beans:requirements` | `/ralph:requirements` |
| `/beans:design` | `/ralph:design` |
| `/beans:tasks` | `/ralph:tasks` |
| `/beans:implement` | `/ralph:implement` |
| `/beans:land` | `bd sync && git push` |

## Critical Rules

1. **Delegation**: ALWAYS delegate work to subagents, never implement directly
2. **Stop After Phase**: In normal mode, stop after each subagent completes
3. **Land the Plane**: Always `bd sync && git push` before ending session

## Example Flow

```bash
User: /beans "Add user authentication with JWT"

BEANS:
1. Creates beads issue: task-042 "Add user authentication with JWT"
2. Creates spec directory: ./specs/add-user-auth/
3. Invokes research-analyst → research.md
   "Research complete. Run /beans:requirements to continue."

User: /beans:requirements

BEANS:
4. Invokes product-manager → requirements.md
   "Requirements complete. Run /beans:design to continue."

... (continues through phases) ...

User: /beans:implement

BEANS:
8. Invokes spec-executor for each task
9. On completion: bd close task-042, bd sync, git push
   "Feature complete! PR ready for review."
```
