# common-electron-app

A **spec-driven** software-engineering team for cross-platform desktop applications built on Electron — a CEO-style orchestrator plus **10 specialized agents**, **10 user-invocable skills**, **5 hooks**, and a Playwright MCP server (which drives Electron via `_electron.launch`). Adapted from `common-web-app` within this repo and re-tuned for desktop work — process model, IPC discipline, code signing, notarization, auto-update.

> **Desktop-only by design.** Web SaaS, mobile-native, embedded, games, CLIs, blockchain, and generic libraries are out of scope — agents will decline.

> **Mutually exclusive with `common-web-app` at the same scope.** Both teams ship agents with the same frontmatter `name:` (`architect`, `developer`, `reviewer`, etc.). Installing both at the same scope (user OR project) collides on agent invocation. Pick one team per project.

## Spec-driven by design

The team implements the four-phase **Spec-Driven Development (SDD)** loop: **Specify → Plan → Tasks → Implement**, with a steering layer above it and verification baked into the gate. The spec is the contract; the code is what the agents derive from it.

| SDD phase | What it produces | Skill |
| --- | --- | --- |
| **Steer** | Project-wide vision, principles, knowledge base | `common-electron-app-init` (kickoff), `common-electron-app-brief` (refresh), `common-electron-app-sync` (incremental) |
| **Specify** | Product vision with desktop dimensions (target platforms, distribution, auto-update strategy, lifecycle mode) and acceptance criteria | `common-electron-app-init` |
| **Design** | UX prototype + system design (process model, IPC contracts, security posture, fuses, packaging strategy, ADRs, C4) | `common-electron-app-designer-spec`, `common-electron-app-architect-design` |
| **Plan** | Schema, packaging, test strategy as scoped sub-specs | `common-electron-app-data-schema`, `common-electron-app-devops-package`, `common-electron-app-tester-plan` |
| **Tasks** | INVEST-sized vertical slices from a walking skeleton (window opens → IPC roundtrip → persistence → signed installer that self-updates) | `common-electron-app-architect-tasks` |
| **Implement** | Working code per task — renderer + preload + main slices | `common-electron-app-sprint` → `developer` agent |
| **Verify** | Tests pass, acceptance + spec criteria met, Electron security red lines unbroken | `common-electron-app-sprint` → `tester` then `reviewer` (the only path to ship) |

Every artefact lands in `.claude/` (vision, design spec, menu map, shortcut map, system design, data schema, packaging plan, task list, test plan), so the next session — or a different agent — picks up exactly where the last one stopped. The `reviewer` is the verification gate: nothing ships without an explicit `APPROVE`.

### The spec is the contract

The vision document declares **product verification criteria** (`VC-1`, `VC-2`, …) — observable signals that the product is doing what it's supposed to do. The system design declares **technical verification criteria** (`TC-1`, `TC-2`, …) and traces each one back to a `VC`. Every implementation task declares `**Verifies:** TC-...`, and the architect maintains a coverage table in `_overview.md` so no `TC` is left unimplemented. The `reviewer` enforces the lineage at merge time: it's not enough that the local acceptance criteria pass — the diff must genuinely advance the declared `TC`s and must not silently regress others. That's the spec-driven contract.

## Install

From the published CLI:

```bash
npx @yarikleto/claude-agent-teams add common-electron-app --scope project
```

Or from a local checkout of this repo:

```bash
node bin/agent-teams.js add common-electron-app --scope project
```

Remove with `remove` instead of `add`. See the [top-level README](../../README.md) for what gets written where.

## Agents

Ten role-specific agents, all running on `opus`. They install as `common-electron-app-<role>.md` but keep their original `name:` in frontmatter — so when you delegate, refer to them as `architect`, `developer`, etc. (Same names as `common-web-app` — see the mutual-exclusion warning above.)

Each agent knows what is *not* its job: `architect` doesn't write code, `manual-qa` doesn't write automated tests, `reviewer` is the only path to ship.

