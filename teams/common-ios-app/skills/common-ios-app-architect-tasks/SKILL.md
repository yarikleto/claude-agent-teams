---
name: common-ios-app-architect-tasks
description: Architect decomposes the approved iOS-app system design into milestones and INVEST-sized vertical-slice tasks (UI + ViewModel + repository + persistence + signing) with acceptance criteria, dependencies, and a parallelization plan (the **Tasks** phase of the spec-driven loop). Each task declares which system-design verification criteria it advances. Starts with a concrete walking skeleton — App launches → primary screen → ViewModel roundtrip → persistence read/write → signed TestFlight build installable on a real iPhone. Use after system design is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing tasks]"
---

# Architect Tasks — Decompose System Design into Tasks

You are the CEO. The system design is approved. Send the **architect** to break it into a concrete, executable task plan the team can pick up and run with.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — the approved system design
- `.claude/product-vision.md` — the product vision
- `.claude/design-spec.md` — design tokens, components, screens
- `.claude/screen-map.md` — navigation graph
- `.claude/sf-symbols.md` — symbol inventory
- `.claude/ceo-brain.md` — CEO knowledge base

If `$ARGUMENTS` contains `--update`, read `.claude/tasks/_overview.md` and relevant task files first — architect revises, not starts from scratch.

## Step 2: Brief the architect

Send **architect** with this brief:

