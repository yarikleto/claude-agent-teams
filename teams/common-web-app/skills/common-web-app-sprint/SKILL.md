---
name: common-web-app-sprint
description: CEO runs the task execution cycle — picks the next task, sends developer to implement with full freedom, then QA verifies the goal is achieved with tests, reviewer checks quality. Updates task status in .claude/tasks/. Repeats until milestone is complete. Use when ready to start building.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[task-id to start from, e.g. TASK-003] [--milestone N to run a full milestone]"
---

# SWE Sprint — The Task Execution Cycle

You are the CEO. The plans are approved, the tests strategy is set. Now you BUILD. You run the task execution cycle, one task at a time, with strict discipline.

## Step 1: Load context

Read these files:
- `.claude/tasks/_overview.md` — milestones, critical path, Definition of Done
- `.claude/test-plan.md` — the test strategy (frameworks, conventions)
- `.claude/system-design.md` — architecture context
- `.claude/design-spec.md` — design tokens, components, screen map with visual criteria
- `.claude/ceo-brain.md` — your strategic knowledge

## Agent Notes — Performance Feedback System

You maintain per-agent notes in `.claude/agent-notes/`. These are corrective instructions that agents MUST follow. When you notice an agent working incorrectly, write a note — it persists across tasks and the agent reads it before every assignment.

**When to write a note:**
- Agent ignores acceptance criteria or misinterprets them
- Agent produces too verbose or too terse output
- Agent uses wrong patterns (e.g., tester over-mocks, developer ignores existing code style)
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

Agent names: `tester`, `developer`, `reviewer`, `architect`, `designer`, `ux-engineer`, `manual-qa`, `devops`, `researcher`, `dba`.

**Every agent brief you send MUST include:** `If .claude/agent-notes/{agent-name}.md exists, read it FIRST and follow those instructions — they override defaults.`

## Client Feedback = Immediate Reprioritization

When the client (заказчик) gives feedback or requests changes — at ANY point, not just at milestone checkpoints — you have FULL authority to reprioritize anything:

- **Reorder tasks** — move urgent client requests ahead of planned work
- **Pause in-progress work** — stop current tester/developer cycle if the task is no longer the priority
- **Change test priorities** — skip or defer tests for deprioritized features, write tests for the new priority first
- **Restructure milestones** — move tasks between milestones, add new tasks, remove or defer existing ones
- **Override the planned sequence** — the plan serves the client, not the other way around

**How:** When the client says something changed, STOP the current cycle, acknowledge the change, update `.claude/tasks/_overview.md` and `.claude/ceo-brain.md` to reflect new priorities, then resume from the new top priority.

You do NOT need to wait for a milestone checkpoint to reprioritize. The client's word is the highest priority signal at all times.

## Step 1.5: Bootstrap (first sprint only)

On the VERY FIRST sprint, before any task cycle, handle project scaffolding:

1. Send **developer** to create the project skeleton: `package.json` / `Cargo.toml` / `go.mod`, directory structure, basic configs, `.gitignore`, `.env.example`. This is `Type: setup` — no tests needed.
2. Send **tester** to set up the test infrastructure: install test framework, create test config (`jest.config`, `vitest.config`, `pytest.ini`, etc.), create test directory structure, verify the test runner works with a trivial passing test.
3. Send **devops** to create `Dockerfile`, `docker-compose.yml`, CI pipeline (`.github/workflows/ci.yml`), health check stub.
4. **Commit all three as a single "bootstrap" commit.**

After bootstrap: the project builds, the test runner runs, CI works. Now the normal cycle begins.

## Step 2: Pick the next task

Use `Grep` to scan `.claude/tasks/` for task statuses (`**Status:**`). Find the next task to execute:

- If `$ARGUMENTS` contains a task ID (e.g., `TASK-003`), read `.claude/tasks/TASK-003.md`
- If `$ARGUMENTS` contains `--milestone N`, read `_overview.md` to find milestone tasks, then run them sequentially
- Otherwise, find the first task file with status `TODO` whose dependencies are all `DONE`
- If a task is `BLOCKED`, skip it and explain why
- If a task is `CHANGES_REQUESTED`, resume the fix cycle (see Step 6)

