#!/bin/bash
# Auto-format Swift files after Edit/Write operations.
# Tries the project-pinned formatter first, then falls back to system tools.
# Degrades gracefully when neither swiftformat nor swift-format is installed —
# a missing formatter on a contributor's machine must not block their edit.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Skip non-code files
case "$FILE_PATH" in
  *.md|*.txt|*.csv|*.svg|*.png|*.jpg|*.gif|*.ico|*.heic|*.pdf) exit 0 ;;
  *.lock|*.map|*.min.*) exit 0 ;;
  *.ipa|*.dmg|*.zip|*.tar|*.gz) exit 0 ;;
esac

case "$FILE_PATH" in
  *.swift)
    # Project-pinned swiftformat (SwiftPM plugin or Mint) wins over a globally
    # installed binary so all contributors converge on the same rules.
    if [ -f "Package.swift" ] && command -v swift &>/dev/null; then
      swift run --quiet swiftformat "$FILE_PATH" 2>/dev/null && exit 0
    fi
    command -v swiftformat &>/dev/null && swiftformat --quiet "$FILE_PATH" 2>/dev/null && exit 0
    command -v swift-format &>/dev/null && swift-format -i "$FILE_PATH" 2>/dev/null && exit 0
    ;;
  *.json)
    command -v jq &>/dev/null && jq . "$FILE_PATH" > "$FILE_PATH.tmp" 2>/dev/null && mv "$FILE_PATH.tmp" "$FILE_PATH"
    ;;
  *.rb)
    # fastlane / Gemfile use Ruby — rubocop if the developer wired one
    command -v rubocop &>/dev/null && rubocop -A "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0
