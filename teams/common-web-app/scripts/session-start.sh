#!/bin/bash

CEO_BRAIN=".claude/ceo-brain.md"

if [ -f "$CEO_BRAIN" ]; then
  echo "=== CEO KNOWLEDGE BASE ==="
  cat "$CEO_BRAIN"
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
