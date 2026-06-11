#!/bin/bash

CEO_BRAIN=".claude/ceo-brain.md"
MAX_LINES=300

if [ -f "$CEO_BRAIN" ]; then
  echo "=== CEO KNOWLEDGE BASE ==="
  head -n "$MAX_LINES" "$CEO_BRAIN"
  TOTAL_LINES=$(wc -l < "$CEO_BRAIN" | tr -d ' ')
  if [ "$TOTAL_LINES" -gt "$MAX_LINES" ]; then
    echo "[truncated: $MAX_LINES of $TOTAL_LINES lines — the brain has outgrown a briefing; run /common-web-app-sync to tighten it]"
  fi
  echo "=== END CEO KNOWLEDGE BASE ==="
  echo ""
  echo "Your knowledge base is loaded. If it feels outdated, run /common-web-app-sync to refresh."
else
  echo "=== NO CEO KNOWLEDGE BASE FOUND ==="
  echo ""
  echo "You have no strategic knowledge base for this project yet."
  echo "Run /common-web-app-brief to study the project and build your knowledge base."
  echo "Until then, you are flying blind — avoid making architectural decisions without intel."
fi
