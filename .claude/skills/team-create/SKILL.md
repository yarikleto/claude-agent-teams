---
name: team-create
description: Scaffold a brand-new team under `teams/<slug>/` for the claude-agent-teams CLI. Gathers the goal from the user, sketches the component list, then delegates to the `team-author` subagent to generate files and verify install round-trip. Use when the user says "create a team for X" or "add a new team".
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
argument-hint: "[<slug>] [<one-line goal>]"
---

# Team Create

Create a new team in `teams/<slug>/` that the `claude-agent-teams` CLI can install cleanly.

## Step 1 — Confirm slug + goal

Parse `$ARGUMENTS`:
- First token (if present, lowercase, no spaces, valid dir name) → proposed slug.
- Rest → one-line goal.

If either is missing, ask the user — one sharp question, not a survey:
> "What should the team be called (slug), and what's the one-line goal?"

If the slug already exists at `teams/<slug>/`, stop and tell the user. Suggest using `/team-edit` instead, or pick a different slug.

## Step 2 — Sketch the component list

Before writing anything, think through what this team actually needs. Propose to the user a one-bullet-per-file list:

```
teams/<slug>/
- team.json
- agents/<role>.md       (only if the team needs delegated roles)
- skills/<slug>-<verb>/SKILL.md   (only if a slash-command entry point makes sense)
- hooks/hooks.json + scripts/...  (only if invariants must be enforced)
- .mcp.json              (only if an MCP server is genuinely needed)
```

Keep it minimal. A team with one purposeful agent is fine. Get a thumbs-up from the user before generating.

## Step 3 — Delegate to `team-author`

Send the `team-author` subagent with:
- the confirmed slug,
- the one-line goal,
- the approved component list,
- a pointer to `CLAUDE.md` and the bundled teams as the style reference.

Let the subagent produce the files, `chmod +x` any scripts, and run the install round-trip test in a temp dir.

## Step 4 — Hand back

Summarize for the user in a few bullets:
- files created
- install/remove commands
- any caveats (e.g. ".mcp.json ships, project-scope only")
- offer to `/team-review` it before committing
