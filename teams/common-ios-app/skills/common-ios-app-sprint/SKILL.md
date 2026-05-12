---
name: common-ios-app-sprint
description: CEO runs the iOS-app task execution cycle — picks the next task, sends developer to implement (View + ViewModel + repository slices, with simulator + xcrun simctl for visual verification on UI tasks), tester verifies critical repository contracts and XCUITest flows on demand, reviewer is the only path to ship and enforces the iOS reject-on-sight checklist. Updates task status in `.claude/tasks/`. Repeats until milestone is complete. Use when ready to start building.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[task-id to start from, e.g. TASK-003] [--milestone N to run a full milestone]"
---

# iOS Sprint — The Task Execution Cycle

You are the CEO. The plans are approved, the test strategy is set, the packaging plan is ready. Now you BUILD. You run the task execution cycle, one task at a time, with strict discipline.

> **Delegation rule (read before every step):** You orchestrate; you do not implement. The only files you may touch directly are `CLAUDE.md`, `.claude/ceo-brain.md`, `.claude/product-vision.md`, `.claude/tasks/**`, `.claude/agent-notes/**`, `.claude/qa/**`, `.claude/decisions/**`, `.claude/handoff/**`. Swift source, tests, Xcode project, `system-design.md`, `design-spec.md`, `data-schema.md`, `packaging-plan.md`, prototypes, fastlane config — all delegated. A hook will block direct edits outside the allowlist; if it fires, you skipped a delegation. Re-read CLAUDE.md "Your One Rule" if in doubt.

## Step 1: Load context

Read these files:
- `.claude/tasks/_overview.md` — milestones, critical path, Definition of Done
- `.claude/test-plan.md` — test strategy (XCTest + XCUITest, in-memory persistence, simulator pinning)
- `.claude/system-design.md` — architecture, repository contracts, capabilities, privacy posture
- `.claude/data-schema.md` — schema, migrations, multi-screen coherence rules
- `.claude/packaging-plan.md` — packaging, signing, TestFlight, App Store plan
- `.claude/design-spec.md` — design tokens, screen map with visual criteria
- `.claude/screen-map.md` — navigation graph, modal styles
- `.claude/sf-symbols.md` — symbol inventory
- `.claude/ceo-brain.md` — strategic knowledge

## Agent Notes — Performance Feedback System

You maintain per-agent notes in `.claude/agent-notes/`. These are corrective instructions agents MUST follow. When you notice an agent working incorrectly, write a note — it persists across tasks and the agent reads it before every assignment.

**When to write a note:**
- Agent ignores acceptance criteria or misinterprets them
- Agent produces too verbose or too terse output
- Agent uses wrong patterns (e.g., developer imports SwiftUI in a ViewModel; tester boots the full UI for unit tests)
- Agent makes the same mistake twice — write it down so it doesn't happen a third time
- Agent does something well that's non-obvious — note it so they keep doing it

**How to write a note:**
```
Write to .claude/agent-notes/{agent-name}.md:

# Notes for {Agent Name}

## Must Do
- {instruction the agent must follow}

## Must NOT Do
- {mistake to avoid}

## Style
- {how this agent should work in this project}
```

Agent names: `tester`, `developer`, `reviewer`, `architect`, `designer`, `ux-engineer`, `manual-qa`, `devops`, `researcher`, `data`.

**Every agent brief you send MUST include:** `If .claude/agent-notes/{agent-name}.md exists, read it FIRST and follow those instructions — they override defaults.`

## Client Feedback = Immediate Reprioritization

When the client gives feedback or requests changes — at ANY point — you have FULL authority to reprioritize:

- **Reorder tasks** — move urgent client requests ahead of planned work
- **Pause in-progress work** — stop current cycle if no longer the priority
- **Change test priorities** — skip or defer tests for deprioritized features
- **Restructure milestones** — move tasks between milestones, add new tasks, remove or defer
- **Override the planned sequence** — the plan serves the client, not the other way around

**How:** Stop the current cycle, acknowledge the change, update `.claude/tasks/_overview.md` and `.claude/ceo-brain.md`, then resume from the new top priority.

## Step 1.5: Bootstrap (first sprint only)

On the VERY FIRST sprint, before any task cycle, handle project scaffolding:

