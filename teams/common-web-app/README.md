# common-web-app

A **spec-driven** software-engineering team for typical web applications — a CEO-style orchestrator plus **9 specialized agents**, **9 user-invocable skills**, **5 hooks**, and a Playwright MCP server. Adapted from [yarikleto/claude-swe-plugin](https://github.com/yarikleto/claude-swe-plugin) and tuned for frontend, backend, and full-stack SaaS work.

> **Web-only by design.** Mobile-native, desktop, games, embedded, CLIs, blockchain, and generic libraries are out of scope — agents will decline.

## Spec-driven by design

The team implements the four-phase **Spec-Driven Development (SDD)** loop that tools like [GitHub Spec Kit](https://github.com/github/spec-kit) and [Kiro](https://kiro.dev/) have made the 2026 standard for agentic coding: **Specify → Plan → Tasks → Implement**, with a steering layer above it and verification baked into the gate. The spec is the contract; the code is what the agents derive from it.

| SDD phase | What it produces | Skill |
| --- | --- | --- |
| **Steer** | Project-wide vision, principles, knowledge base | `common-web-app-init` (kickoff), `common-web-app-brief` (refresh), `common-web-app-sync` (incremental) |
| **Specify** | Product vision with acceptance criteria | `common-web-app-init` |
| **Design** | UX prototype + system design (ADRs, C4, contracts) | `common-web-app-designer-spec`, `common-web-app-architect-design` |
| **Plan** | Schema + infra as scoped sub-specs | `common-web-app-dba-schema`, `common-web-app-devops-deploy` |
| **Tasks** | Single-discipline slices (backend + dependent frontend) from a walking skeleton | `common-web-app-architect-tasks` |
| **Implement** | Working code per task | `common-web-app-sprint` → `backend` + `frontend` agents |
| **Verify** | Tests pass, acceptance + spec criteria met | `common-web-app-sprint` → engineer self-review + `designer` / `ux-engineer` / `manual-qa` |

Every artefact lands in `.claude/` (vision, design docs, task list, schema), so the next session — or a different agent — picks up exactly where the last one stopped. Each engineer self-reviews their own diff (anti-cheat, spec lineage, security) before the CEO marks a task done; the `designer`, `ux-engineer`, and `manual-qa` verify the running UI.

### The spec is the contract

The vision document declares **product verification criteria** (`VC-1`, `VC-2`, …) — observable signals that the product is doing what it's supposed to do. The system design declares **technical verification criteria** (`TC-1`, `TC-2`, …) and traces each one back to a `VC`. Every implementation task declares `**Verifies:** TC-...`, and the architect maintains a coverage table in `_overview.md` so no `TC` is left unimplemented. Each engineer enforces the lineage in self-review: it's not enough that the local acceptance criteria pass — the diff must genuinely advance the declared `TC`s and must not silently regress others. That's the spec-driven contract.

## Install

From the published CLI:

```bash
npx @yarikleto/claude-agent-teams add common-web-app --scope project
```

Or from a local checkout of this repo:

```bash
node bin/agent-teams.js add common-web-app --scope project
```

Remove with `remove` instead of `add`. See the [top-level README](../../README.md) for what gets written where.

> **One `common-*-app` team per scope.** The sibling teams (`common-electron-app`, `common-ios-app`) ship agents with the same `name:` (`architect`, `designer`, `devops`, `manual-qa`, `researcher`, `ux-engineer`), the same `playwright` MCP server, and their own CEO bootstrap. Installing two into the same scope makes those agent names ambiguous — and removing one team deletes the shared `playwright` server out from under the other.

## Agents

Nine role-specific agents, all running on `opus`. They install as `common-web-app-<role>.md` but keep their original `name:` in frontmatter — so when you delegate, refer to them as `architect`, `backend`, `frontend`, etc.

Each agent knows what is *not* its job: `architect` doesn't write code, `frontend` doesn't touch the server, `backend` doesn't touch the UI, `manual-qa` doesn't write automated tests. There's no separate reviewer or tester — each engineer self-reviews and owns its own tests.

| Agent | Role |
| --- | --- |
| `architect` | VP of Engineering. Picks framework, auth, rendering strategy (SSR/SSG/ISR/SPA/islands), multi-tenancy, caching, observability. Writes ADRs and design docs. Does not write code. |
| `backend` | Senior Backend Engineer. HTTP APIs, business logic, persistence, auth, web security, backend performance, migrations + the server layer of full-stack frameworks. Test-driven by default (red-green-refactor). Does not touch the UI. |
| `dba` | Database Master. Postgres + Redis by default. Schemas, indexes, RLS, zero-downtime migrations, idempotency keys, transactional outbox, multi-tenant patterns, serverless connection pooling. |
| `designer` | Product Designer. Low-fi wireframes + self-contained HTML+Tailwind prototypes. Researches inspiration first; does not write application code. |
| `devops` | DevOps/Platform. CI/CD, Docker, web hosting (Vercel/Netlify/Railway/Render/Fly/Cloudflare), managed Postgres, CDN, SSL, previews, feature flags, WAF. PaaS over K8s; managed over self-hosted. |
| `frontend` | Senior Frontend Engineer. Screens, components, client state, forms, accessibility, frontend performance (React/Vue/Svelte/Solid + framework client layer). Verifies visually with Playwright; writes tests only for genuinely important client logic. Does not touch the backend. |
| `manual-qa` | Exploratory QA in a real browser via Playwright. Hunts bugs specs don't predict — viewports, throttling, deep links, autofill, a11y corners, Core Web Vitals. |
| `researcher` | Embedded researcher. Other agents delegate competitor / stack / codebase / UX-pattern research here. Reports BLUF with confidence levels and triangulated sources. |
| `ux-engineer` | UX engineer. Nielsen's 10 heuristics, WCAG 2.2 AA, web interaction patterns, Core Web Vitals as UX. Used during prototyping and during sprint. Does not write production code. |

## Skills

Nine user-invocable skills drive the lifecycle. They are slugged with the team prefix already, so once installed they appear in Claude Code as `/common-web-app-<name>`.

| Skill | When to run |
| --- | --- |
| `common-web-app-init` | Project kickoff — CEO crystallizes the product vision with the client. Run at the very start of a new project. |
| `common-web-app-brief` | Full refresh of the strategic knowledge base — re-read everything, talk to the client, update vision docs. Run when priorities shift or scope changes. |
| `common-web-app-architect-design` | Architect produces the full system design (ADRs, C4 context/container, data model, API contracts, observability + security plan). After vision and prototype are approved. |
| `common-web-app-designer-spec` | Designer extracts a design spec from the approved HTML prototype — design tokens, component inventory, screen map with visual acceptance criteria. |
| `common-web-app-architect-tasks` | Architect breaks the design into milestones and INVEST vertical-slice tasks (UI + API + business logic + data), starting from a walking skeleton. |
| `common-web-app-dba-schema` | DBA designs the schema — tables, indexes, constraints, RLS, zero-downtime migration plan. Writes `.claude/database-schema.md`. |
| `common-web-app-devops-deploy` | DevOps sets up the full infra — CI/CD with per-PR previews, Docker, hosting, managed Postgres, CDN, observability, flags, WAF. Generates client handoff guides where needed. |
| `common-web-app-sprint` | CEO runs the execution loop — pick next task → `backend` (TDD) or `frontend` (UI) implements and self-reviews → `designer`/`ux-engineer` check UI tasks → CEO marks done. Repeats through milestones. |
| `common-web-app-sync` | CEO does a quick sync — reviews recent changes and updates the knowledge base. Run regularly. |

## Hooks

Five hooks make the team's conventions enforceable instead of advisory. Hook commands reference `${CLAUDE_PLUGIN_ROOT}/scripts/...`; the CLI rewrites that placeholder to the correct install location.

| Event | Matcher | Script | Purpose |
| --- | --- | --- | --- |
| `SessionStart` | — | `session-start.sh` | Seed each session with project context from `.claude/`. |
| `PreToolUse` | `Edit\|Write` | `ceo-delegation-check.sh` | Block the CEO from editing non-strategic files directly — everything but its own planning docs must be delegated to an agent. |
| `PostToolUse` | `Edit\|Write` (async) | `auto-format.sh` | Format the just-edited file using whatever tool the repo already uses. |
| `PostToolUse` | `Bash` | `post-commit-remind.sh` | After a `git commit`, nudge the CEO (via `additionalContext`) to update task statuses that are still active. |
| `Stop` | — | `stop-save-progress.sh` | Warn the user (via `systemMessage`) about active tasks or uncommitted work when the CEO stops. |

## MCP servers

| Server | Command | Used by |
| --- | --- | --- |
| `playwright` | `npx @playwright/mcp@latest` | `designer`, `frontend`, `manual-qa`, `ux-engineer` — for in-browser screenshots, clicks, typing, navigation, key presses. |

`.mcp.json` is **project scope only** — installing the team at user scope silently skips it (Claude Code only reads `.mcp.json` from the working directory).

Diagrams in the design docs are Mermaid, so they need no extra tooling. If your session also has the claude.ai **Excalidraw** connector (`mcp__claude_ai_Excalidraw__*`), the architect and designer will use it for boards and wireframes on top — it's optional; nothing in the team requires it.

## Layout

```text
teams/common-web-app/
  team.json           # name, description, version, source
  .mcp.json           # playwright MCP server (project scope only)
  agents/             # 9 *.md — architect, backend, dba, designer, devops,
                      #          frontend, manual-qa, researcher, ux-engineer
  skills/             # 9 SKILL.md, slugs already prefixed
  hooks/hooks.json    # 5 hooks: SessionStart, PreToolUse, PostToolUse x2, Stop
  scripts/            # 5 *.sh
```

## Credits

Adapted from [yarikleto/claude-swe-plugin](https://github.com/yarikleto/claude-swe-plugin), narrowed and re-tuned for web-only work.
