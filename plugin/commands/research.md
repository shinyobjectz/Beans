---
description: Fetch research context via Valyu
argument-hint: <query> [--source academic|web|all]
---

# /beans:research - Knowledge Retrieval

Query Valyu MCP for research context.

## Usage

```bash
/beans:research "OAuth2 security best practices"
/beans:research "JWT token validation" --source academic
/beans:research --task task-001      # Get research for task
/beans:research --cache-stats        # Show cache statistics
```

## Sources

- `academic` - Peer-reviewed papers, arxiv, journals
- `web` - General web search, documentation
- `financial` - Market data, company info (if applicable)
- `all` - Search all sources (default)

## Caching

Results cached for 7 days by default. Force fresh:
```bash
/beans:research "query" --fresh
```

## Auto-Research

When a task has `research_enabled: true`, queries are auto-generated from:
- Task title keywords
- Tags
- `[RESEARCH: query]` markers in description