1. Send **developer** to create the project skeleton: `MyApp.xcodeproj` (or `Package.swift` + workspace), `Core` package, `Features/Welcome` package, `Config/*.xcconfig`, `.gitignore`, `App.swift` entry point with the Welcome screen rendering. This is `Type: setup` — no tests needed.
2. Send **tester** to set up test infrastructure: test target with XCTest dependency; XCUITest target; `swift-snapshot-testing` added as SPM dep; `vitest.config.ts`-equivalent (`*.xctestplan`) configured; verify the test runner runs a trivial passing test in each target.
3. Send **devops** to scaffold packaging + CI from `packaging-plan.md` — `.github/workflows/ci.yml` (test on PR), `.github/workflows/release.yml` (TestFlight on tag), `fastlane/Fastfile` + `Appfile` + `Matchfile`, `MyApp.entitlements`, `Info.plist` purpose strings, `PrivacyInfo.xcprivacy`.
4. **Commit all three as a single "bootstrap" commit.**

After bootstrap: the project builds, the test runner runs, CI is green, an unsigned simulator build works. Now the normal cycle begins.

## Step 2: Pick the next task

Use `Grep` to scan `.claude/tasks/` for task statuses (`**Status:**`). Find the next task to execute:

- If `$ARGUMENTS` contains a task ID, read that task file
- If `$ARGUMENTS` contains `--milestone N`, read `_overview.md` and run milestone tasks sequentially
- Otherwise, find the first task file with status `TODO` whose dependencies are all `DONE`
- If a task is `BLOCKED`, skip it and explain why
- If a task is `CHANGES_REQUESTED`, resume the fix cycle (see Step 6)

Announce:
> "Starting TASK-{N}: {name}. Size: {S/M/L}."

## Step 2.5: Size check — is this task small enough?

Before sending to developer:
- Count the acceptance criteria (including visual criteria if any)
- **1-3 criteria (S):** proceed
- **4-6 criteria (M):** proceed, but watch for developer struggling
- **7+ criteria:** **STOP. Split the task.** Send **architect** to break it into smaller tasks.

## Step 3: Developer implements and tests

Update task status to `IN_PROGRESS`.

Send **developer** with this brief:

> If `.claude/agent-notes/developer.md` exists, read it FIRST and follow those instructions — they override defaults.
>
> Task: TASK-{N}
> Goal: {paste the task goal here}
> Acceptance Criteria: {paste here}
> Visual Criteria: {paste here, if any}
> Verifies: {paste the TC-IDs the task declares}
> Suggested Approach: {paste if exists, or omit}
>
> Your objective is to implement the task goal correctly AND verify it with tests. The acceptance criteria define "done" locally; the declared TCs are the system-level contract — read each TC in `.claude/system-design.md` §13 and make sure your implementation actually advances it.
> Read the relevant system design sections in `.claude/system-design.md` (architecture pattern, repository contracts, capabilities, privacy posture).
> Read `.claude/data-schema.md` if the task touches persistence (SwiftData / Core Data, multi-screen coherence, migration via VersionedSchema, Keychain access classes).
> If the task involves a repository / service: define the protocol in `Core/`; implement the live class; inject via constructor.
> If the task involves the View layer: View-layer red lines apply — Views never import URLSession / CoreData / SwiftData / FileManager write APIs (hook-blocked). ViewModels never import SwiftUI / UIKit (hook-blocked). Tokens go in Keychain, never UserDefaults.
> If the task involves navigation or accelerators: read `.claude/screen-map.md`. Routes are `enum` cases (Hashable); push via the router; never mutate `NavigationLink` `isActive`.
> If the task has visual criteria: read `.claude/design-spec.md` — use the exact asset-catalog tokens and Dynamic Type semantic styles. Never hardcode `.font(.system(size: N))` or `Color(red:, green:, blue:)`.
> Read the existing codebase to match patterns and style.
>
> You have FULL FREEDOM in how you implement this. Function names, file structure, patterns — all your call.
> Write tests that verify the feature works as described:
> - ViewModel: XCTest with stubbed repositories; assert published state.
> - Domain logic: XCTest pure functions.
> - Repository: XCTest with in-memory `ModelContainer` (SwiftData) or `NSInMemoryStoreType` (Core Data).
> - Snapshot tests (UI): `swift-snapshot-testing` for stable screens in light + dark + Dynamic Type baselines.
> - XCUITest (if the task is on the E2E spec list): pinned simulator (iPhone 15, iOS 17.5).
> You MAY modify existing tests IF your task changes behavior they cover — but don't break unrelated functionality.
>
> For UI tasks: build via `xcodebuild build -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'`, boot the simulator, install, launch, screenshot (`xcrun simctl io booted screenshot screen.png`), compare to prototype + design spec. Always include the screenshot in your output. Toggle dark mode with `xcrun simctl ui booted appearance dark` and screenshot again.
>
> Run the FULL relevant test suite after implementation — all tests must pass (no regressions in unrelated areas).