> Read these files:
> - `.claude/system-design.md` — full system design with ADRs, repository contracts, capabilities + entitlements, fuses-equivalent (privacy posture)
> - `.claude/product-vision.md` — vision, user flows, supported devices, minimum iOS version, monetization
> - `.claude/design-spec.md` — design tokens, screen map with visual acceptance criteria
> - `.claude/screen-map.md` — navigation graph (informs route enum + per-screen tasks)
> - `.claude/sf-symbols.md` — symbol inventory (informs asset-catalog tasks)
> - `.claude/prototypes/README.md` — find the latest approved prototype
> - The latest prototype HTML file — actual screens and interactions
>
> Produce a complete task breakdown. Save it as individual files in `.claude/tasks/` — one file per task.
>
> ## How to Decompose
>
> ### 1. Identify the Walking Skeleton
>
> The walking skeleton is the FIRST milestone — the thinnest end-to-end slice that exercises EVERY major architectural component. For an iOS app this is concrete:
>
> 1. **Xcode project scaffolded** — app target + Core package + Features/Welcome package, Swift 6 strict concurrency on, deployment target set, asset catalog with at least one color and one app icon.
> 2. **App launches** — primary tab opens, a "Hello" SwiftUI view renders, no white flash (background color matches the canvas token).
> 3. **ViewModel roundtrip** — a `HealthCheckRepository` protocol with a `live` implementation returning `{ status, version }`; the ViewModel calls it; the View renders the version.
> 4. **Persistence read/write** — write a single user-typed value to SwiftData (or Core Data) via the repository, restart, read it back on next launch.
> 5. **Signing** — cert + provisioning profile via fastlane match; first archive succeeds; binary signed.
> 6. **TestFlight** — first build uploaded to internal testers; installable on a real iPhone via TestFlight.
> 7. **Privacy posture** — `PrivacyInfo.xcprivacy` committed; all `NSUsageDescription` strings for declared capabilities present and honest.
>
> The walking skeleton should take 1-2 weeks to build. Anything beyond this is Milestone 1+.
>
> ### 2. Slice Vertically, Not Horizontally
>
> Every task must be a **vertical slice** through the iOS stack — SwiftUI View + ViewModel + repository call (+ any persistence / network / capability touched). Never create horizontal tasks like "set up all repositories," "build all screens," or "design the schema." (Schema work belongs in `/common-ios-app-data-schema`, not as a task.)
>
> Apply the **Elephant Carpaccio** mindset: always ask "can this be sliced thinner?" Each slice must:
> - Touch real UI (or a real packaging/signing step if no UI)
> - Work end-to-end (View ↔ ViewModel ↔ repository ↔ persistence / network)
> - Be visibly different from the previous slice
> - Deliver testable value
>
> ### 3. Apply INVEST to Every Task
>
> - **Independent** — minimize coupling
> - **Negotiable** — describes the GOAL, not HOW
> - **Valuable** — observable value to the user or system
> - **Estimable** — clear enough to size; otherwise create a spike
> - **Small** — 1-3 acceptance criteria ideal, 4-6 max
> - **Testable** — clear pass/fail acceptance criteria
>
> ### 4. Size Each Task — SPLIT AGGRESSIVELY
>
> **Smaller tasks = better agent quality.** Each task runs developer → reviewer (and tester / designer / ux-engineer where applicable) with isolated context.
>
> **Prefer many S over fewer M. Prefer M over L. Avoid L whenever possible.**
>
> Sizing by complexity:
> - **S** — 1-3 acceptance criteria, touches 1-2 files (e.g., "add a `prefs:read`-equivalent repository method with stubbed test", "wire Cmd+S keyboard shortcut to save in the iPad scene")
> - **M** — 4-6 acceptance criteria, touches 3-5 files (e.g., "Documents list screen: render documents from the repository, swipe-to-delete, pull-to-refresh")
> - **L** — 7+ acceptance criteria, touches 5+ files. **Warning sign — split further.**
>
> **Splitting rules:**
> - **L MUST be split** into S or M.
> - **M SHOULD be split** if it has more than 5 acceptance criteria or touches more than one screen / repository.
> - When in doubt — split.
>
> **How to split for iOS specifically:**
> - **By layer:** "Documents repository implementation" and "DocumentsViewModel" can be two tasks if you ship a stub repo first.
> - **By screen:** "Documents list" and "Document detail" are two tasks, not "documents feature."
> - **By state:** Happy path in one task, error / empty / loading in another.
> - **By platform surface:** "iPhone layout" and "iPad NavigationSplitView adaptation" are separate tasks.
> - **By capability:** "Sign in with Apple sign-in flow" and "Sign in with Apple sign-out + Keychain clearance" are separate.
> - **By extension:** "Widget extension home screen variant" and "Widget extension lock screen variant" are separate.
>
> Create **spike** tasks for unknowns — time-boxed research (always S) producing a decision or proof of concept, not code.
>
> ### 5. Write Acceptance Criteria
>
> Every task gets acceptance criteria in **Given/When/Then** or **checklist**:
>
> ```
> Given the Documents tab is selected
> When the user taps the + button in the trailing toolbar
> Then a sheet presents with detents [.medium, .large], an empty title field is focused, and "Create" in the trailing top bar is disabled
> ```
>
> Or:
>
> ```
> - [ ] `DocumentsRepository.fetchAll()` returns documents sorted by `updatedAt` descending
> - [ ] Returns `[]` when no documents exist
> - [ ] Propagates errors as typed `RepositoryError` cases
> - [ ] In-memory test container test passes
> ```
>
> ### 6. Map Dependencies
>
> For each task: **Depends on**, **Blocks**, **Parallel with**.
>
> Minimize dependencies. Define repository protocols early so View and ViewModel tasks can run in parallel against contracts.
>
> ### 7. Identify the Critical Path
>
> The longest chain of dependent tasks. Highlight it.
>
> ### 8. Define the Execution Flow for Each Task
>
> 1. **Developer** implements the feature with full freedom (View + ViewModel + repository where applicable).
> 2. **Tester** (on demand) verifies critical repository contracts and XCUITest flows.
> 3. **Reviewer** reviews code, tests, MVVM separation, iOS reject-on-sight checklist.
> 4. **Designer** + **ux-engineer** (UI tasks) review against design spec / HIG.
>
> ## Output Format
>
> Save tasks as **individual files** in `.claude/tasks/` — one file per task.
>
> ### File: `.claude/tasks/_overview.md`
>
> ````markdown
> # Task Breakdown
> > Generated from system design v{N} — {date}
>
> ## Summary
> - Total milestones: {N}
> - Total tasks: {N}
> - Estimated critical path: {N days/weeks}
> - Walking skeleton: Milestone 0 ({N tasks}, ~{N days}) — ends with a TestFlight-INSTALLABLE SIGNED build
>
> ## Dependency Graph
> <!-- Excalidraw diagram. Milestones as groups, tasks as nodes, dependencies as arrows. Critical path highlighted. -->
>
> ## Task Statuses
>
> | Status | Meaning | Next Step |
> |--------|---------|-----------|
> | `TODO` | Not started | Developer picks it up |
> | `IN_PROGRESS` | Developer is implementing + testing | Wait for developer |
> | `IN_REVIEW` | Developer done, reviewer checking | Wait for reviewer |
> | `CHANGES_REQUESTED` | Reviewer found issues | Developer fixes |
> | `DONE` | Reviewer approved, all criteria met | Move to next task |
> | `BLOCKED` | Waiting on dependency or external (e.g. Apple Developer enrollment) | Resolve blocker first |
>
> ## Definition of Done (applies to ALL tasks)
> - [ ] Developer implemented the feature and wrote tests
> - [ ] All tests pass (XCTest unit + integration; XCUITest for flagged tasks)
> - [ ] Reviewer verified goal is achieved, tests are meaningful, code quality is acceptable
> - [ ] Reviewer verified iOS red lines (try!/force-unwrap, MVVM separation, secrets in Keychain, privacy strings, Sign in with Apple if needed, dynamic-type-safe fonts, dark-mode-safe colors, no DispatchQueue.main.async in new code, [weak self] in long-lived closures)
> - [ ] No linter / typecheck warnings (SwiftLint, Swift 6 strict concurrency clean)
> - [ ] Status updated to `DONE`
>
> ---
>
> ## Milestone 0: Walking Skeleton
> > Goal: TestFlight-installable signed build that opens, completes one ViewModel roundtrip, persists one value, and is on a path to App Store submission.
> > Tasks: TASK-001 ... TASK-007
>
> ## Milestone 1: {Core Feature Name}
> > Goal: {what the user can do after this milestone}
> > Tasks: TASK-0XX, TASK-0XX, ...
>
> ## Milestone 2: {Next Feature}
> > ...
>
> ---
>
> ## Critical Path
> TASK-001 → TASK-002 → TASK-005 → TASK-007 → TASK-012 → ...
> Estimated duration: {N days}
>
> ## Parallelization Opportunities
> - After TASK-002 (repository protocols defined): View-side TASK-00X and ViewModel-side TASK-00Y can run in parallel
> - Packaging tasks (Apple Dev enrollment / match setup / TestFlight upload) can run in parallel with feature work
> - ...
>
> ## Nice-to-Haves (~)
> - ~TASK-0XX: {feature that's nice but not essential — widget, Live Activity, Apple Watch companion}
>
> ## Verification Criteria Coverage
> | TC | Task(s) | Status |
> | --- | --- | --- |
> | TC-1 | TASK-005, TASK-007 | covered |
> | TC-2 | TASK-006 | covered |
> | TC-5 (Keychain) | TASK-009 (auth) | covered |
> | TC-X | — | **GAP — needs a task** |
> ````
>
> ### File: `.claude/tasks/TASK-001.md`
>
> ````markdown
> # TASK-001: Xcode project scaffolding
> **Milestone:** 0 — Walking Skeleton
> **Status:** `TODO`
> **Size:** S | **Type:** setup
> **Depends on:** nothing
> **Verifies:** infrastructure
> **Goal:** A new clone runs `open MyApp.xcworkspace`, hits Cmd+R, sees an iOS Simulator launch the app to a blank "Hello" screen. Swift 6 strict concurrency enabled. No app code yet.
> **Acceptance Criteria:**
> - [ ] `MyApp.xcodeproj` (or `MyApp.xcworkspace` + `Package.swift`) committed
> - [ ] App target deployment target matches ADR-3 (e.g. iOS 17.0)
> - [ ] `Config/{Shared|Debug|Release}.xcconfig` committed; build settings reference them
> - [ ] Swift 6 strict concurrency enabled via SWIFT_STRICT_CONCURRENCY = complete
> - [ ] Core package and Features/Welcome package scaffolded
> - [ ] `.gitignore` excludes `*.xcodeproj/xcuserdata`, `*.xcworkspace/xcuserdata`, `DerivedData/`, `build/`
> **Cycle:** developer only (no tests for scaffolding) → reviewer
> ````
>
> ### File: `.claude/tasks/TASK-002.md`
>
> ````markdown
> # TASK-002: Secure window + ViewModel roundtrip skeleton
> **Milestone:** 0 — Walking Skeleton
> **Status:** `TODO`
> **Size:** M | **Type:** vertical-slice
> **Depends on:** TASK-001
> **Verifies:** TC-1
> **Screen:** Welcome (primary screen on launch)
> **Goal:** The app launches, the Welcome screen renders the app version returned by a `HealthCheckRepository` via a `WelcomeViewModel`. No white flash. No DispatchQueue.main.async — `@MainActor` annotations used.
> **Acceptance Criteria:**
> - [ ] `WelcomeView` is the primary screen; renders the app version
> - [ ] `WelcomeViewModel` is `@Observable` (iOS 17+) or `ObservableObject` (iOS 16+) and `@MainActor`
> - [ ] `HealthCheckRepository` protocol + `LiveHealthCheckRepository` implementation in `Core`
> - [ ] `WelcomeViewModel` injects `HealthCheckRepository`; ViewModel test exists with a stub
> - [ ] Background color of `WelcomeView` matches canvas token (no white flash)
> - [ ] Asset catalog contains the brand colors with Any + Dark Appearance pairs
> - [ ] App icon asset (placeholder is fine) committed
> **Visual Criteria:** N/A (skeleton)
> **Cycle:** developer (implements + tests via XCTest for the VM + repository, optional snapshot for the Welcome view) → reviewer
> ````
>
> ### File: `.claude/tasks/SPIKE-001.md`
>
> ````markdown
> # SPIKE-001: Confirm fastlane match works on our chosen CI runner
> **Milestone:** Spikes
> **Status:** `TODO`
> **Size:** S | **Timebox:** 4 hours
> **Question:** Does `fastlane match` decrypt the certs and install them on `macos-14` GitHub Actions runner with our ASC API key?
> **Deliverable:** Decision (ship / drop / use alternative) + minimal repro if we hit a blocker
> **Cycle:** devops → CEO decision
> ````
>
> **Rules:**
> - **Tasks describe the GOAL, not the HOW.** Implementation details (file names, function signatures, specific patterns) are the developer's decision.
> - **Every non-setup task MUST declare `**Verifies:**`** — at least one TC-ID from `.claude/system-design.md` §13. This is the spec→implementation lineage.
> - **Coverage check:** every TC in §13 MUST be advanced by ≥1 task by the end of the last milestone. List uncovered TCs in `_overview.md` so they can't slip.
> - One file per task in `.claude/tasks/`. File name = task ID.
> - Walking skeleton is ALWAYS Milestone 0. The skeleton ends with a TestFlight-installable signed build — anything less isn't a skeleton.
> - Every task is a vertical slice unless it's scaffolding, packaging, or signing infrastructure.
> - No L-sized tasks — split into S or M. Prefer S.
> - Every task has acceptance criteria.
> - Dependencies are explicit. No hidden coupling.
> - Critical path is highlighted.
> - Nice-to-haves marked with ~.
> - Execution flow explicit: developer (implements + tests) → reviewer (always).

## Step 3: Review the task breakdown

When the architect returns, read it yourself. Check:

- **Walking skeleton complete?** Does Milestone 0 end with a TestFlight-INSTALLABLE SIGNED build? If signing or TestFlight upload is deferred to Milestone 1 — send back. The skeleton must prove the entire pipeline.
- **Tasks small enough?** Most tasks should be S. Send back if M or L dominate.
- **Vertical slices?** No "set up all repositories" or "design all screens." If you see a horizontal task — send back.
- **Goals, not instructions?** If the Goal field has file paths or function names, send back: "Describe the goal, not the implementation."
- **Acceptance criteria clear?** Could the developer write meaningful tests from these?
- **Spec lineage closed?** Every non-setup task has `**Verifies:**`. Coverage table shows zero gaps.
- **Per-platform packaging tasks present?** Apple Developer enrollment + match cert setup + entitlements + TestFlight upload are typically distinct because the failure modes differ.
- **Dependencies minimize bottlenecks?** View-side and ViewModel-side tasks can run in parallel once the repository contract is committed.
- **100% coverage?** Does the task list account for everything in the system design?

If issues, send architect back with specific feedback.

## Step 4: Update the CEO brain

Update `.claude/ceo-brain.md`:
- "Current State" → task breakdown approved, ready for implementation
- "Strategic Priorities" → first milestone (walking skeleton)
- "Key Decisions Log" → task breakdown approved, {N} milestones, {N} tasks

## Step 5: Present to the client

Brief executive summary:

- "{N} milestones, {N} tasks total"
- "We start with the walking skeleton — a real TestFlight-installable signed build that opens, persists one value, and is on the path to App Store submission — takes about {N days}"
- "Then {milestone 1}, then {milestone 2}…"
- "Critical path is {N days/weeks}"
- Show the dependency graph diagram
- Flag any client actions needed before sprint can start (Apple Developer Program enrollment, ASC banking, Universal Links domain DNS access)

Ask: "Ready to start building?"
