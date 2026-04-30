# common-web-app

A **spec-driven** software-engineering team for typical web applications — a CEO-style orchestrator plus **10 specialized agents**, **10 user-invocable skills**, **5 hooks**, and a Playwright MCP server. Adapted from [yarikleto/claude-swe-plugin](https://github.com/yarikleto/claude-swe-plugin) and tuned for frontend, backend, and full-stack SaaS work.

> **Web-only by design.** Mobile-native, desktop, games, embedded, CLIs, blockchain, and generic libraries are out of scope — agents will decline.

## Spec-driven by design

The team implements the four-phase **Spec-Driven Development (SDD)** loop that tools like [GitHub Spec Kit](https://github.com/github/spec-kit) and [Kiro](https://kiro.dev/) have made the 2026 standard for agentic coding: **Specify → Plan → Tasks → Implement**, with a steering layer above it and verification baked into the gate. The spec is the contract; the code is what the agents derive from it.

| SDD phase | What it produces | Skill |
| --- | --- | --- |
| **Steer** | Project-wide vision, principles, knowledge base | `common-web-app-init` (kickoff), `common-web-app-brief` (refresh), `common-web-app-sync` (incremental) |
| **Specify** | Product vision with acceptance criteria | `common-web-app-init` |
| **Design** | UX prototype + system design (ADRs, C4, contracts) | `common-web-app-designer-spec`, `common-web-app-architect-design` |
| **Plan** | Schema, infra, test strategy as scoped sub-specs | `common-web-app-dba-schema`, `common-web-app-devops-deploy`, `common-web-app-tester-plan` |
| **Tasks** | INVEST-sized vertical slices from a walking skeleton | `common-web-app-architect-tasks` |
| **Implement** | Working code per task | `common-web-app-sprint` → `developer` agent |
| **Verify** | Tests pass, acceptance + spec criteria met | `common-web-app-sprint` → `tester` then `reviewer` (the only path to ship) |

Every artefact lands in `.claude/` (vision, design docs, task list, schema, test plan), so the next session — or a different agent — picks up exactly where the last one stopped. The `reviewer` is the verification gate: nothing ships without an explicit `APPROVE`.

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

## Agents

Ten role-specific agents, all running on `opus`. They install as `common-web-app-<role>.md` but keep their original `name:` in frontmatter — so when you delegate, refer to them as `architect`, `developer`, etc.

Each agent knows what is *not* its job: `architect` doesn't write code, `manual-qa` doesn't write automated tests, `reviewer` is the only path to ship.

| Agent | Role |
| --- | --- |
| `architect` | VP of Engineering. Picks framework, auth, rendering strategy (SSR/SSG/ISR/SPA/islands), multi-tenancy, caching, observability. Writes ADRs and design docs. Does not write code. |
| `dba` | Database Master. Postgres + Redis by default. Schemas, indexes, RLS, zero-downtime migrations, idempotency keys, transactional outbox, multi-tenant patterns, serverless connection pooling. |
| `designer` | Product Designer. Excalidraw wireframes + self-contained HTML+Tailwind prototypes. Researches inspiration first; does not write application code. |
| `developer` | Senior Web Engineer. Implements features, fixes bugs, refactors. Frontend (React/Vue/Svelte/Solid), backend HTTP/DB, full-stack frameworks. The primary code-writing agent. |
| `devops` | DevOps/Platform. CI/CD, Docker, web hosting (Vercel/Netlify/Railway/Render/Fly/Cloudflare), managed Postgres, CDN, SSL, previews, feature flags, WAF. PaaS over K8s; managed over self-hosted. |
| `manual-qa` | Exploratory QA in a real browser via Playwright. Hunts bugs specs don't predict — viewports, throttling, deep links, autofill, a11y corners, Core Web Vitals. |
| `researcher` | Embedded researcher. Other agents delegate competitor / stack / codebase / UX-pattern research here. Reports BLUF with confidence levels and triangulated sources. |
| `reviewer` | Staff Engineer code-quality gate. Verifies acceptance criteria are genuinely met and watches for web-specific risks — XSS, CSRF, SSRF, authn/authz, multi-tenant leakage, N+1, hydration mismatches, a11y regressions, destructive migrations. The gatekeeper. |
| `tester` | QA Lead. Vitest + Testing Library + Playwright + axe-core by default. Tests behavior through the rendered DOM and HTTP responses, not internals. Adversarial; zero tolerance for flake. |
| `ux-engineer` | UX engineer. Nielsen's 10 heuristics, WCAG 2.2 AA, web interaction patterns, Core Web Vitals as UX. Used during prototyping and during sprint. Does not write production code. |

## Skills

Ten user-invocable skills drive the lifecycle. They are slugged with the team prefix already, so once installed they appear in Claude Code as `/common-web-app-<name>`.

| Skill | When to run |
| --- | --- |
| `common-web-app-init` | Project kickoff — CEO crystallizes the product vision with the client. Run at the very start of a new project. |
| `common-web-app-brief` | Full refresh of the strategic knowledge base — re-read everything, talk to the client, update vision docs. Run when priorities shift or scope changes. |
| `common-web-app-architect-design` | Architect produces the full system design (ADRs, C4 context/container, data model, API contracts, observability + security plan). After vision and prototype are approved. |
| `common-web-app-designer-spec` | Designer extracts a design spec from the approved HTML prototype — design tokens, component inventory, screen map with visual acceptance criteria. |
| `common-web-app-architect-tasks` | Architect breaks the design into milestones and INVEST vertical-slice tasks (UI + API + business logic + data), starting from a walking skeleton. |
| `common-web-app-dba-schema` | DBA designs the schema — tables, indexes, constraints, RLS, zero-downtime migration plan. Writes `.claude/database-schema.md`. |
| `common-web-app-devops-deploy` | DevOps sets up the full infra — CI/CD with per-PR previews, Docker, hosting, managed Postgres, CDN, observability, flags, WAF. Generates client handoff guides where needed. |
| `common-web-app-tester-plan` | Tester drafts the test strategy — pyramid shape, framework picks, DB-isolation strategy, network-mock strategy, accessibility layer, coverage map, Definition of Done. |
| `common-web-app-sprint` | CEO runs the execution loop — pick next task → developer implements → tester verifies → reviewer gates. Repeats through milestones. |
| `common-web-app-sync` | CEO does a quick sync — reviews recent changes and updates the knowledge base. Run regularly. |

## Hooks

Five hooks make the team's conventions enforceable instead of advisory. Hook commands reference `${CLAUDE_PLUGIN_ROOT}/scripts/...`; the CLI rewrites that placeholder to the correct install location.

| Event | Matcher | Script | Purpose |
| --- | --- | --- | --- |
| `SessionStart` | — | `session-start.sh` | Seed each session with project context from `.claude/`. |
| `PreToolUse` | `Edit\|Write` | `iron-rule-check.sh` | Block edits that violate the team's separation of concerns (e.g. an agent writing outside its lane). |
| `PostToolUse` | `Edit\|Write` (async) | `auto-format.sh` | Format the just-edited file using whatever tool the repo already uses. |
| `PostToolUse` | `Bash` | `post-commit-remind.sh` | After commit-style shell commands, surface follow-ups (task status, sync, etc.). |
| `Stop` | — | `stop-save-progress.sh` | Persist what changed in the session before it ends. |

## MCP servers

| Server | Command | Used by |
| --- | --- | --- |
| `playwright` | `npx @playwright/mcp@latest` | `designer`, `developer`, `manual-qa`, `ux-engineer` — for in-browser screenshots, clicks, typing, navigation, key presses. |

`.mcp.json` is **project scope only** — installing the team at user scope silently skips it (Claude Code only reads `.mcp.json` from the working directory).

## Layout

```text
teams/common-web-app/
  team.json           # name, description, version, source
  .mcp.json           # playwright MCP server (project scope only)
  agents/             # 10 *.md — architect, dba, designer, developer, devops,
                      #          manual-qa, researcher, reviewer, tester, ux-engineer
  skills/             # 10 SKILL.md, slugs already prefixed
  hooks/hooks.json    # 5 hooks: SessionStart, PreToolUse, PostToolUse x2, Stop
  scripts/            # 5 *.sh — one per hook
```

## Credits

Adapted from [yarikleto/claude-swe-plugin](https://github.com/yarikleto/claude-swe-plugin), narrowed and re-tuned for web-only work.