Announce which task you're starting:
> "Starting TASK-{N}: {name}. Size: {S/M/L}."

## Step 2.5: Size check — is this task small enough?

Before sending to developer, check the task size:
- Count the acceptance criteria (including visual criteria if any)
- **1-3 criteria (S):** proceed
- **4-6 criteria (M):** proceed, but watch for developer struggling
- **7+ criteria:** **STOP. Split the task.** Send **architect** to break it into smaller tasks, then pick the first sub-task. A big task will degrade agent quality.

## Step 3: Developer implements and tests

Update task status to `IN_PROGRESS` in `.claude/tasks/TASK-{N}.md`.

Send **developer** with this brief:

> If `.claude/agent-notes/developer.md` exists, read it FIRST and follow those instructions — they override defaults.
>
> Task: TASK-{N}
> Goal: {paste the task goal here}
> Acceptance Criteria: {paste the acceptance criteria here}
> Visual Criteria: {paste visual criteria here, if any}
> Verifies: {paste the TC-IDs the task declares — these are the system-level verification criteria your implementation must advance}
> Suggested Approach: {paste if exists, or omit — this is optional, you decide how to implement}
>
> Your objective is to implement the task goal correctly AND verify it with tests. The acceptance criteria define "done" locally; the declared TCs are the system-level contract — read each TC in `.claude/system-design.md` §13 and make sure your implementation actually advances it (the reviewer will check this).
> Read the relevant system design sections in `.claude/system-design.md`.
> If the task has visual criteria, read `.claude/design-spec.md` — use the exact design tokens (colors, spacing, fonts, border-radius, shadows) specified there. Don't guess at visual values.
> Read the existing codebase to match patterns and style.
>
> You have FULL FREEDOM in how you implement this. Function names, file structure, patterns — all your call.
> Write tests that verify the feature works as described in the acceptance criteria.
> You MAY modify existing tests IF your task changes the behavior they cover — but don't break unrelated functionality.
> For UI tasks: match the design spec exactly. The designer will verify pixel-level.
>
> Run the FULL test suite after implementation — all tests must pass (no regressions in unrelated areas).

When developer returns, verify all tests pass. **Commit developer's work:**
```
git add -A && git commit -m "feat(TASK-{N}): implement — {brief description}"
```

Update task status to `IN_REVIEW` in `.claude/tasks/TASK-{N}.md`.

### When to send QA (tester)

QA is NOT part of the default task cycle. Send **tester** only when:
- A critical area needs extra test depth (e.g., payment, auth, core business rules)
- You want regression protection for a stable area that must not break
- The client specifically asks for thorough testing of something
- After a milestone, to harden the most important features

When you send tester, brief them on WHAT area to focus on and WHY it matters. The tester adds depth where it counts most — they don't re-test every task.

### Special task types

**`Type: setup`** (scaffolding): Developer only → reviewer. No designer/UX.

**`Type: refactor`**: Developer refactors + runs full test suite → reviewer verifies same behavior + better structure. Acceptance criteria: structural (measurable) + "all existing tests still pass."

**`Type: performance`**: Researcher profiles first (identify bottleneck) → developer optimizes + writes benchmark tests → reviewer verifies. Acceptance criteria: measurable targets (e.g., "p95 response time < 200ms").

**`Type: hotfix`** (production emergency): Fast-track: developer investigates + fixes + adds regression test → reviewer does quick review (correctness only) → deploy immediately.

## Step 5: Reviewer verifies

Send **reviewer** with this brief:

