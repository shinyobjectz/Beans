#!/bin/bash
# Build Unified BEANS Plugin
# Merges: beads + smart-ralph + valyu into one plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
BEANS_ROOT="$(dirname "$PLUGIN_DIR")"

BEADS_PLUGIN="$BEANS_ROOT/package/beads/claude-plugin"
RALPH_PLUGIN="$BEANS_ROOT/package/smart-ralph/plugins/ralph-specum"

echo "Building unified BEANS plugin..."
echo "  Beads source: $BEADS_PLUGIN"
echo "  Ralph source: $RALPH_PLUGIN"
echo "  Output: $PLUGIN_DIR"
echo ""

# Create directories
mkdir -p "$PLUGIN_DIR/commands/bd"
mkdir -p "$PLUGIN_DIR/commands/ralph"
mkdir -p "$PLUGIN_DIR/agents"
mkdir -p "$PLUGIN_DIR/skills"
mkdir -p "$PLUGIN_DIR/templates"

# Copy beads commands (prefixed bd:)
echo "→ Copying beads commands..."
for f in "$BEADS_PLUGIN/commands"/*.md; do
  filename=$(basename "$f")
  cp "$f" "$PLUGIN_DIR/commands/bd/$filename"
done
echo "  Copied $(ls "$PLUGIN_DIR/commands/bd" | wc -l) beads commands"

# Copy ralph-specum commands (prefixed ralph:)
echo "→ Copying ralph commands..."
for f in "$RALPH_PLUGIN/commands"/*.md; do
  filename=$(basename "$f")
  cp "$f" "$PLUGIN_DIR/commands/ralph/$filename"
done
echo "  Copied $(ls "$PLUGIN_DIR/commands/ralph" | wc -l) ralph commands"

# Copy ralph agents
echo "→ Copying ralph agents..."
if [ -d "$RALPH_PLUGIN/agents" ]; then
  cp -r "$RALPH_PLUGIN/agents"/* "$PLUGIN_DIR/agents/"
  echo "  Copied $(ls "$PLUGIN_DIR/agents" | wc -l) agents"
fi

# Copy ralph skills
echo "→ Copying ralph skills..."
if [ -d "$RALPH_PLUGIN/skills" ]; then
  cp -r "$RALPH_PLUGIN/skills"/* "$PLUGIN_DIR/skills/"
  echo "  Copied $(ls "$PLUGIN_DIR/skills" | wc -l) skills"
fi

# Copy ralph templates
echo "→ Copying ralph templates..."
if [ -d "$RALPH_PLUGIN/templates" ]; then
  cp -r "$RALPH_PLUGIN/templates"/* "$PLUGIN_DIR/templates/"
  echo "  Copied $(ls "$PLUGIN_DIR/templates" | wc -l) templates"
fi

# Copy beads skills if they exist
if [ -d "$BEADS_PLUGIN/skills" ]; then
  echo "→ Copying beads skills..."
  cp -r "$BEADS_PLUGIN/skills"/* "$PLUGIN_DIR/skills/"
fi

echo ""
echo "✓ Build complete!"
echo ""
echo "Structure:"
find "$PLUGIN_DIR" -type f -name "*.md" | head -20
echo "..."