| Agent | Role |
| --- | --- |
| `architect` | VP of Engineering. Picks process model (single window / SDI / tabbed), IPC contracts (zod-validated, namespaced), security posture (contextIsolation + sandbox + CSP + fuses), builder choice (Forge default), auto-update strategy. Writes ADRs. Does not write code. |
| `data` | Local persistence specialist. better-sqlite3 v11+ with WAL + foreign_keys + busy_timeout. Drizzle migrations gated by `PRAGMA user_version`. safeStorage-wrapped key + optional better-sqlite3-multiple-ciphers. Rolling backups; `chokidar` over raw `fs.watch`; `write-file-atomic`. |
| `designer` | Desktop product designer. Excalidraw wireframes + self-contained HTML+Tailwind prototypes that simulate native window chrome, menu bars, accelerator hints. Researches Apple HIG / Microsoft Fluent / GNOME HIG first. Versions every iteration. |
| `developer` | Senior Electron engineer. Implements features in main / renderer / preload with strict separation. Typed `contextBridge` wrappers; never raw `ipcRenderer`. Validates every IPC payload with zod. Wires native menus, tray, dialogs, deep links, drag-drop, accelerators. |
| `devops` | Packaging & release engineer. Forge 7.x default. macOS Developer ID + `@electron/notarize` → notarytool + staple. Windows: Azure Trusted Signing default. electron-updater ≥ 6.3.9 with `verifyUpdateCodeSignature` ON. `@electron/rebuild` per-arch on native CI runners. Generates client handoff guides for cert provisioning. |
| `manual-qa` | Exploratory desktop QA. Hunts bugs specs don't predict — accelerator conflicts, HiDPI / per-monitor DPI, dark-mode flip, sleep/wake, Gatekeeper / SmartScreen / AppImage first-run trust, multi-monitor restore, drag-drop, native a11y with VoiceOver / Narrator / Orca. |
| `researcher` | Embedded researcher. Other agents delegate competitor / stack / pattern research here. Sources prioritized: electronjs.org, electronforge.io, electron.build, GitHub electron releases, recent VS Code / Linear / Notion / Figma engineering blogs. BLUF + confidence + triangulated sources. |
| `reviewer` | Staff Engineer code-quality gate. Verifies acceptance criteria are genuinely met and watches for Electron-specific risks — `nodeIntegration:true`, `contextIsolation:false`, raw `ipcRenderer` exposure, missing `senderFrame` / zod check, `eval`/`new Function` on dynamic input, electron-updater < 6.3.9, missing ASAR integrity fuse, deprecated `electron-rebuild`. The gatekeeper. |
| `tester` | QA Lead. Vitest (renderer + main pure with mocked `electron` module) + Playwright `_electron.launch()` against the **packaged** build + `electron-playwright-helpers` + zod IPC contract tests + `@axe-core/playwright`. Per-test `userData` isolation; single-instance lock disabled in tests; `xvfb-run` on Linux CI. |
| `ux-engineer` | Desktop UX engineer. Apple HIG / Microsoft Fluent / GNOME HIG specialist. Native menu discipline (mandatory mac App Menu, optional in-window for Win/Linux, GNOME header bar). Accelerator conventions (`CmdOrCtrl`, no OS-chord conflicts), focus rings, click targets. Used during prototyping and during sprint. Does not write production code. |

## Skills

Ten user-invocable skills drive the lifecycle. They are slugged with the team prefix already, so once installed they appear in Claude Code as `/common-electron-app-<name>`.