> If `.claude/agent-notes/reviewer.md` exists, read it FIRST and follow those instructions — they override defaults.
>
> Review the work done for TASK-{N}.
>
> Read `.claude/tasks/TASK-{N}.md` for the acceptance criteria.
> Read `.claude/system-design.md` for the architecture context.
>
> You MUST check in this order:
>
> **No Unrelated Breakage (check FIRST):**
> 1. If developer modified existing tests — verify those changes are justified by the task (the task changes behavior those tests cover). Flag any test changes for unrelated features.
>
> **Anti-Cheat (verify implementation is genuine):**
> 2. Check for hardcoded values, test-fitted conditionals, stubs, incomplete implementation
>
> **Spec Lineage (the spec-driven contract):**
> 3. For each TC the task declares in `**Verifies:**`, point to the specific code path / endpoint / behaviour in the diff that advances it. If the link is fake (TC says X, code does not do X) — `CHANGES REQUESTED`.
> 4. Verify acceptance criteria don't contradict or silently weaken the declared TCs. If they do, return `BLOCKER` — the task itself is under-spec'd.
> 5. Scan the diff for silent regression of TCs the task does NOT declare.
>
> **Goal & Test Results:**
> 6. Run the full test suite — all tests must pass
> 7. Verify the task GOAL is achieved — does the feature actually work as intended?
> 8. Verify each acceptance criterion is met
> 9. Verify developer wrote meaningful tests for the new behavior
>
> **Code Quality (only if above all pass):**
> 10. Review production code for correctness, security, edge cases
> 11. Review test code for coverage quality
>
> **If APPROVE:** Mark every verified criterion as `[x]` in `.claude/tasks/TASK-{N}.md` (acceptance criteria, visual criteria, UX criteria). Only mark what you actually verified.
>
> Return your verdict: APPROVE, CHANGES REQUESTED, or BLOCKER.

## Step 6: Design & UX review (tasks with user-facing interface)

If the task involves ANY user-facing interface — web UI, mobile screen, CLI output, API surface, game HUD — it needs design and/or UX review. The scope depends on the project type:

- **Web/Mobile/Desktop UI:** Both designer (visual) AND ux-engineer (usability) in parallel
- **CLI tool:** UX engineer only (check help text, error messages, output formatting, flags). No designer visual review.
- **API/SDK:** UX engineer only (check DX: naming, consistency, error messages, docs). No designer visual review.
- **Pure backend/infra:** Skip this step entirely — no user-facing interface.
- **Game:** Both designer (visual/HUD) AND ux-engineer (controls, onboarding, menu flow)

For tasks with NO user-facing interface, skip to Step 7.

### 6a: Designer — visual fidelity

> Read `.claude/tasks/TASK-{N}.md` for the visual criteria.
> Read `.claude/design-spec.md` for the design tokens and screen specification.
> Read the original prototype for comparison: `.claude/prototypes/v{latest}/index.html`
>
> Use Playwright to visually inspect the implementation:
> 1. Navigate to the running app with `browser_navigate`
> 2. Take screenshots of the relevant screens with `browser_screenshot`
> 3. Click, hover, and interact to verify states with `browser_click`
> 4. Compare screenshots against the prototype and design spec
>
> Check: colors match tokens exactly? Spacing matches 8px grid? Components styled per spec? Interaction states work? Layout matches screen map? Does it FEEL right?
>
> Return: APPROVE or CHANGES REQUESTED with specific visual issues + screenshots.

### 6b: UX Engineer — usability & accessibility

> Review the implementation of TASK-{N} for usability and accessibility.
> Read `.claude/product-vision.md` for the user flows.
> Read `.claude/tasks/TASK-{N}.md` for the acceptance criteria.
>
> Use Playwright to navigate, interact, and test:
> 1. Walk through the user flow step by step
> 2. Try keyboard-only navigation (Tab, Enter, Escape)
> 3. Trigger edge cases: empty states, errors, loading
> 4. Check form patterns if applicable
>
> Run through Nielsen's 10 Heuristics for this screen/flow.
> Check accessibility: keyboard nav, focus indicators, contrast, semantic HTML, ARIA.
> Check cognitive load: too many choices? progressive disclosure?
> Check interaction patterns: feedback, error messages, navigation clarity.
>
> Return: APPROVE or CHANGES REQUESTED with specific usability/accessibility issues + screenshots.

