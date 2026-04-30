---
name: common-web-app-tester-plan
description: Tester drafts a test strategy for a WEB APP from the system design — pyramid shape, framework picks (Vitest + RTL/Vue Test Utils + Playwright by default, overridden by what the project already uses), DB-isolation strategy, network-mock strategy, accessibility layer, coverage map per task, Definition of Done. Use after system design and task breakdown are approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--update to revise existing test plan]"
---

# Web Test Plan — Test Strategy from System Design

You are the CEO. The system design and task breakdown are ready. Before anyone writes code, you need a test strategy — the **tester** defines HOW the web app will be tested, WHAT tools to use, and WHERE each type of test lives.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — architecture, data model, APIs
- `.claude/tasks/` — task files (one per task) with acceptance criteria
- `.claude/product-vision.md` — user flows

Also detect the existing stack so framework picks aren't theoretical:
- `package.json` (look for `vitest`, `jest`, `playwright`, `cypress`, `@testing-library/*`, `msw`, `supertest`)
- `pyproject.toml` / `requirements*.txt` (`pytest`, `httpx`, `pytest-asyncio`)
- `Gemfile` (`rspec-rails`, `capybara`)
- `composer.json` (`pestphp/pest`, `phpunit/phpunit`)

If `$ARGUMENTS` contains `--update`, read `.claude/test-plan.md` and revise.

## Step 2: Brief the tester

Send **tester** with this brief:

