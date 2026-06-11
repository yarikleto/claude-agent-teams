#!/bin/bash
# Warn about unfinished business when the CEO stops responding.
# Stop-hook stdout/stderr are invisible on exit 0 — systemMessage is the
# documented channel for a non-blocking warning the user actually sees.

WARNINGS=""

# Active statuses per the team's task workflow: IN_PROGRESS, IN_REVIEW, CHANGES_REQUESTED
if [ -d ".claude/tasks" ]; then
  ACTIVE=$(grep -rl '`IN_PROGRESS`\|`IN_REVIEW`\|`CHANGES_REQUESTED`' .claude/tasks/ 2>/dev/null | wc -l | tr -d ' ')
  if [ "$ACTIVE" -gt 0 ]; then
    WARNINGS="$ACTIVE task(s) still active in .claude/tasks/ — have the CEO update their status before ending."
  fi
fi

if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [ "$UNCOMMITTED" -gt 0 ]; then
    WARNINGS="${WARNINGS:+$WARNINGS }$UNCOMMITTED uncommitted file(s) — have the CEO commit before ending."
  fi
fi

if [ -n "$WARNINGS" ]; then
  jq -n --arg msg "$WARNINGS" '{systemMessage: $msg}'
fi

exit 0
