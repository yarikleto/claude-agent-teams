#!/bin/bash
# After a git commit, remind the CEO to update task status.
# PostToolUse stdout is invisible on exit 0 — additionalContext is the
# documented channel that actually reaches Claude.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

case "$COMMAND" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

[ -d ".claude/tasks" ] || exit 0

# Active statuses per the team's task workflow: IN_PROGRESS, IN_REVIEW, CHANGES_REQUESTED
ACTIVE=$(grep -rl '`IN_PROGRESS`\|`IN_REVIEW`\|`CHANGES_REQUESTED`' .claude/tasks/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$ACTIVE" -gt 0 ]; then
  jq -n --arg note "Committed. $ACTIVE task(s) in .claude/tasks/ still carry an active status — if this commit completes one, update its status now." \
    '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $note}}'
fi

exit 0
