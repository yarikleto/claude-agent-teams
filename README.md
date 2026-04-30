<p align="center">
  <img src="./assets/banner.svg" alt="@yarikleto/claude-agent-teams" width="100%"/>
</p>

<h1 align="center">@yarikleto/claude-agent-teams</h1>

<p align="center">
  <em>Drop a coordinated <strong>team</strong> of agents, skills, slash commands, hooks &amp; MCP servers into <a href="https://claude.com/claude-code">Claude Code</a> — and pull them out just as cleanly.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@yarikleto/claude-agent-teams"><img alt="npm" src="https://img.shields.io/npm/v/@yarikleto/claude-agent-teams?style=flat-square&color=ff8a5c"></a>
  <a href="https://github.com/yarikleto/claude-agent-teams/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/yarikleto/claude-agent-teams?style=flat-square"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <img alt="Claude Code" src="https://img.shields.io/badge/Claude%20Code-CLI-ff8a5c?style=flat-square">
</p>

---

## What is this?

A single skill is great. But real software work is done by a **team**: an architect designing the system, a DBA shaping the schema, a tester writing the plan, a reviewer keeping the bar high — plus the hooks, scripts, slash commands and MCP servers that glue them together.

`claude-agent-teams` is a tiny CLI that installs **whole teams** like that into your project (or user) scope, in one shot. It also remembers exactly what it installed, so `remove` is precise — your other settings, hooks and MCP servers stay untouched.

Think of it as `claude-skills`, scaled up to teams.

## Install

```bash
npx @yarikleto/claude-agent-teams              # interactive menu
npx @yarikleto/claude-agent-teams list         # show all teams + installed state
npx @yarikleto/claude-agent-teams add          # interactive picker
npx @yarikleto/claude-agent-teams add common-web-app --scope project
npx @yarikleto/claude-agent-teams remove common-web-app --scope project
```

Flags: `--scope user|project`, `-y/--yes`, `-h/--help`, `-v/--version`.

> **Custom npm registry?** If your default registry is a private/corporate mirror that doesn't proxy `@yarikleto/*`, force the public registry for this command:
>
> ```bash
> npm_config_registry=https://registry.npmjs.org npx @yarikleto/claude-agent-teams
> ```

### Scopes

- 🏠 **`user`** → `~/.claude/` — available in every project on your machine
- 📁 **`project`** → `./.claude/` — only the current working directory

## What gets installed

When you `add` a team, each component is placed where Claude Code already looks for it — and an install manifest is written to `<root>/agent-teams/<team>/install.json` so `remove` can reverse every change exactly.

| In the team | Installs to |
| --- | --- |
| `skills/<skill>/` | `<root>/skills/<skill>/` |
| `agents/<agent>.md` | `<root>/agents/<team>-<agent>.md` |
| `commands/<command>.md` | `<root>/commands/<team>-<command>.md` |
| `scripts/` | `<root>/agent-teams/<team>/scripts/` |
| `hooks/hooks.json` | merged into `<root>/settings.json` (paths rewritten) |
| `.mcp.json` | merged into `<cwd>/.mcp.json` *(project scope only)* |

Hook command paths use `${CLAUDE_PLUGIN_ROOT}` in the team source. On install they're rewritten so things just work:

- 📁 project scope → `${CLAUDE_PROJECT_DIR}/.claude/agent-teams/<team>/...`
- 🏠 user scope → `$HOME/.claude/agent-teams/<team>/...`

Agent and command filenames are prefixed with the team slug (e.g. `common-web-app-architect.md`, `common-web-app-init.md`) so two teams can coexist without colliding.

### What `remove` does

Reads the install manifest and reverses it precisely:

- deletes every file/dir it installed
- splices its hook entries out of `settings.json` (your other hooks stay)
- removes only the MCP servers it added (your other servers stay)
- prunes empty parent dirs

No guessing, no `rm -rf`-ing your `.claude/` folder.

## Bundled teams

| Team | What it does |
| --- | --- |
| [`common-web-app`](./teams/common-web-app) | A full software-engineering org tuned for typical web applications (frontend, backend, full-stack SaaS) — orchestrator + 10 specialized agents (architect, DBA, designer, developer, devops, manual-qa, researcher, reviewer, tester, ux-engineer), 10 skills covering kickoff → sprint → sync, and 5 hooks for session start, iron-rule check, auto-format, save-progress, and post-commit reminders. Adapted from [yarikleto/claude-swe-plugin](https://github.com/yarikleto/claude-swe-plugin). |

## Authoring a team

Create `teams/<team-name>/` with whatever subset of the layout you need — every directory is optional:

```text
teams/<team-name>/
  team.json          # { "name", "description", "version" }
  agents/*.md
  skills/<skill>/SKILL.md
  commands/*.md
  hooks/hooks.json
  scripts/*.sh
  .mcp.json
```

Reference scripts from `hooks/hooks.json` using `${CLAUDE_PLUGIN_ROOT}/scripts/foo.sh` — the CLI rewrites that placeholder to the correct install location at install time. This matches the Claude Code plugin convention, so an existing plugin repo can be dropped in as a team almost verbatim.

A minimal `team.json`:

```json
{
  "name": "my-team",
  "description": "What this team is for, in one or two sentences.",
  "version": "0.1.0"
}
```

## Layout

```text
bin/
  agent-teams.js     the CLI
teams/
  <team-name>/       individual teams (see above)
assets/
  icon.svg
  banner.svg
```

## License

MIT
