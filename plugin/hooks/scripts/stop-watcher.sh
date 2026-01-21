#!/bin/bash
# BEANS Stop Hook
# Runs when Claude Code session stops:
# 1. Cleans up .beans-state.json and .ralph-state.json
# 2. Syncs beads state
# 3. Cleans orphaned temp files

# Read hook input from stdin
INPUT=$(cat)

# Bail out cleanly if jq is unavailable
command -v jq >/dev/null 2>&1 || exit 0

# Get working directory
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null || true)
[ -z "$CWD" ] && exit 0

# Sync beads state (non-blocking)
if command -v bd >/dev/null 2>&1 && [ -d "$CWD/.beads" ]; then
    bd sync --quiet 2>/dev/null &
fi

# Check for active spec (ralph-style)
CURRENT_SPEC_FILE="$CWD/specs/.current-spec"
if [ -f "$CURRENT_SPEC_FILE" ]; then
    SPEC_NAME=$(cat "$CURRENT_SPEC_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$SPEC_NAME" ]; then
        STATE_FILE="$CWD/specs/$SPEC_NAME/.ralph-state.json"
        BEANS_STATE="$CWD/specs/$SPEC_NAME/.beans-state.json"
        
        # Log and cleanup ralph state
        if [ -f "$STATE_FILE" ]; then
            if jq empty "$STATE_FILE" 2>/dev/null; then
                PHASE=$(jq -r '.phase // "unknown"' "$STATE_FILE" 2>/dev/null || echo "unknown")
                TASK=$(jq -r '.taskIndex // 0' "$STATE_FILE" 2>/dev/null || echo "0")
                TOTAL=$(jq -r '.totalTasks // 0' "$STATE_FILE" 2>/dev/null || echo "0")
                echo "[beans] Cleanup spec: $SPEC_NAME | Phase: $PHASE | Task: $((TASK + 1))/$TOTAL" >&2
            fi
            rm -f "$STATE_FILE" 2>/dev/null || true
        fi
        
        # Cleanup beans state
        [ -f "$BEANS_STATE" ] && rm -f "$BEANS_STATE" 2>/dev/null || true
        
        # Remove orphaned temp files
        find "$CWD/specs/$SPEC_NAME" -name ".progress-task-*.md" -mmin +60 -delete 2>/dev/null || true
    fi
fi

# Cleanup .beans cache (older than 7 days)
[ -d "$CWD/.beans/cache" ] && find "$CWD/.beans/cache" -type f -mtime +7 -delete 2>/dev/null || true

exit 0
