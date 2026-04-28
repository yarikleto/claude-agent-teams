---
name: team-review
description: Audit an existing team under `teams/<slug>/` for correctness, install-safety, frontmatter validity, name collisions, hook hygiene, and quality. Delegates to the `team-reviewer` subagent and returns a punch list with a verdict. Use before publishing or after substantial edits.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent
argument-hint: "<slug>"
---

# Team Review

Audit a team in `teams/<slug>/` and produce a punch list.

## Step 1 — Resolve the team

Parse `$ARGUMENTS` for the slug. If missing, list existing teams (`ls teams/`) and ask which one to review.

If `teams/<slug>/` doesn't exist, stop and tell the user.

## Step 2 — Delegate to `team-reviewer`

Send the `team-reviewer` subagent with:
- the resolved slug,
- a pointer to `CLAUDE.md` for the install model,
- explicit instruction to run the round-trip install test in a temp dir.

The subagent reads everything under `teams/<slug>/`, checks frontmatter, name collisions against `teams/swe` and `teams/web`, hook hygiene, script executable bits, and `.mcp.json` collisions, then installs and removes the team in a sandbox.

## Step 3 — Surface the punch list

Pass through the subagent's output verbatim — it's already structured as `Blockers / Risks / Nits / Round-trip install / Verdict`. Don't summarize it away; the user needs the file:line specifics to act.

If the verdict is `REQUEST CHANGES`, offer to delegate to `/team-edit` for any specific fix.
