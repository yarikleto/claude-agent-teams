#!/bin/bash
# CEO delegation enforcement: when the CEO (main thread, no agent_type) tries to
# Edit/Write a file, only allow strategic CEO-owned documents. Anything else —
# source code, tests, configs, design specs, schemas, infra plans — must be
# delegated to a sub-agent (frontend, backend, architect, designer, dba, devops, ...).
#
# Sub-agents (architect, frontend, backend, designer, ...) are unaffected: they have a
# non-empty agent_type and pass straight through.

INPUT=$(cat)
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only enforce on the CEO (main thread). Sub-agents have agent_type set.
if [ -n "$AGENT_TYPE" ] || [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Normalize: strip absolute project prefix so we match on the project-relative path.
REL_PATH="$FILE_PATH"
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  case "$FILE_PATH" in
    "$CLAUDE_PROJECT_DIR"/*) REL_PATH="${FILE_PATH#$CLAUDE_PROJECT_DIR/}" ;;
  esac
fi

is_ceo_strategic_file() {
  case "$REL_PATH" in
    CLAUDE.md) return 0 ;;
    .claude/ceo-brain.md) return 0 ;;
    .claude/product-vision.md) return 0 ;;
    .claude/tasks/*) return 0 ;;
    .claude/agent-notes/*) return 0 ;;
    .claude/qa/*) return 0 ;;
    .claude/decisions/*) return 0 ;;
    .claude/handoff/*) return 0 ;;
  esac
  return 1
}

if ! is_ceo_strategic_file; then
  cat >&2 <<EOF
DELEGATION VIOLATION: CEO attempted to edit a non-strategic file directly:
  $REL_PATH

The CEO orchestrates — never implements. Delegate via the Agent tool:
  - UI, components, client state, styling                      → frontend
  - APIs, business logic, DB access, migrations, server tests  → backend
  - .claude/system-design.md, ADRs                             → architect
  - .claude/design-spec.md, prototypes/                        → designer
  - .claude/database-schema.md, schema design                  → dba
  - .claude/infra-plan.md, CI/CD                               → devops
  - .claude/research/*                                         → researcher

CEO may directly edit only its own strategic documents:
  CLAUDE.md, .claude/ceo-brain.md, .claude/product-vision.md,
  .claude/tasks/**, .claude/agent-notes/**, .claude/qa/**,
  .claude/decisions/**, .claude/handoff/**.

Pick the right agent and send a brief — don't write the file yourself.
EOF
  exit 2
fi

exit 0