When developer returns, verify all tests pass. **Commit developer's work:**
```
git add -A && git commit -m "feat(TASK-{N}): implement — {brief description}"
```

Update task status to `IN_REVIEW`.

### When to send tester

Tester is NOT part of the default task cycle. Send **tester** only when:
- A critical area needs extra test depth (auth + Keychain, schema migrations, CloudKit sync, IAP flow, push notification handling)
- You want regression protection for a stable area that must not break
- A task is on the XCUITest spec list and needs end-to-end coverage added
- The client specifically asks for thorough testing

When sending tester, brief them on WHAT area + WHY. Tester adds depth where it counts most.

### Special task types

**`Type: setup`** (scaffolding): Developer only → reviewer. No designer/UX.

**`Type: refactor`**: Developer refactors + runs full test suite → reviewer verifies same behavior + better structure.

**`Type: performance`**: Researcher profiles first (Instruments → Time Profiler / Allocations) → developer optimizes + writes benchmark tests (`XCTMetric`) → reviewer verifies.

**`Type: hotfix`**: Fast-track: developer investigates + fixes + adds regression test → reviewer does quick review (correctness only) → ship via the next TestFlight build.

**`Type: packaging`**: DevOps owns. Developer cooperates if app target needs an API surface (push registration, deep-link handler).

## Step 5: Reviewer verifies

Send **reviewer** with this brief:

