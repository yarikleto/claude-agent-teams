---
name: common-web-app-architect-tasks
description: Architect decomposes the approved web-app system design into milestones and INVEST-sized vertical-slice tasks (UI + API + business logic + data) with acceptance criteria, dependencies, and a parallelization plan (the **Tasks** phase of the spec-driven loop). Each task declares which system-design verification criteria it advances, so the spec→implementation lineage is explicit. Starts with a walking skeleton (real, deployable, end-to-end). Use after system design is approved.
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
- `.claude/design-spec.md` — the design specification (tokens, components, screens)
- `.claude/ceo-brain.md` — CEO knowledge base

If `$ARGUMENTS` contains `--update`, read `.claude/tasks/_overview.md` and relevant task files first — architect revises, not starts from scratch.

## Step 2: Brief the architect

Send **architect** with this brief:

> Read these files:
> - `.claude/system-design.md` — the full system design with architecture, data model, API, components, and implementation plan
> - `.claude/product-vision.md` — the product vision with user flows
> - `.claude/design-spec.md` — design tokens, component inventory, and screen map with visual acceptance criteria
> - `.claude/prototypes/README.md` — find the latest approved prototype
> - The latest prototype HTML file — understand the actual screens and interactions
>
> Produce a complete task breakdown. Save it as individual files in `.claude/tasks/` — one file per task (see output format below).
>
> ## How to Decompose
>
> Follow this algorithm strictly:
>
> ### 1. Identify the Walking Skeleton
>
> The walking skeleton is the FIRST milestone — the thinnest possible end-to-end slice that exercises every major architectural component (frontend route, API handler, DB, auth, deploy pipeline). It is not a prototype. It is real, deployable software running on the chosen hosting target.
>
> Ask: "What is the simplest path a real user can take through the entire system that delivers some value?"
>
> Example (e-commerce SaaS): sign in → view one hardcoded product → add to cart → checkout with one payment method → see confirmation, all running on the production-like environment with logs flowing. No search, no filtering, no order history.
>
> The walking skeleton should take 1-2 weeks to build.
>
> ### 2. Slice Vertically, Not Horizontally
>
> Every task must be a **vertical slice** through the full web stack — UI route/component + API handler + business logic + persistence (and any cache/queue/auth touched). Never create horizontal tasks like "build all the models," "build all the API endpoints," or "set up the design system."
>
> Apply the **Elephant Carpaccio** mindset: always ask "can this be sliced thinner?" Each slice must:
> - Touch real UI (or API surface if no UI)
> - Work end-to-end
> - Be visibly different from the previous slice
> - Deliver testable value
>
> ### 3. Apply INVEST to Every Task
>
> - **Independent** — can be developed without waiting for other tasks (minimize coupling)
> - **Negotiable** — describes the GOAL (what to achieve), not HOW to implement. The developer decides the approach
> - **Valuable** — delivers observable value to the user or the system
> - **Estimable** — clear enough to size (if not, create a spike)
> - **Small** — 1-3 acceptance criteria is ideal, 4-6 is the max. Smaller = better agent quality
> - **Testable** — has clear pass/fail acceptance criteria
>
> ### 4. Size Each Task — SPLIT AGGRESSIVELY
>
> **Smaller tasks = better agent quality.** Each task runs through tester → developer → reviewer, each with isolated context. The smaller the task, the less context each agent needs, the better the results.
>
> **Prefer many S tasks over fewer M tasks. Prefer M over L. Avoid L whenever possible.**
>
> Use T-shirt sizing based on complexity, NOT time:
> - **S** — 1-3 acceptance criteria, touches 1-2 files, one clear concern (e.g., "add email validation to signup form", "add loading spinner to dashboard route")
> - **M** — 4-6 acceptance criteria, touches 3-5 files, one feature slice (e.g., "user login with error handling — route + handler + session", "product card with image, price, and add-to-cart")
> - **L** — 7+ acceptance criteria, touches 5+ files. **This is a warning sign — split further.**
>
> **Splitting rules:**
> - **L MUST be split** into S or M tasks. No exceptions.
> - **M SHOULD be split** if it has more than 5 acceptance criteria or touches more than one screen/endpoint.
> - If you can't decide whether to split — **split.** Two small tasks are always better than one medium task.
>
> **How to split:**
> - **By acceptance criteria:** Group related criteria into separate tasks. "Login form" and "login error handling" are two tasks, not one.
> - **By screen section:** "Header with nav" and "Hero section" and "Footer" are three tasks, not "Build the landing page."
> - **By data operation:** "Create user" and "Update user profile" and "Delete account" are three tasks, not "User CRUD."
> - **By error path:** Happy path in one task, error handling in another. "Submit order" and "Handle payment failures" are separate.
> - **By integration boundary:** "Save to database" and "Enqueue confirmation-email job" are separate even if part of one user flow.
> - **By auth state:** "Anonymous browse" and "Authenticated browse with personalization" are separate slices.
>
> **The test:** Can the tester write ALL tests for this task without reading more than 2-3 files of existing code? If not, the task is too big.
>
> Create **spike** tasks for unknowns — time-boxed research (always S) that produces a decision or proof of concept, not code.
>
> ### 5. Write Acceptance Criteria
>
> Every task gets acceptance criteria in **Given/When/Then** format or a **checklist**:
>
> Given/When/Then:
> ```
> Given a user is on the login page
> When they enter valid credentials and click Submit
> Then they are redirected to the dashboard and see their name
> ```
>
> Checklist:
> ```
> - [ ] Login form has email and password fields
> - [ ] Submit button is disabled until both fields are filled
> - [ ] Invalid credentials show an error message
> - [ ] Successful login redirects to /dashboard
> ```
>
> ### 6. Map Dependencies
>
> For each task, list:
> - **Depends on:** which task(s) must be done first (if any)
> - **Blocks:** which task(s) are waiting for this one
> - **Parallel with:** which tasks can run simultaneously
>
> Minimize dependencies. Prefer defining interface contracts early so tasks can work against contracts in parallel.
>
> Extract shared prerequisites (database migrations, project scaffolding, CI setup, shared types/interfaces) as explicit early tasks.
>
> ### 7. Identify the Critical Path
>
> The longest chain of dependent tasks. Highlight it — this is what determines the total project timeline. All non-critical tasks have slack and can be scheduled flexibly.
>
> ### 8. Define the Execution Flow for Each Task
>
> For each implementation task, the execution order is:
> 1. **Developer** implements the feature with full freedom
> 2. **Tester** (QA) verifies the goal is achieved with tests
> 3. **Reviewer** reviews code and test quality
>
> Note this in the task structure so the team knows the workflow.
>
> ## Output Format
>
> Save tasks as **individual files** in `.claude/tasks/` — one file per task. This keeps each file small and readable.
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
> - Walking skeleton: Milestone 0 ({N tasks}, ~{N days})
>
> ## Dependency Graph
> <!-- Create an Excalidraw diagram showing milestones as groups,
>      tasks as nodes, and dependency arrows between them.
>      Highlight the critical path in red/orange. -->
>
> ## Task Statuses
>
> Every task has a status that tracks its position in the cycle:
>
> | Status | Meaning | Next Step |
> |--------|---------|-----------|
> | `TODO` | Not started | Developer picks it up |
> | `IN_PROGRESS` | Developer is implementing + testing | Wait for developer |
> | `IN_REVIEW` | Developer done, reviewer checking | Wait for reviewer |
> | `CHANGES_REQUESTED` | Reviewer found issues | Developer fixes |
> | `DONE` | Reviewer approved, all criteria met | Move to next task |
> | `BLOCKED` | Waiting on another task or external dependency | Resolve blocker first |
>
> ## Definition of Done (applies to ALL tasks)
> - [ ] Developer implemented the feature and wrote tests
> - [ ] All tests pass (new + regression, no unrelated breakage)
> - [ ] Reviewer verified goal is achieved, tests are meaningful, code quality is acceptable
> - [ ] No linter/typecheck warnings
> - [ ] Status updated to `DONE`
>
> ---
>
> ## Milestone 0: Walking Skeleton
> > Goal: thinnest end-to-end slice proving the architecture works.
> > Tasks: TASK-001, TASK-002, TASK-003, ...
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
> TASK-001 → TASK-002 → TASK-005 → TASK-008 → TASK-012 → ...
> Estimated duration: {N days}
>
> ## Parallelization Opportunities
> - After TASK-001: TASK-002 and TASK-003 can run in parallel
> - After TASK-005: TASK-006, TASK-007, TASK-008 can all run in parallel
> - ...
>
> ## Nice-to-Haves (~)
> <!-- Tasks marked with ~ can be cut if time runs short (Shape Up approach) -->
> - ~TASK-0XX: {feature that's nice but not essential}
> - ~TASK-0XX: ...
>
> ## Verification Criteria Coverage
> <!-- Every TC from system-design.md §13 must be advanced by at least one task.
>      List each TC and the task(s) that verify it. Flag any TC with NO task
>      covering it — that's a gap to close before sprint starts. -->
>
> | TC | Task(s) | Status |
> | --- | --- | --- |
> | TC-1 | TASK-005, TASK-008 | covered |
> | TC-2 | TASK-006 | covered |
> | TC-3 | — | **GAP — needs a task** |
> ````
>
> ### File: `.claude/tasks/TASK-001.md` (one file per task)
>
> ````markdown
> # TASK-001: {Project scaffolding}
> **Milestone:** 0 — Walking Skeleton
> **Status:** `TODO`
> **Size:** S | **Type:** setup
> **Depends on:** nothing
> **Verifies:** {TC-IDs from system-design §13, comma-separated, or `infrastructure` if pure scaffolding with no direct TC linkage}
> **Goal:** {what needs to be achieved — the clear, concrete end result. NOT how to implement it}
> **Acceptance Criteria:**
> - [ ] {criterion}
> - [ ] {criterion}
> **Suggested Approach (optional):** {brief hints or considerations — the developer decides the actual implementation}
> **Cycle:** developer only (no tests needed for scaffolding) → reviewer
> ````
>
> ### File: `.claude/tasks/TASK-002.md`
>
> ````markdown
> # TASK-002: {Data model foundation}
> **Milestone:** 0 — Walking Skeleton
> **Status:** `TODO`
> **Size:** M | **Type:** vertical-slice
> **Depends on:** TASK-001
> **Verifies:** {TC-IDs from system-design §13, e.g. `TC-1, TC-3` — every non-setup task MUST advance at least one TC}
> **Screen:** {screen name from design-spec.md, or "none" for backend-only tasks}
> **Goal:** {what needs to be achieved — the clear, concrete end result. NOT how to implement it}
> **Acceptance Criteria:**
> - [ ] {functional criterion}
> **Visual Criteria:** {from design-spec.md screen section, or "N/A"}
> - [ ] {visual criterion, e.g. "Card has shadow-sm, radius-lg, hover:shadow-md"}
> **Suggested Approach (optional):** {brief hints or considerations — the developer decides the actual implementation}
> **Cycle:** developer (implements + tests) → reviewer → designer (visual check, if UI task) → `DONE`
> ````
>
> ### File: `.claude/tasks/SPIKE-001.md`
>
> ````markdown
> # SPIKE-001: {Unknown to investigate}
> **Milestone:** Spikes
> **Status:** `TODO`
> **Size:** S | **Timebox:** {N hours}
> **Question:** {what we need to find out}
> **Deliverable:** {decision / proof of concept / updated estimates}
> **Cycle:** researcher → CEO decision
> ````
>
> **Rules:**
> - **Tasks describe the GOAL, not the HOW.** The Goal field must be a clear, concrete end result — what the user/system can do after this task is done. Implementation details (file names, function signatures, specific patterns) are the developer's decision. You may add a "Suggested Approach" with hints, but it's explicitly optional — the developer is free to ignore it.
> - **Every non-setup task MUST declare `**Verifies:**`** — at least one TC-ID from `.claude/system-design.md` §13 (Verification Criteria). This is the spec→implementation lineage. If you can't link a task to a TC, either the task is unnecessary or the system design is missing a TC — go fix one of those.
> - **Coverage check:** every TC in §13 of the system design MUST be advanced by at least one task by the end of the last milestone. List uncovered TCs in `_overview.md` so they can't slip.
> - One file per task in `.claude/tasks/`. File name = task ID: `TASK-001.md`, `SPIKE-001.md`.
> - Overview goes in `_overview.md` — milestones, critical path, parallelization, Definition of Done.
> - Walking skeleton is ALWAYS Milestone 0. No exceptions.
> - Every task is a vertical slice unless it's scaffolding or infrastructure.
> - No L-sized tasks — always split into S or M. Prefer S.
> - Every task has acceptance criteria. No exceptions.
> - Dependencies are explicit. No hidden coupling.
> - The critical path is highlighted. The team must know what blocks everything.
> - Nice-to-haves are marked with ~ and can be cut.
> - Execution flow is explicit: developer (implements + tests) → reviewer.

## Step 3: Review the task breakdown

When the architect returns, read the task breakdown yourself. Check:

- **Tasks small enough?** This is the MOST IMPORTANT check. Count acceptance criteria per task:
  - S (1-3 criteria): ideal
  - M (4-6 criteria): acceptable
  - L (7+ criteria): **send back to split**
  - If most tasks are M or L, the decomposition is too coarse — send architect back with: "Split further. Prefer S tasks. Each agent works better with smaller scope."
- **Walking skeleton makes sense?** Is it truly end-to-end? Is it thin enough?
- **Vertical slices?** No horizontal "build all X" tasks?
- **Dependencies minimize bottlenecks?** Enough parallelism?
- **Goals, not instructions?** Does each task describe WHAT to achieve, not HOW to implement? If you see file paths, function names, or step-by-step implementation in the Goal field — send back: "Describe the goal, not the implementation. The developer decides how."
- **Acceptance criteria clear?** Could the developer write meaningful tests from these?
- **Execution flow specified?** Developer (implements + tests) → reviewer for each task?
- **Spec lineage closed?** Every non-setup task has a `**Verifies:**` field listing TC-IDs. The Verification Criteria Coverage table in `_overview.md` shows zero gaps — every TC from system-design §13 is advanced by ≥1 task. If there's a gap → send architect back to add a task or re-justify the TC.
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
- "We start with the walking skeleton — {describe what it does} — takes about {N days}"
- "Then {milestone 1}, then {milestone 2}..."
- "Critical path is {N days/weeks} — that's the minimum timeline if everything goes perfectly"
- Show the dependency graph diagram

Ask: "Ready to start building?"
