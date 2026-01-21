#!/bin/bash
# BEANS Loop Orchestrator
# Combines: Beads (memory) + Ralph Loop (iteration) + Valyu (research)

set -e

TASK_ID=$1
MAX_ITERATIONS=${2:-10}
ITERATION=0
SUCCESS=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}BEANS Loop Orchestrator${NC}"
echo -e "${BLUE}Task: ${TASK_ID} | Max: ${MAX_ITERATIONS} iterations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify prerequisites
if ! command -v bd &> /dev/null; then
  echo -e "${RED}❌ bd (beads) not installed${NC}"
  exit 1
fi

if ! command -v claude &> /dev/null; then
  echo -e "${RED}❌ Claude Code not installed${NC}"
  exit 1
fi

# Create task branch
BRANCH_NAME="beans/${TASK_ID}"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME" 2>/dev/null || true
echo -e "${GREEN}✓ Branch: $BRANCH_NAME${NC}"

# Main loop
while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  
  echo ""
  echo -e "${YELLOW}[Iteration ${ITERATION}/${MAX_ITERATIONS}]${NC}"
  
  # 1. Read task from Beads
  echo -e "  → Reading task context..."
  TASK_CONTEXT=$(bd show $TASK_ID 2>/dev/null || echo "Task not found")
  
  # 2. Update iteration count
  bd update $TASK_ID --status in_progress 2>/dev/null || true
  
  # 3. Get git status
  GIT_STATUS=$(git status --porcelain)
  GIT_LOG=$(git log --oneline -3 2>/dev/null || echo "No commits")
  
  # 4. Run tests for baseline
  TEST_OUTPUT=""
  if [ -f "package.json" ]; then
    TEST_OUTPUT=$(npm test 2>&1 || true)
  elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
    TEST_OUTPUT=$(pytest -v 2>&1 || true)
  elif [ -f "go.mod" ]; then
    TEST_OUTPUT=$(go test ./... 2>&1 || true)
  fi
  
  # 5. Build prompt
  PROMPT=$(cat <<EOF
# BEANS Task Execution - Iteration $ITERATION of $MAX_ITERATIONS

## Task Context
$TASK_CONTEXT

## Git State
Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
Recent commits:
$GIT_LOG

Uncommitted changes:
$GIT_STATUS

## Test Results
$TEST_OUTPUT

## Instructions
1. Review context and implement/improve code
2. Run tests to verify
3. If all tests pass and criteria met, output: <promise>Task complete</promise>
4. If tests fail, fix and continue
5. Commit logical checkpoints

Focus on completing the task. Iteration $ITERATION of $MAX_ITERATIONS.
EOF
)
  
  # 6. Run Claude
  echo -e "  → Running Claude..."
  AGENT_OUTPUT=$(echo "$PROMPT" | claude -p --model opus 2>&1 || true)
  
  # 7. Log to progress file
  echo "## Iteration $ITERATION - $(date)" >> .beads/progress.txt
  echo "$AGENT_OUTPUT" >> .beads/progress.txt
  echo "" >> .beads/progress.txt
  
  # 8. Check for completion
  if echo "$AGENT_OUTPUT" | grep -q "<promise>"; then
    echo -e "${GREEN}✓ Success criteria met!${NC}"
    bd update $TASK_ID --status completed 2>/dev/null || true
    SUCCESS=true
    break
  fi
  
  # 9. Commit iteration
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "[BEANS] $TASK_ID: Iteration $ITERATION" --allow-empty 2>/dev/null || true
    echo -e "  ${GREEN}✓ Committed${NC}"
  fi
  
  echo -e "  ${YELLOW}✓ Iteration $ITERATION complete${NC}"
  sleep 2
done

# Final status
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$SUCCESS" = true ]; then
  echo -e "${GREEN}✓ Task completed in $ITERATION iterations${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review: git diff main..$BRANCH_NAME"
  echo "  2. Create PR: gh pr create"
  echo "  3. Close issue: bd close $TASK_ID"
else
  echo -e "${RED}✗ Max iterations reached${NC}"
  echo "Review .beads/progress.txt and continue manually"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