| Skill | When to run |
| --- | --- |
| `common-electron-app-init` | Project kickoff — CEO crystallizes the desktop product vision (target platforms, distribution channels, auto-update strategy, lifecycle mode) with the client. Run at the very start of a new project. |
| `common-electron-app-brief` | Full refresh of the strategic knowledge base — re-read everything, talk to the client, update vision docs. Run when priorities shift, scope changes, or the OS landscape moves. |
| `common-electron-app-architect-design` | Architect produces the full system design (ADRs, process-model + IPC contract + security posture + auto-update plan + packaging strategy + C4). After vision and prototype are approved. |
| `common-electron-app-designer-spec` | Designer extracts a design spec from the approved HTML prototype — design tokens, component inventory, screen map, **menu map** (per platform), **shortcut map** (every accelerator in `CmdOrCtrl` form), window-state spec. |
| `common-electron-app-architect-tasks` | Architect breaks the design into milestones and INVEST vertical-slice tasks (renderer + preload + main + persistence + packaging), starting from a walking skeleton that ends with a signed + notarized installer that self-updates. |
| `common-electron-app-data-schema` | Data agent designs the local persistence — better-sqlite3 schema, Drizzle migrations gated by `PRAGMA user_version`, encryption posture, rolling backup/restore plan, multi-window data coherence. Writes `.claude/data-schema.md`. |
| `common-electron-app-devops-package` | DevOps sets up the full packaging pipeline — Forge or electron-builder, macOS signing + notarization + staple, Windows signing (Azure Trusted Signing default), Linux AppImage + deb, fuses table including ASAR integrity, electron-updater channels, cross-platform CI matrix on native runners, client handoff guides. |
| `common-electron-app-tester-plan` | Tester drafts the test strategy — pyramid shape, framework picks, per-test `userData` isolation, single-instance-lock disable, `xvfb-run` on Linux CI, coverage map, Definition of Done. |
| `common-electron-app-sprint` | CEO runs the execution loop — pick next task → developer implements → tester verifies critical IPC contracts → reviewer gates with Electron red-lines. Repeats through milestones. |
| `common-electron-app-sync` | CEO does a quick sync — reviews recent changes (commits, IPC channels added, packaging config drift, electron-updater version bumps) and updates the knowledge base. Run regularly. |

## Hooks

Five hooks make the team's conventions enforceable instead of advisory. Hook commands reference `${CLAUDE_PLUGIN_ROOT}/scripts/...`; the CLI rewrites that placeholder to the correct install location.

| Event | Matcher | Script | Purpose |
| --- | --- | --- | --- |
| `SessionStart` | — | `session-start.sh` | Seed each session with project context from `.claude/` (vision, design spec, menu map, shortcut map, task list). |
| `PreToolUse` | `Edit\|Write` | `iron-rule-check.sh` | Block edits that violate Electron separation — `nodeIntegration:true` / `contextIsolation:false` / `sandbox:false` / `webSecurity:false` in main; direct `electron` / `fs` / `child_process` imports in renderer; raw `ipcRenderer` exposure in preload; `eval` / `new Function` / `webContents.executeJavaScript` on non-literal input; deprecated `electron-rebuild`. |
| `PostToolUse` | `Edit\|Write` (async) | `auto-format.sh` | Format the just-edited file using whatever tool the repo already uses. |
| `PostToolUse` | `Bash` | `post-commit-remind.sh` | After commit-style shell commands, surface follow-ups (task status, sync). |
| `Stop` | — | `stop-save-progress.sh` | Persist what changed in the session before it ends. |

## MCP servers

| Server | Command | Used by |
| --- | --- | --- |
| `playwright` | `npx @playwright/mcp@latest` | `designer`, `developer`, `manual-qa`, `ux-engineer` — drives Electron via `_electron.launch` for screenshots, clicks, typing, navigation against the running (or packaged) app. |

`.mcp.json` is **project scope only** — installing the team at user scope silently skips it (Claude Code only reads `.mcp.json` from the working directory).

## Layout

```text
teams/common-electron-app/
  team.json           # name, description, version
  .mcp.json           # playwright MCP server (project scope only)
  agents/             # 10 *.md — architect, data, designer, developer, devops,
                      #          manual-qa, researcher, reviewer, tester, ux-engineer
  skills/             # 10 SKILL.md, slugs already prefixed
  hooks/hooks.json    # 5 hooks: SessionStart, PreToolUse, PostToolUse x2, Stop
  scripts/            # 5 *.sh — one per hook
```

## Credits

Adapted from `common-web-app` within this repo, narrowed and re-tuned for desktop Electron work — process model, IPC discipline, code signing, notarization, auto-update.
