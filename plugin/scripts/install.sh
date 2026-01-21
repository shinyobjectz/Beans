#!/bin/bash
# BEANS Plugin Installer
# Symlinks the plugin to your project's .claude folder

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}BEANS Plugin Installer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Determine target directory
if [ -n "$1" ]; then
  TARGET_PROJECT="$1"
else
  TARGET_PROJECT="$(pwd)"
fi

TARGET_CLAUDE="$TARGET_PROJECT/.claude"
TARGET_PLUGINS="$TARGET_CLAUDE/plugins"
TARGET_LINK="$TARGET_PLUGINS/beans"

echo -e "Plugin source: ${YELLOW}$PLUGIN_DIR${NC}"
echo -e "Target project: ${YELLOW}$TARGET_PROJECT${NC}"
echo ""

# Create .claude/plugins if needed
mkdir -p "$TARGET_PLUGINS"

# Remove existing link/folder
if [ -L "$TARGET_LINK" ] || [ -d "$TARGET_LINK" ]; then
  echo -e "${YELLOW}→ Removing existing beans plugin...${NC}"
  rm -rf "$TARGET_LINK"
fi

# Create symlink
ln -s "$PLUGIN_DIR" "$TARGET_LINK"
echo -e "${GREEN}✓ Symlinked: $TARGET_LINK → $PLUGIN_DIR${NC}"

# Copy MCP config if needed
if [ ! -f "$TARGET_PROJECT/.mcp.json" ]; then
  echo -e "${YELLOW}→ Creating .mcp.json...${NC}"
  cp "$PLUGIN_DIR/mcp.json" "$TARGET_PROJECT/.mcp.json"
  echo -e "${GREEN}✓ Created .mcp.json${NC}"
else
  echo -e "${YELLOW}⚠ .mcp.json exists, skipping (merge manually if needed)${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Installation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Commands available in Claude Code:"
echo "  /beans                - Full automation"
echo "  /beans:loop           - Run iteration loop"
echo "  /beans:research       - Valyu search"
echo "  /beans:land           - Session cleanup"
echo ""
echo "Environment required:"
echo "  export VALYU_API_KEY=..."
echo "  export GITHUB_TOKEN=..."
echo ""
