#!/bin/bash
# Separation enforcement: tester can't touch production files
# Developer has full freedom (including writing tests, but not modifying existing ones — reviewer catches that)
# This hook runs on PreToolUse for Edit and Write tools
# Language/framework agnostic — covers all known test conventions

INPUT=$(cat)
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only enforce within known agent contexts
if [ -z "$AGENT_TYPE" ] || [ -z "$FILE_PATH" ]; then
  exit 0
fi

FILENAME=$(basename "$FILE_PATH")
FILENAME_LOWER=$(echo "$FILENAME" | tr '[:upper:]' '[:lower:]')
DIR_PATH=$(echo "$FILE_PATH" | tr '[:upper:]' '[:lower:]')

is_test_file() {
  local f="$FILENAME_LOWER"
  local d="$DIR_PATH"

  # === Universal name patterns ===
  # prefix: test_ test- Test
  case "$f" in
    test_*|test-*|test.*) return 0 ;;
  esac
  # suffix: _test. -test. .test. .spec. _spec. -spec.
  case "$f" in
    *_test.*|*-test.*|*.test.*|*.spec.*|*_spec.*|*-spec.*) return 0 ;;
    *_tests.*|*-tests.*|*.tests.*|*.specs.*|*_specs.*) return 0 ;;
  esac
  # exact test runner entry points
  case "$f" in
    *test_helper*|*testhelper*|*test_utils*|*testutils*|*test-utils*) return 0 ;;
    *test_support*|*testsupport*|*test_common*|*testcommon*) return 0 ;;
    *mock_*|*_mock.*|*.mock.*|*mocks.*|*fake_*|*_fake.*|*.fake.*) return 0 ;;
    *stub_*|*_stub.*|*.stub.*|*fixture*|*factory*) return 0 ;;
  esac

  # === Directory patterns (any depth) ===
  case "$d" in
    */__tests__/*|*/tests/*|*/test/*|*/testing/*) return 0 ;;
    */__mocks__/*|*/__fixtures__/*|*/__stubs__/*) return 0 ;;
    */test_*/*|*/testdata/*|*/test-data/*|*/test_data/*) return 0 ;;
    */testutils/*|*/test-utils/*|*/test_utils/*) return 0 ;;
    */fixtures/*|*/factories/*|*/mocks/*|*/stubs/*|*/fakes/*) return 0 ;;
    */spec/*|*/specs/*) return 0 ;;
    # Language-specific test directories
    */src/test/*|*/src/tests/*) return 0 ;;           # Java/Kotlin/Scala (Maven/Gradle)
    */t/*) return 0 ;;                                 # Perl
    */features/*|*/step_definitions/*) return 0 ;;     # Cucumber/BDD
    */cypress/*|*/e2e/*|*/playwright/*) return 0 ;;    # E2E frameworks
  esac

  # === Test configuration files (any language) ===
  case "$f" in
    # JavaScript/TypeScript
    jest.config.*|vitest.config.*|karma.conf.*|mocha*|.mocharc*) return 0 ;;
    cypress.config.*|playwright.config.*|.nycrc*|nyc.config.*) return 0 ;;
    # Python
    pytest.ini|.pytest.ini|conftest.py|setup.cfg|tox.ini|noxfile.py) return 0 ;;
    pyproject.toml) ;; # Skip — shared config, not test-only
    # Ruby
    .rspec|spec_helper.rb|rails_helper.rb|.simplecov) return 0 ;;
    # Java/Kotlin/JVM
    testng.xml|build.gradle.kts) ;; # Skip — shared config
    # Go
    *_test.go) return 0 ;;
    # Rust
    # Rust tests are inline (mod tests {}) — can't block at file level
    # But test binaries and integration test files:
    */tests/*.rs) return 0 ;;
    # C/C++
    *_test.c|*_test.cpp|*_test.cc|*_test.h|*_test.hpp) return 0 ;;
    *test.c|*test.cpp|*test.cc) return 0 ;;
    # Swift
    *tests.swift|*test.swift|*_tests.swift|*_test.swift) return 0 ;;
    # Dart/Flutter
    *_test.dart) return 0 ;;
    # Elixir
    *_test.exs) return 0 ;;
    # PHP
    *test.php|*Test.php) return 0 ;;
    phpunit.xml*|phpunit.dist.xml*) return 0 ;;
    # .NET/C#
    *.tests.csproj|*.test.csproj) return 0 ;;
    *test.cs|*tests.cs) return 0 ;;
    # Haskell
    *spec.hs|*test.hs) return 0 ;;
    # Lua
    *_spec.lua|*_test.lua) return 0 ;;
    # Shell
    *test.sh|*test.bats|*.bats) return 0 ;;
  esac

  return 1
}

# DEVELOPER has full freedom — can write production code AND tests
# (Reviewer catches unauthorized modifications to existing tests from previous tasks)

# TESTER trying to edit a non-test file → BLOCK
if [ "$AGENT_TYPE" = "tester" ]; then
  if ! is_test_file; then
    echo "SEPARATION VIOLATION: Tester attempted to edit production file: $FILE_PATH" >&2
    echo "Production code is the developer's domain. Report the issue to CEO instead." >&2
    exit 2
  fi
fi

exit 0
