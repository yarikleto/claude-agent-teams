---
name: swe-tester-plan
description: Tester creates a test strategy document from the system design — defines what to test at each pyramid level, chooses test frameworks, maps test coverage to user flows, and establishes the Definition of Done. Use after system design and task breakdown are approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--update to revise existing test plan]"
---

# SWE Test Plan — Test Strategy from System Design

You are the CEO. The system design and task breakdown are ready. Before anyone writes code, you need a test strategy — the **tester** defines HOW the project will be tested, WHAT tools to use, and WHERE each type of test lives.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — architecture, data model, APIs
- `.claude/tasks/` — task files (one per task) with acceptance criteria
- `.claude/product-vision.md` — user flows

If `$ARGUMENTS` contains `--update`, read `.claude/test-plan.md` and revise.

## Step 2: Brief the tester

Send **tester** with this brief:

> Read these files:
> - `.claude/system-design.md` — understand the architecture, tech stack, data model, API contracts
> - `.claude/tasks/` — read all task files to understand every task and its acceptance criteria
> - `.claude/product-vision.md` — understand the core user flows
>
> Produce a test strategy document. Save it as `.claude/test-plan.md`.
>
> The document MUST follow this structure:
>
> ````markdown
> # Test Strategy
> > Version {N} — {date}
>
> ## 1. Testing Philosophy
> <!-- State the testing approach for THIS project:
>      - QA verification: tests written after implementation to verify the feature works
>      - Testing pyramid or trophy? Why?
>      - What's the target distribution? (e.g., 70% unit / 20% integration / 10% E2E)
>      - Classicist or mockist approach? Why for this project? -->
>
> ## 2. Test Frameworks & Tools
>
> | Layer | Framework | Runner | Assertion | Why |
> |-------|-----------|--------|-----------|-----|
> | Unit | {e.g., Jest, pytest, Go testing} | {runner} | {assertion lib} | {one-line why} |
> | Integration | {framework} | {runner} | {lib} | {why} |
> | E2E | {e.g., Playwright, Cypress} | {runner} | {lib} | {why} |
> | Contract | {e.g., Pact, if applicable} | | | {why} |
>
> ### Test Doubles Strategy
> <!-- Which test double approach for this project?
>      - Default to real objects (classicist) or mocks (mockist)?
>      - When to use fakes (in-memory DB, fake HTTP)?
>      - When to use stubs/mocks?
>      - External services: how to handle? (MSW, Testcontainers, LocalStack?) -->
>
> ### CI Integration
> <!-- How tests run in CI:
>      - Which tests run on every PR?
>      - Which tests run on merge to main?
>      - Parallelization strategy
>      - Target test runtime for PR checks (e.g., <2 minutes) -->
>
> ## 3. Testing Pyramid for This Project
>
> ### Unit Tests
> <!-- What gets unit tested in this project?
>      List the specific modules/components and what aspects to test.
>      E.g., "Validation logic in domain/validators/ — equivalence partitioning + boundary values"
>      E.g., "Price calculation in services/pricing.ts — all discount rules, rounding, currency" -->
>
> ### Integration Tests
> <!-- What gets integration tested?
>      E.g., "API endpoints: test full request/response cycle with real DB (Testcontainers)"
>      E.g., "Auth flow: test JWT generation, validation, refresh with real token service" -->
>
> ### E2E Tests
> <!-- Which critical user paths get E2E tests? Keep this list SHORT.
>      Map directly to user flows from the product vision.
>      E.g., "Flow 1: User signs up → creates first project → invites teammate" -->
>
> ## 4. Test Coverage Map
>
> Map each task from `.claude/tasks/` to its test coverage:
>
> | Task | Unit Tests | Integration Tests | E2E Tests | Test Design Technique |
> |------|-----------|------------------|-----------|----------------------|
> | TASK-001 | — (scaffolding) | — | — | — |
> | TASK-002 | domain model validation | DB CRUD operations | — | Boundary values |
> | TASK-003 | auth logic | login endpoint | Login flow | Equivalence partitioning, state transitions |
> | ... | ... | ... | ... | ... |
>
> ## 5. Test Design Techniques by Area
>
> <!-- For each major area of the system, specify WHICH test design techniques to apply:
>
> | Area | Techniques | Why |
> |------|-----------|-----|
> | User input validation | Equivalence partitioning, boundary values | Multiple input classes with clear boundaries |
> | Auth & permissions | State transitions, decision tables | Complex state machine with role-based rules |
> | Payment processing | Decision tables, error guessing | Many conditions interact, high risk |
> | Search/filtering | Pairwise testing | Many parameters combine |
> | Data import/export | Boundary values, error guessing | Large files, encoding issues, malformed data | -->
>
> ## 6. Test File Conventions
>
> <!-- Define where tests live, how they're named, how they're structured:
>
> ```
> src/
>   modules/
>     auth/
>       auth.service.ts
>       auth.service.test.ts        ← unit test (co-located)
>       auth.integration.test.ts    ← integration test (co-located)
>
> e2e/
>   login.e2e.test.ts              ← E2E tests in separate directory
> ```
>
> Naming: `{module}.test.ts` for unit, `{module}.integration.test.ts` for integration, `{flow}.e2e.test.ts` for E2E.
> Pattern: Arrange/Act/Assert within every test.
> Describe blocks grouped by function/method. -->
>
> ## 7. Definition of Done (Testing)
>
> Applies to EVERY task:
> - [ ] Tests written FIRST (Red) — before any implementation
> - [ ] All tests pass (Green) — unit + integration
> - [ ] No flaky tests introduced
> - [ ] No skipped/disabled tests without a tracked issue
> - [ ] Acceptance criteria verified through tests
> - [ ] Regression suite passes
> - [ ] No linter/type warnings in test files
>
> ## 8. Adversarial Testing Checklist
>
> For EVERY task, the tester should also consider:
> - [ ] Null/empty inputs
> - [ ] Boundary values (0, 1, MAX-1, MAX, MAX+1)
> - [ ] Invalid types (string where number expected, etc.)
> - [ ] Unauthorized access attempts
> - [ ] Concurrent operations (double submit, race conditions)
> - [ ] Very large inputs (performance, overflow)
> - [ ] Special characters (unicode, SQL injection, XSS payloads)
> - [ ] Network failures (timeout, disconnect)
>
> ## 9. Legacy Code Strategy (if applicable)
> <!-- If joining an existing codebase:
>      - Characterization tests first (capture actual behavior)
>      - Find seams for dependency injection
>      - Sprout/Wrap techniques for new functionality
>      - Never refactor without tests -->
>
> ## 10. Risks
> <!-- Testing-specific risks:
>      - Areas with high complexity / low testability
>      - External dependencies that are hard to simulate
>      - Performance testing needs
>      - Security testing needs -->
> ````
>
> **Rules:**
> - Every choice must be justified for THIS project. No generic "we'll use Jest because it's popular."
> - The test coverage map must account for every task in `.claude/tasks/`.
> - Test design techniques must be specific to each area, not generic.
> - Be practical. Don't propose 500 E2E tests for a 10-task MVP.
> - Every feature gets verified with tests after implementation. Tests check behavior, not implementation details.

## Step 3: Review

Read the test plan. Check:
- Does the pyramid shape make sense for this architecture?
- Are the framework choices justified and boring (proven)?
- Is every task covered in the test coverage map?
- Are the test design techniques specific, not generic?
- Is the Definition of Done achievable and clear?

If issues, send tester back with feedback.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Current State" → test strategy defined, ready to start development
- "Key Decisions Log" → test plan approved: {framework}, {approach}

## Step 5: Present to client

Brief summary:
- "Here's how we'll ensure quality: {approach in one sentence}"
- "Test frameworks: {choices}"
- "Every feature gets verified with tests after implementation"
- "Critical paths covered by E2E: {list}"

Ask: "Any concerns? Ready to start building?"