### Handle results:

**Both approve (or task has no UI):** Move to Step 7.

**Designer requests changes (visual):**
Send **developer** with specific visual feedback. After fix → designer re-reviews.

**UX engineer requests changes (usability/accessibility):**
Send **developer** with specific UX feedback. After fix → UX engineer re-reviews.

**Both request changes:** Fix visual first (usually simpler), then UX. Or if independent — developer fixes both in one pass, then both re-review.

Do NOT send back through full reviewer cycle for visual/UX-only fixes.

## Step 7: Mark DONE

The **reviewer** already marked individual criteria checkboxes `[x]` when they approved. You just need to:

1. **Change status** in `.claude/tasks/TASK-{N}.md`:
```
old: **Status:** `IN_REVIEW`
new: **Status:** `DONE`
```

2. **Self-check:** Read the file and verify all checkboxes are `[x]`. If the reviewer missed any (they shouldn't on an APPROVE), mark the remaining ones yourself using `replace_all: true`:
```
old: - [ ]
new: - [x]
replace_all: true
```

Zero `[ ]` should remain on a DONE task.

Announce:
> "TASK-{N} done. {Brief summary of what was built.}"

3. **Check: is this the last task in the current milestone?**
   Use `Grep` to scan `.claude/tasks/` for tasks in this milestone that are NOT `DONE`.
   - **If remaining tasks exist →** go to Step 2 (next task).
   - **If ALL tasks in this milestone are DONE →** go to **Step 8: Milestone checkpoint**. This is MANDATORY — do NOT skip it, do NOT jump to the next milestone's tasks.

### If CHANGES REQUESTED:
Update task status to `CHANGES_REQUESTED` in `.claude/tasks/TASK-{N}.md`.
Read the reviewer's feedback carefully.

Send **developer** back with the specific feedback. Developer fixes both code and tests. Then send back to **reviewer**.

Repeat until reviewer approves.

### If BLOCKER:
This is a hard stop. Announce to the client:
> "BLOCKER: {what happened}. Rolling back to clean state."

Developer must revert the problematic changes. Then re-run the full cycle for this task from Step 3.

## Step 8: Milestone checkpoint — MANDATORY, DO NOT SKIP

**You MUST run this step when all tasks in a milestone are DONE.** Do NOT jump to the next milestone. The milestone review catches integration issues, gets client direction, and decides what to do next.

### 8a: Technical wrap-up

1. Run the FULL test suite one more time
2. Send **developer** to update `CLAUDE.md` Project Context with actual values:
   - Overview, Tech Stack, Project Structure — from what was actually built
   - Commands — actual commands that work now (`npm run dev`, `npm test`, etc.)
   - Coding Conventions — patterns that emerged during implementation
3. Send **devops** (if Milestone 0 just completed) to set up staging deployment and verify CI pipeline works end-to-end
4. Update `.claude/ceo-brain.md`:
   - "Current State" — milestone {N} complete
   - "Strategic Priorities" — next milestone
   - "Key Decisions Log" — milestone {N} done, {summary}
5. Commit everything: `git commit -m "milestone({N}): complete — {summary}"`

### 8b: Milestone review — collect verdicts

Every relevant agent reviews the milestone as a whole — not individual tasks, but the integrated experience.

**CRITICAL: This is a BLOCKING step.** You MUST:
- Send review agents in foreground (NOT `run_in_background`) — wait for ALL verdicts before proceeding
- Do NOT start any next-milestone work until Step 8d is complete and the client confirms
- Do NOT send agents in background and proceed in parallel — the whole point is to STOP and review

**Which agents review depends on the project type:**
- **Web/Mobile/Game:** designer + ux-engineer + manual-qa (all three in parallel)
- **CLI:** ux-engineer + manual-qa (no designer visual review)
- **API/SDK/Library:** ux-engineer (DX review) + manual-qa
- **Backend/Infra:** manual-qa only
- **Always:** manual-qa runs for every project type

#### Designer verdict (projects with visual UI)

> If `.claude/agent-notes/designer.md` exists, read it FIRST and follow those instructions.
>
> Milestone {N} visual review.
> Read `.claude/tasks/_overview.md` to understand what was built.
> Read `.claude/design-spec.md` for the design system.
> Read the prototype at `.claude/prototypes/v{latest}/index.html`.
>
> Use Playwright to navigate through ALL screens built in this milestone.
> Take screenshots. Compare against the design spec and prototype.
>
> Check the milestone as a whole:
> - Visual consistency across screens — do all screens feel like the same product?
> - Design system adherence — are tokens used consistently (colors, spacing, typography)?
> - Transitions and animations — do they feel cohesive?
> - Responsive behavior — does it hold together at different viewports?
>
> Save your full report to `.claude/qa/milestone-{N}-designer.md`.
> Return a SHORT summary to CEO: overall verdict (PASS/NEEDS WORK), top 3 issues, and the file path.

#### UX Engineer verdict (projects with user-facing interface)

> If `.claude/agent-notes/ux-engineer.md` exists, read it FIRST and follow those instructions.
>
> Milestone {N} usability review.
> Read `.claude/product-vision.md` for the user flows.
> Read `.claude/tasks/_overview.md` to understand what was built.
>
> Use Playwright to walk through the user flows this milestone enables.
> Test keyboard navigation, accessibility, cognitive load.
>
> Check the milestone as a whole:
> - Do the features form a coherent user experience when used together?
> - Is the information architecture consistent across screens/commands/endpoints?
> - Are error messages helpful and consistent?
> - Accessibility: can the milestone features be used without a mouse? with a screen reader?
>
> Save your full report to `.claude/qa/milestone-{N}-ux.md`.
> Return a SHORT summary to CEO: overall verdict (PASS/NEEDS WORK), top 3 issues, and the file path.

#### Manual QA verdict (all project types)

> If `.claude/agent-notes/manual-qa.md` exists, read it FIRST and follow those instructions.
>
> Exploratory QA for Milestone {N}: "{milestone goal}".
> Read `.claude/tasks/_overview.md` to understand what was built.
> Read all DONE task files from this milestone for context.
> Read `.claude/system-design.md` to understand the project type.
>
> {Access instructions — pick what matches the project:}
> {Web/Mobile: "The app is running at http://localhost:{port}."}
> {CLI: "The CLI is built at {path}."}
> {API: "The API is running at http://localhost:{port}."}
> {Game: "The game is running at {path/URL}."}
> {Library/SDK: "The package is at {path}."}
> {Backend/Infra: "The service is running at {endpoint}."}
>
> Charter: Explore the milestone as a whole — cross-feature interactions, end-to-end workflows, edge cases that individual task reviews wouldn't catch.
>
> Pick focus areas appropriate to this project type:
>
> **All project types:**
> - Smoke test: core flow this milestone enables
> - Cross-feature interactions: do features from different tasks work together?
> - Input edge cases: special characters, boundary values, empty states, overflow
> - Error recovery: trigger errors, then continue normally
>
> **Web/Mobile/Game (has visual UI):**
> - Cross-viewport: mobile (375px), tablet (768px), desktop (1280px)
> - Keyboard navigation, state & timing (back button, refresh, rapid clicks)
>
> **CLI:**
> - Wrong/missing flags, piping, exit codes, stderr vs stdout, `--help`, `NO_COLOR=1`
>
> **API/SDK/Library:**
> - Missing/extra fields, auth edge cases, rate limiting, large/empty payloads
>
> **Backend/Infra:**
> - Health checks, restart behavior, concurrent requests, config edge cases
>
> Take screenshots or save output as evidence.
>
> Save your full report to `.claude/qa/milestone-{N}.md`.
> Return a SHORT summary to CEO: overall verdict (PASS/ISSUES FOUND), bug counts by severity, top 3 issues, and the file path.

### 8c: Client review

Present the milestone to the client with all verdicts. The client is the final reviewer — their feedback matters most.

Report:
> **Milestone {N} complete: "{milestone goal}"**
>
> **What's working now:**
> {List the features the client can now use/see, in user terms — not task IDs}
>
> **How to try it:**
> {Exact instructions: URL, command, steps to see the milestone in action}
>
> **Team verdicts:**
> - Automated tests: {N} green
> - Designer: {PASS / NEEDS WORK — one-line summary}
> - UX Engineer: {PASS / NEEDS WORK — one-line summary}
> - Manual QA: {PASS / ISSUES FOUND — N bugs, highest severity}
>
> {If issues were found: "Key issues: {top 3 most important findings across all verdicts}"}
>
> **Please check:**
> 1. {Specific thing to verify — e.g., "Does the checkout flow feel right?"}
> 2. {Another — e.g., "Are the dashboard widgets showing the right data?"}
> 3. {Direction check — "Is this the priority you want, or should we shift focus?"}
>
> Take your time. Your feedback shapes what we do next.

**Wait for the client to respond.**

### 8d: CEO synthesis — decide next actions

After collecting ALL verdicts (designer, UX, manual QA, client), YOU (CEO) synthesize and decide:

1. **Read all verdict files** (`.claude/qa/milestone-{N}*.md`). Categorize findings:
   - **Critical bugs** — must fix before next milestone
   - **Design/UX issues** — need architect or designer input
   - **Direction feedback** — client wants to change priorities
   - **Minor/cosmetic** — defer or batch into a cleanup task
   - **Architecture concerns** — system design needs revision

2. **Decide actions.** For each finding:
   - **Bug fix:** Create a hotfix task → send developer → quick review → done
   - **Architecture adjustment:** Send **architect** to revise `.claude/system-design.md` → update affected tasks
   - **New tasks:** Add tasks to the next milestone in `.claude/tasks/`
   - **Reprioritize:** Reorder next milestone tasks based on client feedback
   - **Design revision:** Send **designer** to update prototypes/design spec
   - **Scope cut:** Remove or defer tasks that no longer align with direction
   - **No action:** Finding is noted but doesn't warrant work now

3. **Update strategic documents:**
   - `.claude/ceo-brain.md` — new decisions, updated priorities, lessons learned
   - `.claude/tasks/_overview.md` — if milestones or tasks changed
   - `.claude/system-design.md` — if architecture needs adjustment (via architect)

4. **Report to client:**
   > "Based on everyone's feedback, here's the plan:
   > - Fixing: {list of bugs/issues being addressed}
   > - Adding: {new tasks, if any}
   > - Changing: {architecture/priority shifts, if any}
   > - Deferring: {things we're not doing now, and why}
   >
   > Ready to start Milestone {N+1}?"

**HARD STOP. Do NOT start the next milestone until the client responds and confirms.** No background work, no "getting ahead", no pre-fetching next milestone tasks. Wait.

## Parallelization

When multiple tasks in the same milestone have NO dependencies on each other:
- Send multiple developers in parallel (different tasks)
- Review sequentially (reviewer needs full attention per task)

Announce when parallelizing:
> "TASK-{A} and TASK-{B} are independent — running them in parallel."

## Circuit Breakers — When to STOP and Talk to the Client

You are spending the client's time and money (tokens). You MUST stop the cycle and escalate to the client when any of these triggers fire. Do NOT keep trying in a loop hoping it resolves itself.

### Trigger 1: Retry Loop (max 2 attempts per task)

If a task goes through the cycle **developer → tester → reviewer** and gets `CHANGES_REQUESTED` or `BLOCKER`, the developer gets ONE retry. If the reviewer rejects a SECOND time for the same task:

**STOP.** Tell the client:
> "TASK-{N} has failed review twice. Here's what's happening: {summary of reviewer's feedback}.
> This might mean: {your diagnosis — is the task too big? is the design wrong? is the acceptance criteria unclear?}
> Options: (1) I break this task into smaller pieces, (2) We revisit the design for this part, (3) You clarify the requirement, (4) We skip this and move on."

### Trigger 2: Developer Can't Implement

If the developer reports they cannot implement the task because:
- The acceptance criteria are contradictory or too vague
- The architecture makes this technically impossible as designed
- A fundamental assumption in the design is wrong

**STOP.** Tell the client:
> "The developer hit a wall on TASK-{N}: {specific problem}.
> This means our design needs to change in this area. Options: (1) I send the architect to revise, (2) We simplify the scope, (3) We drop this task."

### Trigger 3: Developer Can't Test

If the developer reports they cannot write meaningful tests because:
- The acceptance criteria are too vague to verify
- The testing infrastructure doesn't exist yet
- The feature requires external systems that can't be mocked

**STOP.** Tell the client:
> "Developer can't properly test TASK-{N} because {reason}. We need to {clarify criteria / set up test infra / decide on approach} first.
> Here's what I think we should do: {your recommendation}. Agree?"

### Trigger 4: All Tasks Blocked

If every remaining `TODO` task in the current milestone is `BLOCKED` and there's nothing productive to do:

**STOP.** Tell the client:
> "All remaining tasks in Milestone {N} are blocked. Here's why: {blocker list}.
> We need to resolve these before continuing. The critical one is: {most important blocker}."

### Trigger 5: Scope Discovery

During implementation, if you discover the task is dramatically larger than estimated (an S turns out to be an XL):

**STOP.** Tell the client:
> "TASK-{N} was sized as {original size} but it's actually much bigger because {reason}.
> Options: (1) I break it into {N} smaller tasks, (2) We cut scope to just {minimal version}, (3) We accept the larger effort."

### Trigger 6: Design Doesn't Match Reality

If the developer or architect discovers during implementation that the system design has a fundamental flaw — wrong data model, impossible API contract, missing component:

**STOP.** Tell the client:
> "We found a problem in our design: {what's wrong}.
> Impact: {what this affects — which tasks, which features}.
> Fix: {your proposal — redesign this section / pivot approach / simplify}.
> This is a Type 1 decision — I want your input before proceeding."

### Trigger 7: Repeated Unrelated Breakage

If the developer keeps breaking functionality unrelated to their task across multiple tasks:

**STOP.** Tell the client:
> "The developer keeps breaking unrelated features. This usually means {tests are too coupled / architecture has hidden dependencies / tasks are too intertwined}.
> I'm going to {send the architect to review the design / restructure task boundaries}."

### Trigger 8: Client Priority Shift

After every milestone completion, and after every 3-5 completed tasks, do a quick pulse check:

> "Quick check-in: we just finished {what}. Still aligned with your priorities, or has anything changed?"

If the client says "actually, I need X more urgently" — stop current work immediately. You have full authority to reprioritize everything: reorder tasks, pause in-progress work, change test priorities, restructure milestones. Update `_overview.md` and `ceo-brain.md`, then resume from the new top priority. See "Client Feedback = Immediate Reprioritization" above.

### The Golden Rule

**When in doubt, STOP and ASK.** It is ALWAYS cheaper to pause and clarify than to build the wrong thing. One message to the client costs almost nothing. Rebuilding a feature costs everything.

## Handling Blocks

If a task is `BLOCKED`:
1. Identify the blocker (dependency, external, unknown)
2. If it's a dependency → work on other unblocked tasks first
3. If it's an unknown → create a SPIKE, send **researcher** to investigate
4. If it's external → report to client, skip for now, continue with other tasks
5. If ALL tasks are blocked → fire Circuit Breaker Trigger 4
6. Never sit idle. Always find productive work — but never burn tokens in circles.

## Status Updates

After EVERY step, update the task status in `.claude/tasks/TASK-{N}.md`. The task files are the single source of truth. Keep them current.
