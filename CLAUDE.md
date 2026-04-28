# claude-agent-teams

A tiny Node CLI that installs **teams** — bundles of agents, skills, slash commands, hooks, scripts, and MCP servers — into a Claude Code user or project scope, and reverses every change cleanly via a recorded install manifest.

Think `claude-skills`, but the unit of distribution is a coordinated team.

## Layout

```
bin/agent-teams.js     the entire CLI — single ESM file, no build step
teams/<slug>/          one directory per shipped team (see "Authoring a team")
assets/                banner.svg, icon.svg
package.json           ESM package, Node ≥ 18, deps: @inquirer/prompts, picocolors
README.md              user-facing docs
```

There is no build, no test suite, no transpiler. Run the CLI directly:

```bash
node bin/agent-teams.js list
node bin/agent-teams.js add <slug> --scope project
node bin/agent-teams.js remove <slug> --scope project
```

## How install works (`bin/agent-teams.js`)

For every team in `teams/<slug>/`, on `add`:

| Source in team | Destination | Notes |
| --- | --- | --- |
| `skills/<skill>/` | `<root>/skills/<skill>/` | copied as a directory; **not** prefixed |
| `agents/<file>.md` | `<root>/agents/<slug>-<file>.md` | filename is prefixed with the team slug |
| `commands/<file>.md` | `<root>/commands/<slug>-<file>.md` | filename is prefixed with the team slug |
| `scripts/` | `<root>/agent-teams/<slug>/scripts/` | the team's private script root |
| `hooks/hooks.json` | merged into `<root>/settings.json` under `hooks` | each hook command path is rewritten (see below) |
| `.mcp.json` | merged into `<cwd>/.mcp.json` under `mcpServers` | **project scope only**; existing servers are not overwritten |

`<root>` depends on `--scope`:
- `user` → `~/.claude/`
- `project` → `./.claude/`

Hook commands in `hooks/hooks.json` reference scripts via `${CLAUDE_PLUGIN_ROOT}`. On install that placeholder is rewritten:
- project scope → `${CLAUDE_PROJECT_DIR}/.claude/agent-teams/<slug>`
- user scope → `$HOME/.claude/agent-teams/<slug>`

Every install writes a manifest at `<root>/agent-teams/<slug>/install.json` listing files created, hook commands appended, and MCP servers added. `remove` reads that manifest and reverses each change exactly — splicing only this team's hooks out of `settings.json`, deleting only this team's MCP servers from `.mcp.json`, and pruning empty parent dirs. **Never blanket-delete `<root>/agents/` or `<root>/skills/`** — other teams or hand-authored components live there too.

`add` is idempotent: re-installing a team uninstalls first, then installs fresh.

## Authoring a team

Create `teams/<slug>/` with whatever subset of the layout you need. Every directory is optional except `team.json`.

```
teams/<slug>/
  team.json         REQUIRED — { "name", "description", "version", "author"?, "license"?, "source"? }
  agents/*.md       sub-agent definitions (frontmatter + body)
  skills/<name>/SKILL.md   user-invocable skills / slash commands
  commands/*.md     slash commands (frontmatter + body)
  hooks/hooks.json  Claude Code hooks config; reference scripts via ${CLAUDE_PLUGIN_ROOT}/scripts/foo.sh
  scripts/*.sh      hook scripts; chmod +x, use bash, read JSON event from stdin
  .mcp.json         { "mcpServers": { ... } } — only installed at project scope
```

Conventions used by the bundled teams (`teams/swe`, `teams/web`):

- **Agent frontmatter:** `name`, `description`, `tools` (comma-separated), `model` (`opus`/`sonnet`/`haiku`), optional `maxTurns`. The `name:` field is the invocation name; the file is renamed to `<slug>-<file>.md` at install but the frontmatter `name:` is unchanged. Two installed teams that both ship an agent with the same `name:` will collide — pick distinct names per team or namespace them in the description.
- **Skill frontmatter:** `name`, `description`, `user-invocable` (bool), `allowed-tools`, optional `argument-hint`. Skill directory names are **not** prefixed on install, so pick globally-unique slugs (the bundled teams prefix them — e.g. `swe-init`, `swe-architect-design`).
- **Hook scripts:** read the event JSON from stdin (`jq -r ...`), exit 0 to allow, non-zero with stderr to block. Keep them language/framework agnostic — see `teams/swe/scripts/iron-rule-check.sh` for the pattern.
- **MCP servers:** keep `.mcp.json` minimal. Servers requiring secrets should not be hardcoded.

