#!/bin/bash
# Auto-format files after Edit/Write operations
# Language-agnostic: tries the project's formatter, falls back to language-specific tools

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Skip non-code files
case "$FILE_PATH" in
  *.md|*.txt|*.csv|*.svg|*.png|*.jpg|*.gif|*.ico|*.woff*|*.ttf|*.eot) exit 0 ;;
  *.lock|*.lockb|*.map|*.min.*) exit 0 ;;
esac

# Try project-level formatters first (most common to least)
if [ -f "node_modules/.bin/prettier" ]; then
  npx prettier --write "$FILE_PATH" 2>/dev/null && exit 0
fi
if [ -f "node_modules/.bin/biome" ]; then
  npx biome format --write "$FILE_PATH" 2>/dev/null && exit 0
fi

# Fall back to language-specific formatters
case "$FILE_PATH" in
  *.go)       command -v gofmt &>/dev/null && gofmt -w "$FILE_PATH" 2>/dev/null ;;
  *.rs)       command -v rustfmt &>/dev/null && rustfmt "$FILE_PATH" 2>/dev/null ;;
  *.py)       command -v ruff &>/dev/null && ruff format "$FILE_PATH" 2>/dev/null || \
              command -v black &>/dev/null && black --quiet "$FILE_PATH" 2>/dev/null ;;
  *.rb)       command -v rubocop &>/dev/null && rubocop -a "$FILE_PATH" 2>/dev/null ;;
  *.swift)    command -v swiftformat &>/dev/null && swiftformat "$FILE_PATH" 2>/dev/null ;;
  *.dart)     command -v dart &>/dev/null && dart format "$FILE_PATH" 2>/dev/null ;;
  *.ex|*.exs) command -v mix &>/dev/null && mix format "$FILE_PATH" 2>/dev/null ;;
  *.zig)      command -v zig &>/dev/null && zig fmt "$FILE_PATH" 2>/dev/null ;;
  *.lua)      command -v stylua &>/dev/null && stylua "$FILE_PATH" 2>/dev/null ;;
  *.kt|*.kts) command -v ktlint &>/dev/null && ktlint -F "$FILE_PATH" 2>/dev/null ;;
  *.java)     command -v google-java-format &>/dev/null && google-java-format -i "$FILE_PATH" 2>/dev/null ;;
  *.cs)       command -v dotnet-format &>/dev/null && dotnet format --include "$FILE_PATH" 2>/dev/null ;;
  *.php)      command -v php-cs-fixer &>/dev/null && php-cs-fixer fix "$FILE_PATH" 2>/dev/null ;;
  *.c|*.cpp|*.cc|*.h|*.hpp) command -v clang-format &>/dev/null && clang-format -i "$FILE_PATH" 2>/dev/null ;;
  *.hs)       command -v ormolu &>/dev/null && ormolu -i "$FILE_PATH" 2>/dev/null ;;
  *.nim)      command -v nimpretty &>/dev/null && nimpretty "$FILE_PATH" 2>/dev/null ;;
  *.tf)       command -v terraform &>/dev/null && terraform fmt "$FILE_PATH" 2>/dev/null ;;
  *.json)     command -v jq &>/dev/null && jq . "$FILE_PATH" > "$FILE_PATH.tmp" 2>/dev/null && mv "$FILE_PATH.tmp" "$FILE_PATH" ;;
  *.yaml|*.yml) ;; # No universal YAML formatter
esac

exit 0
