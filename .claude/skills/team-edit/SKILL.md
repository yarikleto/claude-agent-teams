---
name: team-edit
description: Make a surgical change to a single component (agent, skill, command, hook, script, or MCP entry) in an existing `teams/<slug>/`. Delegates to the `team-editor` subagent, which preserves the rest of the team and verifies the install round-trip. Use for targeted fixes, not rewrites.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
argument-hint: "<slug> <what to change>"
---

# Team Edit

Make a precise, scoped change to one component of an existing team.

## Step 1 — Resolve the target

Parse `$ARGUMENTS`:
- First token → team slug.
- Rest → description of the change.

If either is missing, ask:
> "Which team, and what should change?"

If `teams/<slug>/` doesn't exist, stop and list available teams.

## Step 2 — Locate the file

Before delegating, identify the exact file the user means:
- "the architect agent" → `teams/<slug>/agents/architect.md`
- "the iron-rule script" → `teams/<slug>/scripts/iron-rule-check.sh`
- "the init skill" → `teams/<slug>/skills/<slug>-init/SKILL.md`
- "the playwright mcp" → `teams/<slug>/.mcp.json`

If it's ambiguous, glob the team and ask the user to pick — don't guess.

## Step 3 — Delegate to `team-editor`

Send the `team-editor` subagent with:
- the resolved file path,
- the exact change requested (verbatim from the user — don't paraphrase the intent away),
- a pointer to `CLAUDE.md`.

The subagent reads the file, makes the targeted change, greps for cross-references if anything was renamed, bumps `team.json` `version` if user-visible, and runs the install round-trip in a temp dir.

## Step 4 — Hand back the diff

Surface the subagent's report:
- file(s) changed and one-line reason each
- whether `team.json` `version` was bumped
- install round-trip pass/fail
- review notes (issues spotted but deliberately not fixed)

If the round-trip failed, offer to iterate or escalate to `/team-review` for a full audit.