> Read these files:
> - `.claude/system-design.md` — architecture, tech stack, data model, API contracts
> - `.claude/tasks/` — every task and its acceptance criteria
> - `.claude/product-vision.md` — core user flows
> - `package.json` / `pyproject.toml` / `Gemfile` / `composer.json` — what's already installed
>
> Produce a test strategy for this **web application**. Save it as `.claude/test-plan.md`.
>
> **Default framework picks (override only if the project already uses something else):**
> - JS/TS unit + component: **Vitest** + **React/Vue/Svelte Testing Library** + `@testing-library/user-event`
> - Network mocking in components: **MSW**
> - Backend HTTP (Node): **supertest**; Python: **pytest + httpx/TestClient**; Rails: **rspec-rails request specs**; Laravel: **Pest HTTP tests**
> - Real DB integration: **Testcontainers** (Postgres/MySQL/Redis) — never SQLite-as-Postgres unless the app actually ships SQLite
> - E2E: **Playwright** (one happy path per critical user flow)
> - Accessibility: **axe-core** via `@axe-core/playwright` (E2E) and `jest-axe` / `vitest-axe` (component)
> - Static: TypeScript strict + ESLint on every PR
>
> The document MUST follow this structure:
>
> ````markdown
> # Test Strategy
> > Version {N} — {date}
>
> ## 1. Testing Philosophy
> <!-- For THIS web app:
>      - QA verification approach: tests written after implementation to verify behavior
>      - Pyramid or trophy? Justify for a web app of this shape
>      - Target distribution (e.g., 70% unit+component / 25% integration / 5% E2E)
>      - Classicist (real objects) or mockist? Why for this project? -->
>
> ## 2. Test Frameworks & Tools
>
> | Layer | Framework | Runner | Why this project |
> |-------|-----------|--------|------------------|
> | Unit (JS/TS) | Vitest | `vitest run` | {one-line why — e.g., already using Vite, native ESM} |
> | Component | React Testing Library + user-event | Vitest | Tests behavior via the rendered DOM |
> | Network mock (frontend) | MSW | — | Intercepts fetch at the network layer |
> | Backend HTTP | supertest / pytest+httpx / etc. | {runner} | {why} |
> | DB integration | Testcontainers Postgres | {runner} | Real SQL dialect, real constraints |
> | E2E | Playwright | `playwright test` | Multi-browser, auto-wait, traces on failure |
> | Accessibility | @axe-core/playwright + jest-axe | — | Fails on serious/critical violations |
> | Contract (if applicable) | Pact / OpenAPI schema validation | — | {why, only if frontend/backend split} |
> | Visual regression (light) | Playwright `toHaveScreenshot()` | — | Critical pages only |
>
> ### Test Doubles Strategy
> <!-- For THIS project:
>      - Default to real objects (classicist) or doubles (mockist)?
>      - DB: real via Testcontainers, or in-memory repo fake?
>      - Outbound HTTP from backend: nock / pytest-httpx / VCR?
>      - Outbound HTTP from frontend: MSW handlers shared between dev and tests?
>      - Auth: mint real JWTs/sessions in tests, or stub the auth middleware?
>      - Email/SMS/payments: fake adapter (preferred) or stub at HTTP layer? -->
>
> ### Determinism Rules
> <!-- Non-negotiable for this project:
>      - Clock frozen in tests (vi.useFakeTimers / freezegun / Timecop)
>      - RNG seeded or injected
>      - TZ pinned (UTC) and LANG pinned in test env
>      - Animations disabled in component and E2E tests
>      - Awaits via findBy*/waitFor or Playwright auto-wait — never setTimeout/waitForTimeout -->
>
> ### Database Isolation
> <!-- Pick one and justify:
>      - Transaction rollback per test (fast, default)
>      - Truncation per test (use when app opens own transactions)
>      - Schema-per-worker for parallel runs (test_db_${WORKER_ID}) -->
>
> ### CI Integration
> <!-- How tests run in CI:
>      - PR: type-check + lint + unit + component + integration (target <3 min)
>      - Merge to main: + E2E + a11y + visual regression
>      - Parallelization: shard by worker, schema per worker
>      - Flake quarantine: fail loud, never auto-retry without an issue link -->
>
> ## 3. Testing Pyramid for This Project
>
> ### Unit + Component (many, fast)
> <!-- List specific modules/components and what to test:
>      E.g., "src/domain/pricing.ts — discount rules, rounding, currency edges (boundary values)"
>      E.g., "src/components/CartLineItem.tsx — render, increment, decrement, remove (RTL + user-event)"
>      E.g., "src/hooks/useDebouncedSearch.ts — hook in isolation with fake timers" -->
>
> ### Integration (some, medium)
> <!-- E.g., "API: POST /checkout — full request/response with Testcontainers Postgres"
>      E.g., "Auth flow: signup → email verification → login with real JWT minting"
>      E.g., "Frontend page: ProductPage with MSW handlers, asserts loading → loaded → error states" -->
>
> ### E2E (few, slow)
> <!-- One happy path per critical user flow. Map to product-vision flows.
>      Keep this list SHORT (5–15 specs typical for an MVP).
>      E.g., "Flow 1: Sign up → verify email → create first project → invite teammate"
>      E.g., "Flow 2: Browse → add to cart → checkout → payment → order confirmation" -->
>
> ### Accessibility
> <!-- Which pages/components get axe-core?
>      - All public pages (home, signup, login, pricing) via Playwright + axe
>      - All form components via jest-axe in component tests
>      - Fail on serious/critical violations -->
>
> ## 4. Test Coverage Map
>
> Map each task from `.claude/tasks/` to its test coverage:
>
> | Task | Unit/Component | Integration | E2E | a11y | Test Design Technique |
> |------|----------------|-------------|-----|------|----------------------|
> | TASK-001 | — (scaffolding) | — | — | — | — |
> | TASK-002 | domain validators | DB CRUD via Testcontainers | — | — | Boundary values |
> | TASK-003 | login form (RTL) | POST /login (supertest) | Login flow (Playwright) | login page (axe) | Equivalence partitioning, state transitions |
> | ... | ... | ... | ... | ... | ... |
>
> ## 5. Test Design Techniques by Area
>
> | Area | Techniques | Why |
> |------|-----------|-----|
> | Form input validation | Equivalence partitioning, boundary values | Multiple input classes with clear edges |
> | Auth & permissions | State transitions, decision tables | Sessions, roles, multi-tenant rules |
> | Payment / checkout | Decision tables, error guessing | Many conditions interact; high blast radius |
> | Search / filtering | Pairwise testing | Many parameters combine |
> | File upload / import | Boundary values, error guessing | Size limits, encoding, malformed data |
> | Rendered UI components | Behavior via DOM (RTL queries by role/label) | Test what the user sees, not internals |
>
> ## 6. Test File Conventions
>
> ```
> src/
>   modules/
>     auth/
>       auth.service.ts
>       auth.service.test.ts          ← unit (co-located)
>       auth.routes.integration.test.ts  ← integration (co-located)
>   components/
>     LoginForm.tsx
>     LoginForm.test.tsx              ← component test (co-located)
>
> tests/
>   msw/
>     handlers.ts                     ← shared MSW handlers
>   factories/
>     user.factory.ts                 ← test data builders
>
> e2e/
>   auth/
>     login.spec.ts                   ← Playwright E2E
>   checkout/
>     happy-path.spec.ts
> ```
>
> Naming: `{module}.test.ts` for unit/component, `{module}.integration.test.ts` for integration, `{flow}.spec.ts` for E2E.
> Pattern: Arrange/Act/Assert in every test. RTL queries in priority order (role > label > text > test ID). No `data-testid` unless nothing else works.
>
> ## 7. Definition of Done (Testing)
>
> Applies to EVERY task:
> - [ ] All tests pass — unit + component + integration on PR
> - [ ] No flaky tests introduced (run the suite 3× locally if in doubt)
> - [ ] No skipped/disabled tests, no `.only`, no `xit`/`xdescribe`
> - [ ] Acceptance criteria each map to at least one assertion
> - [ ] Regression suite green
> - [ ] Type-check + lint pass on test files
> - [ ] No real network calls in unit/component/integration (MSW or local fakes only)
> - [ ] No real clock/RNG dependence in any test
>
> ## 8. Adversarial Testing Checklist
>
> For every task, the tester also considers:
> - [ ] Null / empty / whitespace / unicode / emoji / RTL inputs
> - [ ] Boundary values (0, 1, MAX-1, MAX, MAX+1)
> - [ ] Wrong types (string where number expected)
> - [ ] Unauthorized access (no token, expired token, wrong tenant, IDOR)
> - [ ] CSRF, open redirect, XSS payloads in user-controlled fields
> - [ ] Concurrent operations (double submit, race conditions)
> - [ ] Very large inputs (oversized payloads, long strings, deep JSON)
> - [ ] Network failures (timeout, 500, 429, partial response, offline)
> - [ ] Browser quirks where they matter (back/forward cache, double-click)
>
> ## 9. Legacy Code Strategy (if applicable)
> <!-- If joining an existing web codebase:
>      - Characterization tests first — snapshot HTTP responses, rendered HTML, DB rows
>      - Find seams (DI, HTTP boundary via MSW, env vars)
>      - Sprout/Wrap for new functionality
>      - Never refactor without tests -->
>
> ## 10. Risks
> <!-- Testing-specific risks:
>      - High-complexity / low-testability areas (call out the seam needed)
>      - External dependencies hard to simulate (payment, email, OAuth provider)
>      - Performance budgets (page load, API p95)
>      - Security testing (authn/authz, OWASP ASVS-relevant items) -->
> ````
>
> **Rules:**
> - Every choice must be justified for THIS web app. No "we'll use Jest because it's popular" — pick Vitest unless the project already runs Jest, then say so.
> - The coverage map must account for every task in `.claude/tasks/`.
> - Test design techniques must be specific per area, not generic.
> - Be practical. Don't propose 50 E2E tests for a 10-task MVP — 5–15 is typical.
> - Tests verify behavior (HTTP responses, rendered DOM, persisted state), not internals.
> - This is a **web app**. If the brief points elsewhere (mobile-native, CLI, desktop, games, embedded), refuse and tell the CEO.

## Step 3: Review

Read the test plan. Check:
- Pyramid shape fits the architecture (heavy SPA → more component tests; thin BFF → more integration)
- Framework picks match what's already installed, or are justified replacements
- Every task is covered in the coverage map
- DB isolation strategy is concrete (transaction rollback / truncation / schema-per-worker)
- Network mock strategy is concrete (MSW handlers, nock, pytest-httpx)
- Determinism rules cover clock, RNG, TZ, animations
- Definition of Done is achievable on every PR

If issues, send tester back with specific feedback.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Current State" → test strategy defined, ready to start development
- "Key Decisions Log" → test plan approved: {unit/component framework}, {E2E framework}, {DB isolation}, {network mocking}

## Step 5: Present to client

Brief summary:
- "Here's how we'll ensure quality: {one sentence — pyramid shape + classicist/mockist}"
- "Frameworks: {Vitest + RTL + Playwright, or whatever was chosen}, with axe-core for accessibility"
- "Every feature gets verified through tests after implementation — behavior, not internals"
- "Critical paths covered by E2E: {list, 5–15 items}"

Ask: "Any concerns? Ready to start building?"
