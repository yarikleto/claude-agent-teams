#!/bin/bash
# After a git commit, remind to update task status.
# Runs on PostToolUse for Bash commands containing "git commit".

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only trigger on git commit commands
case "$COMMAND" in
  *"git commit"*|*"git add"*"&&"*"git commit"*)
    ;;
  *)
    exit 0
    ;;
esac

# Check if tasks directory exists and has in-progress tasks
if [ -d ".claude/tasks" ]; then
  IN_PROGRESS=$(grep -rl '`IN_PROGRESS`\|`TESTING`\|`READY`' .claude/tasks/ 2>/dev/null | wc -l | tr -d ' ')
  if [ "$IN_PROGRESS" -gt 0 ]; then
    echo "Committed. Remember to update task status in .claude/tasks/ ($IN_PROGRESS task(s) in progress)."
  fi
fi

# Warn when release-critical files change without an accompanying version bump.
# A TestFlight build with the same CFBundleShortVersionString + CFBundleVersion
# as the previous upload is rejected by App Store Connect.
# The diff is meaningful only once a prior commit exists; on the very first commit
# of a brand-new repo HEAD~1 doesn't resolve and we'd silently miss it.
if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
  RELEASE_PATHS=$(git diff HEAD~1 --name-only | grep -Ei 'Info\.plist|\.xcconfig|project\.pbxproj|fastlane/Fastfile|fastlane/Appfile|exportOptions\.plist' || true)
else
  RELEASE_PATHS=$(git diff --cached --name-only | grep -Ei 'Info\.plist|\.xcconfig|project\.pbxproj|fastlane/Fastfile|fastlane/Appfile|exportOptions\.plist' || true)
fi
if [ -n "$RELEASE_PATHS" ]; then
  echo "Release-critical files changed. Verify CFBundleShortVersionString and CFBundleVersion are bumped before the next TestFlight build." >&2
fi

exit 0