Minimal `team.json`:

```json
{
  "name": "my-team",
  "description": "What this team is for, in one or two sentences.",
  "version": "0.1.0"
}
```

## Editing a bundled team

When changing a shipped team:

1. Edit files under `teams/<slug>/` directly — that's the source of truth.
2. Bump `team.json` `version` if behavior changed in a way users would notice.
3. Test by reinstalling into a throwaway project: `node bin/agent-teams.js add <slug> --scope project --yes` from inside a scratch dir.
4. Verify `<scratch>/.claude/agent-teams/<slug>/install.json` matches what you expected; then `remove` and confirm `settings.json` and `.mcp.json` come back clean.

There is no test suite — the only safety net is round-trip `add` → `remove` and inspecting the diff in `settings.json` / `.mcp.json` / the file tree.

## CLI shape

`parseArgs` accepts: `list|ls`, `add|install`, `remove|rm|uninstall`, plus `--scope user|project`, `-y/--yes`, `-h/--help`, `-v/--version`. Unknown flags fall through into team names. Interactive prompts (`@inquirer/prompts`) require a TTY — `ensureTTY()` exits 2 otherwise, so when scripting, always pass `--scope` and team names explicitly.

## When working in this repo

- The CLI is one file. Don't introduce a build step, a test framework, or extra deps unless asked. The point of this project is that it's small and obvious.
- Keep `README.md` and this file in sync if install behavior changes — both document the same destination table.
- Path rewrites for `${CLAUDE_PLUGIN_ROOT}` happen in `rewriteHookCommand` / `rewriteHookEntries`. If you change the on-disk layout for installed teams, update both the rewrite and the install destination, or hooks will silently break.
- The agent-author skills/agents under `.claude/` in this repo (see `.claude/agents/` and `.claude/skills/`) exist to help author and edit teams in `teams/`. Use them rather than freeform editing when adding or revising a team.

## Code quality bar

We follow the [Clean Code rules](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29) (Robert C. Martin) wherever they translate to the artefacts in this repo — JS in `bin/`, bash hook scripts in `teams/*/scripts/`, markdown prompts in `teams/*/agents/` and `teams/*/skills/`. The rules that bite most often here:

- **KISS / boy scout / root cause.** Prefer the smallest change that solves the actual problem. Leave files cleaner than you found them. Never paper over a bug — find why it happens.
- **Descriptive, searchable, unambiguous names.** No magic numbers, no encoded prefixes (`strFoo`, `iCount`), no abbreviated mystery vars. The CLI's identifiers (`SCOPES`, `manifestPath`, `rewriteHookEntries`) are the bar.
- **Small functions / scripts that do one thing.** Hook scripts in `teams/*/scripts/` should each have a single responsibility — `iron-rule-check.sh` checks separation, `auto-format.sh` formats. Don't merge concerns.
- **No flag arguments.** A boolean flag that selects between two behaviours is two functions wearing one name. Split it. (Applies to JS helpers, bash scripts, and slash commands alike.)
- **Comments as intent / warning, not narration.** Don't comment what the code does — that's the code's job. Comment why a non-obvious choice was made or warn about a consequence (`# project-scope only — user scope silently skips`).
- **Vertical structure.** Related things close, unrelated things separated by whitespace. Variables declared near their use. Dependent functions adjacent.
- **Avoid the smells.** Rigidity (a small change cascades), fragility (one change breaks unrelated things), immobility (a piece can't be reused without dragging the project with it), needless complexity, needless repetition, opacity (you can't tell what it does without rereading three times). If you spot any while editing, fix what's in scope and surface the rest.

The team-author / team-reviewer / team-editor subagents under `.claude/agents/` apply these rules when generating, auditing, and editing teams — read those files for the per-component checklists.