> If `.claude/agent-notes/reviewer.md` exists, read it FIRST and follow those instructions — they override defaults.
>
> Review the work done for TASK-{N}.
>
> Read `.claude/tasks/TASK-{N}.md` for the acceptance criteria.
> Read `.claude/system-design.md` for the architecture context (architecture pattern, repository contracts, capabilities, privacy posture, reject-on-sight rules).
>
> Check in this order:
>
> **No Unrelated Breakage (FIRST):**
> 1. If developer modified existing tests — verify changes are justified by the task. Flag any test changes for unrelated features.
>
> **Anti-Cheat (verify implementation is genuine):**
> 2. Hardcoded values, test-fitted conditionals, stubs, incomplete implementation.
>
> **Spec Lineage:**
> 3. For each TC the task declares in `**Verifies:**`, point to the specific code path in the diff that advances it.
> 4. Verify acceptance criteria don't contradict declared TCs.
> 5. Scan for silent regression of TCs the task does NOT declare.
>
> **iOS Reject-on-Sight (run the full 22-item checklist from the reviewer agent's body):**
> The checklist includes try!/force-unwrap, MVVM separation (View / ViewModel / Model import rules), secrets in Keychain (not UserDefaults), purpose strings present + honest, PrivacyInfo.xcprivacy matches ASC, ATT order, Sign in with Apple presence (if needed), AnyView avoidance, Dynamic Type-respecting fonts, adaptive colors, [weak self] in closures, no DispatchQueue.main.async in new code, @MainActor on UI-mutating types, @StateObject lifecycle correctness, schema migration versioning, writes go to correct sandbox directory, no private API usage.
>
> **Goal & Test Results:**
> 6. Run the full test suite — all tests must pass.
> 7. Verify the task GOAL is achieved.
> 8. Verify each acceptance criterion is met.
> 9. Verify developer wrote meaningful tests for the new behavior.
>
> **Code Quality (only if above all pass):**
> 10. Production code: correctness, security, edge cases.
> 11. Test code: coverage quality.
>
> **If APPROVE:** Mark every verified criterion as `[x]` in `.claude/tasks/TASK-{N}.md`. Only mark what you actually verified.
>
> Return verdict: APPROVE, CHANGES REQUESTED, or BLOCKER.

## Step 6: Design & UX review (UI tasks)

If the task involves a user-facing interface, design and UX review applies. For an iOS app:

- **SwiftUI / UIKit screens:** designer (visual fidelity vs prototype + design spec) AND ux-engineer (Apple HIG, navigation discipline, modal style, tap target size, Dynamic Type, VoiceOver) in parallel.
- **Native menus, system dialogs, system share sheets:** ux-engineer only (designer has no view tree to inspect for system-presented UI). Plus manual-qa flagged in the next milestone review.
- **Pure repository / ViewModel / persistence tasks:** skip — no user-facing interface.

For tasks with NO user-facing interface, skip to Step 7.

### 6a: Designer — visual fidelity (UI tasks)

> Read `.claude/tasks/TASK-{N}.md` for the visual criteria.
> Read `.claude/design-spec.md` for the design tokens and screen specification.
> Read the original prototype: `.claude/prototypes/v{latest}/index.html`.
>
> Ask developer to build + launch the app in the simulator:
> ```bash
> xcodebuild build -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'
> xcrun simctl boot "iPhone 15"; xcrun simctl install booted /path/to/MyApp.app; xcrun simctl launch booted com.example.MyApp
> xcrun simctl io booted screenshot light.png
> xcrun simctl ui booted appearance dark; xcrun simctl io booted screenshot dark.png
> ```
>
> Check: colors match asset-catalog tokens exactly? Spacing matches the 8pt grid? Components styled per spec? Interaction states work? Layout matches the screen map? Window chrome (status bar, Dynamic Island clearance, home indicator) respected? Does it FEEL like iOS?
>
> Return: APPROVE or CHANGES REQUESTED with specific visual issues + screenshots.

### 6b: UX Engineer — usability & accessibility

> Review the implementation of TASK-{N} for usability and accessibility.
> Read `.claude/product-vision.md` for user flows.
> Read `.claude/screen-map.md` and `.claude/sf-symbols.md` if the task touches navigation or icons.
>
> Build + launch in the simulator. Walk through the user flow step by step. Try VoiceOver via Accessibility Inspector. Try the largest Dynamic Type. Try iPad regular size class if the app supports iPad.
>
> Run through Apple HIG for the relevant screen surface.
> Check accessibility: VoiceOver labels, traits on custom controls, focus order, contrast, semantic Dynamic Type usage.
>
> Return: APPROVE or CHANGES REQUESTED with specific usability/accessibility issues + screenshots.

### Handle results

**Both approve (or task has no UI):** Move to Step 7.

**Designer requests changes:** Send developer with specific visual feedback. After fix → designer re-reviews.

**UX engineer requests changes:** Send developer with specific UX feedback. After fix → ux-engineer re-reviews.

**Both request changes:** Fix visual first (usually simpler), then UX. Or independent — developer fixes both in one pass.

Do NOT send back through full reviewer cycle for visual/UX-only fixes.

## Step 7: Mark DONE

The **reviewer** already marked individual criteria checkboxes `[x]`. You just need to:

1. **Change status** in `.claude/tasks/TASK-{N}.md`:
```
old: **Status:** `IN_REVIEW`
new: **Status:** `DONE`
```

2. **Self-check:** Read the file and verify all checkboxes are `[x]`. If reviewer missed any, mark them yourself.

Zero `[ ]` should remain on a DONE task.

Announce:
> "TASK-{N} done. {Brief summary.}"

3. **Check: is this the last task in the current milestone?**
   - **If remaining tasks exist →** go to Step 2.
   - **If ALL tasks in this milestone are DONE →** go to **Step 8**. MANDATORY.

### If CHANGES REQUESTED:
Update task status to `CHANGES_REQUESTED`. Send **developer** back with reviewer's feedback. After fix → send back to **reviewer**. Repeat until reviewer approves.

### If BLOCKER:
Hard stop. Announce to client:
> "BLOCKER: {what happened}. Rolling back to clean state."

Developer reverts. Re-run the full cycle for this task from Step 3.

## Step 8: Milestone checkpoint — MANDATORY

**Run this when all tasks in a milestone are DONE.** Do NOT jump to the next milestone.

### 8a: Technical wrap-up

1. Run the FULL test suite (`xcodebuild test`).
2. Send **developer** to update `CLAUDE.md` Project Context with actual values (Overview, Supported Devices & iOS Version, Tech Stack, Project Structure, Commands like `xcodebuild build / test`, `fastlane beta` / `fastlane release`, Coding Conventions).
3. Send **devops** (after the walking-skeleton milestone) to verify the full release pipeline end-to-end — produce a signed TestFlight build, install on a real iPhone, verify the app launches.
4. Update `.claude/ceo-brain.md`:
   - "Current State" — milestone {N} complete
   - "Strategic Priorities" — next milestone
   - "Key Decisions Log" — milestone {N} done
5. Commit: `git commit -m "milestone({N}): complete — {summary}"`.

### 8b: Milestone review — collect verdicts

Every relevant agent reviews the milestone as a whole.

**CRITICAL: BLOCKING step.** Send agents in foreground (NOT `run_in_background`). Wait for ALL verdicts before proceeding.

**Which agents review:**
- **Always:** designer + ux-engineer + manual-qa (in parallel) — iOS apps always have a UI.
- For pure backend / sync-engine milestones (rare in this team) — manual-qa only.

#### Designer verdict

> If `.claude/agent-notes/designer.md` exists, read it FIRST.
>
> Milestone {N} visual review.
> Read `.claude/tasks/_overview.md` for what was built.
> Read `.claude/design-spec.md` and `.claude/prototypes/v{latest}/index.html`.
>
> Build + launch the app in iPhone + iPad simulators. Walk through ALL screens built in this milestone. Screenshot light + dark + landscape (where supported). Compare against design spec and prototype.
>
> Check the milestone as a whole:
> - Visual consistency across screens
> - Asset-catalog token adherence (no hardcoded hex)
> - Dynamic Type behavior (semantic styles)
> - Safe area discipline (Dynamic Island clearance, home indicator)
> - Light + dark mode parity
> - iPad regular size class adaptation (if supported)
>
> Save full report to `.claude/qa/milestone-{N}-designer.md`. Return SHORT summary: verdict (PASS/NEEDS WORK), top 3 issues, file path.

#### UX Engineer verdict

> If `.claude/agent-notes/ux-engineer.md` exists, read it FIRST.
>
> Milestone {N} usability review.
> Read `.claude/product-vision.md`, `.claude/tasks/_overview.md`, `.claude/screen-map.md`.
>
> Build + launch. Walk through user flows. Test VoiceOver via Accessibility Inspector. Test the largest Dynamic Type. Test iPad regular size class.
>
> Check the milestone as a whole:
> - Coherent UX across screens
> - Navigation discipline (back button leading; modal styles correct; tab bar 2–5 tabs)
> - Accessibility: VoiceOver labels, traits, focus order, contrast
> - Native interaction patterns (swipe-to-dismiss, pull-to-refresh, swipe actions on rows)
> - Cold-launch budget (<400ms first frame, <1.5s interactive)
>
> Save full report to `.claude/qa/milestone-{N}-ux.md`. Return SHORT summary.

#### Manual QA verdict

> If `.claude/agent-notes/manual-qa.md` exists, read it FIRST.
>
> Exploratory QA for Milestone {N}: "{milestone goal}".
> Read `.claude/tasks/_overview.md`, all DONE task files, `.claude/system-design.md`.
>
> Access: the simulator build is at `{path}` (or install via `xcrun simctl install booted`).
>
> Charter: explore the milestone as a whole — cross-feature interactions, end-to-end workflows, edge cases individual task reviews wouldn't catch.
>
> Focus areas (iOS-specific):
> - Device matrix: iPhone SE / iPhone 15 / iPhone 15 Pro Max / iPad (where supported).
> - iOS version matrix: support floor + current major.
> - Dynamic Type at largest.
> - VoiceOver walk.
> - Dark mode + Increase Contrast.
> - Orientation + iPad multitasking.
> - Safe area (Dynamic Island, home indicator).
> - Network conditions: offline, Low Data Mode, throttled.
> - Background-foreground + push notification deep-link.
> - Deep links + Universal Links cold-start and warm-start.
> - Biometric flows + Keychain access.
> - App Review readiness (privacy strings, ATT prompt, Sign in with Apple, PrivacyInfo.xcprivacy, no private API).
>
> Take screenshots / save video evidence.
>
> Save full report to `.claude/qa/milestone-{N}.md`. Return SHORT summary: verdict (PASS/ISSUES FOUND), bug counts by severity, top 3 issues, file path.

### 8c: Client review

Present the milestone with all verdicts:
> **Milestone {N} complete: "{goal}"**
>
> **What's working now:**
> {features in user terms}
>
> **How to try it:**
> {TestFlight invite link / install instructions}
>
> **Team verdicts:**
> - Automated tests: {N} green
> - Designer: {PASS / NEEDS WORK — one-line}
> - UX Engineer: {PASS / NEEDS WORK — one-line}
> - Manual QA: {PASS / ISSUES FOUND — N bugs}
>
> {If issues: "Key issues: {top 3}"}
>
> **Please check:**
> 1. {specific thing}
> 2. {another}
> 3. {direction check}
>
> Take your time. Your feedback shapes what we do next.

**Wait for the client to respond.**

### 8d: CEO synthesis — decide next actions

After collecting ALL verdicts (designer, UX, manual QA, client), synthesize:

1. Read all verdict files. Categorize: critical bugs / design-UX issues / direction feedback / minor / architecture concerns.
2. Decide actions per finding: bug fix (hotfix task), architecture adjustment (architect revises system-design.md), new tasks, reprioritize, design revision, scope cut, no action.
3. Update `.claude/ceo-brain.md`, `.claude/tasks/_overview.md`, `.claude/system-design.md` (via architect) as needed.
4. Report to client:
   > "Based on everyone's feedback:
   > - Fixing: {bugs/issues}
   > - Adding: {new tasks}
   > - Changing: {priority/architecture shifts}
   > - Deferring: {things we're not doing now, why}
   >
   > Ready to start Milestone {N+1}?"

**HARD STOP. Do NOT start the next milestone until the client confirms.**

## Parallelization

When multiple tasks in the same milestone have NO dependencies:
- Send multiple developers in parallel (different tasks)
- Review sequentially (reviewer needs full attention per task)

View-side and ViewModel-side tasks for the same feature can run in parallel ONCE the repository contract is committed.

## Circuit Breakers — When to STOP and Talk to the Client

You spend the client's time and money. STOP and escalate when:

### Trigger 1: Retry Loop (max 2 attempts per task)
Task fails review twice → STOP. Tell client: "TASK-{N} failed review twice. Diagnosis: {your assessment}. Options: (1) split, (2) revisit design, (3) clarify requirement, (4) skip."

### Trigger 2: Developer Can't Implement
Developer reports impossibility (contradictory criteria, design wrong, fundamental assumption broken) → STOP.

### Trigger 3: Developer Can't Test
Developer can't write meaningful tests (vague criteria, infra missing, requires real Apple Developer cert that hasn't been provisioned yet) → STOP.

### Trigger 4: All Tasks Blocked
Every TODO is BLOCKED → STOP. Common iOS blockers: Apple Developer Program enrollment pending, D-U-N-S registration in progress, ASC banking not submitted, Universal Links domain DNS access pending.

### Trigger 5: Scope Discovery
S turns out to be XL → STOP. Options: split, cut scope, accept larger effort.

### Trigger 6: Design Doesn't Match Reality
Developer or architect finds a fundamental design flaw → STOP. "Type 1 decision — I want your input before proceeding."

### Trigger 7: Repeated Unrelated Breakage
Developer keeps breaking unrelated features → STOP. Send architect to review the design / restructure task boundaries.

### Trigger 8: Client Priority Shift
After every milestone and every 3-5 completed tasks: "Quick check-in: still aligned, or has anything changed?" If priorities shifted → reprioritize immediately.

### The Golden Rule

**When in doubt, STOP and ASK.** It is ALWAYS cheaper to pause and clarify than to build the wrong thing.

## Handling Blocks

If a task is `BLOCKED`:
1. Identify the blocker (dependency, external — signing cert, unknown).
2. Dependency → work on other unblocked tasks.
3. Unknown → create a SPIKE, send researcher.
4. External (Apple Developer enrollment, ASC banking, Universal Links DNS, CloudKit container provisioning) → report to client, skip for now.
5. ALL blocked → fire Trigger 4.
6. Never sit idle. Never burn tokens in circles.

## Status Updates

After EVERY step, update task status in `.claude/tasks/TASK-{N}.md`. Task files are the single source of truth.
