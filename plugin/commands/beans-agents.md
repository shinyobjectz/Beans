---
description: Browse and install specialized subagents from the BEANS catalog
argument-hint: [list | install <name> | search <query> | categories]
---

# /beans:agents - Subagent Catalog

Browse and install 127+ specialized subagents organized into 10 categories.

## Usage

```bash
/beans:agents                         # Show quick start
/beans:agents categories              # List all 10 categories
/beans:agents list <category>         # List agents in category
/beans:agents search <query>          # Search by name/description
/beans:agents install <name>          # Install agent globally
/beans:agents install <name> --local  # Install to current project
```

## Categories

| Category | Plugin | Agents | Focus |
|----------|--------|--------|-------|
| 01-core-development | voltagent-core-dev | 11 | Backend, frontend, fullstack |
| 02-language-specialists | voltagent-lang | 27 | TypeScript, Python, Go, Rust... |
| 03-infrastructure | voltagent-infra | 15 | DevOps, K8s, Terraform, cloud |
| 04-quality-security | voltagent-qa-sec | 15 | Testing, security, code review |
| 05-data-ai | voltagent-data-ai | 12 | ML, data pipelines, LLM |
| 06-developer-experience | voltagent-dev-exp | 14 | Tooling, CLI, documentation |
| 07-specialized-domains | voltagent-domains | 12 | Blockchain, fintech, gaming |
| 08-business-product | voltagent-biz | 12 | Product, project mgmt, UX |
| 09-meta-orchestration | voltagent-meta | 11 | Multi-agent coordination |
| 10-research-analysis | voltagent-research | 6 | Research, competitive analysis |

## Implementation

### List Categories
```bash
ls -1 ~/.beans-subagents/categories/ 2>/dev/null || \
  echo "Run 'beans init --subagents' to install catalog"
```

### Search Agents
```bash
grep -r -l "$query" ~/.beans-subagents/categories/*.md 2>/dev/null | \
  xargs -I {} basename {} .md
```

### Install Agent
```bash
# Global install
cp ~/.beans-subagents/categories/*/${name}.md ~/.claude/agents/

# Local install
cp ~/.beans-subagents/categories/*/${name}.md .claude/agents/
```

### Interactive Mode (via bash script)
```bash
~/.beans-subagents/install-agents.sh
```

## Recommended Starter Pack

For most projects, install these core agents:

```bash
/beans:agents install code-reviewer      # Quality checks
/beans:agents install debugger           # Error investigation
/beans:agents install research-analyst   # Codebase exploration
/beans:agents install refactoring-specialist  # Code cleanup
```

## Agent Format

Each agent is a markdown file with YAML frontmatter:

```yaml
---
name: agent-name
description: When this agent should be invoked
tools: Read, Write, Edit, Bash, Glob, Grep
---

You are a [role description]...
```

## Storage Locations

| Type | Path | Scope |
|------|------|-------|
| Project | `.claude/agents/` | Current project only |
| Global | `~/.claude/agents/` | All projects |

Project agents override global agents with the same name.
