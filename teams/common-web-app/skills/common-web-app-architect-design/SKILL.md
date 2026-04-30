---
name: common-web-app-architect-design
description: Architect produces a full web-app system design from the approved product vision and prototype (the **Plan** phase of the spec-driven loop) — ADRs (architecture style, framework, DB, auth, rendering strategy, multi-tenancy), C4 context/container diagrams, data model, API contracts, component breakdown, observability + security plan, technical verification criteria that bind back to the vision's product criteria, and a phased implementation plan. Use after product vision and prototype are approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing design]"
---

# Architect Design — System Design from Vision + Prototype

You are the CEO. The product vision and prototype are approved. Now hand off to the **architect** to produce a full system design for the web application.

## Step 1: Verify inputs exist

Check that these files exist:
- `.claude/product-vision.md` — the product vision
- `.claude/prototypes/` — at least one prototype version
- `.claude/ceo-brain.md` — CEO knowledge base

If any are missing, tell the user what's needed and suggest running `/common-web-app-init` first.

If `$ARGUMENTS` contains `--update`, read the existing `.claude/system-design.md` — architect will revise, not start from scratch.

## Step 2: Brief the architect

Send **architect** with this brief:

> Read these files carefully:
> - `.claude/product-vision.md` — what we're building and why
> - `.claude/prototypes/README.md` — index of prototypes, find the latest approved version
> - The latest prototype HTML file — understand what screens, flows, and interactions exist
> - `.claude/ceo-brain.md` — strategic context, constraints, risks
>
> From this, produce a full system design document. Save it as `.claude/system-design.md`.
>
> The document MUST follow this structure:
>
> ```markdown
> # System Design
> > Version {N} — {date}
>
> ## 1. Overview
> <!-- One paragraph: what this system does, in technical terms.
>      Reference the product vision for the "why." -->
>
> ## 2. Architecture Decision Records
>
> ### ADR-1: Architecture Style
> **Status:** Accepted
> **Context:** {why this decision matters}
> **Decision:** {what we chose — e.g. modular monolith, microservices, serverless}
> **Alternatives Considered:**
> - {Option} — rejected because {trade-off}
> **Consequences:** {what we gain and lose}
>
> ### ADR-2: Tech Stack
> **Status:** Accepted
> **Context:** {constraints — team skills, timeline, product type}
> **Decision:**
> - Language: {choice + why}
> - Backend framework: {Rails / Django / Laravel / NestJS / Express / FastAPI / Hono / Next.js route handlers / etc. + why}
> - Frontend framework / rendering: {Next.js / Remix / Nuxt / SvelteKit / Astro / SPA / server-rendered + Hotwire/HTMX + why}
> - Database: {Postgres / MySQL / SQLite / etc. + why}
> - Cache / queue: {Redis / BullMQ / Sidekiq / Celery / Inngest / Trigger.dev / "none yet" + why}
> - Object storage: {S3 / R2 / GCS / "none yet" + why}
> - Other key tools: {each with one-line justification}
> **Consequences:** {trade-offs}
>
> ### ADR-3: Authentication & Authorization
> **Decision:** {sessions vs JWT, identity provider (OIDC/OAuth2 — Auth0/Clerk/WorkOS/Supabase/self-hosted), CSRF strategy, refresh-token approach}
> **Consequences:** {trade-offs, especially around CORS, mobile/API clients, and account takeover risk}
>
> ### ADR-4: Rendering Strategy
> **Decision:** {SSR / SSG / ISR / SPA / islands / hybrid — and which pages use which}
> **Consequences:** {SEO, LCP, hydration cost, infra implications}
>
> ### ADR-5: Multi-Tenancy (B2B SaaS only)
> **Decision:** {row-level via tenant_id / schema-per-tenant / cluster-per-tenant — and why}
> **Consequences:** {isolation guarantees, migration complexity, scaling ceiling}
>
> ### ADR-6+: {Other key decisions}
> <!-- Add ADRs for: hosting/deployment, real-time strategy (WebSockets/SSE/polling),
>      file uploads, payment processing, email/notification delivery, search,
>      feature flags. Only Type 1 (irreversible) or high-impact decisions. -->
>
> ## 3. System Context (C4 Level 1)
> <!-- Who uses the system? What external systems does it talk to?
>      Create an Excalidraw diagram showing:
>      - The system as a central box
>      - Users/personas around it
>      - External services (auth providers, payment, APIs, etc.)
>      - Arrows showing relationships -->
>
> ## 4. Container Diagram (C4 Level 2)
> <!-- The high-level technical building blocks:
>      - Frontend app(s)
>      - Backend API(s)
>      - Database(s)
>      - Message broker (if any)
>      - Cache (if any)
>      - External services
>      Create an Excalidraw diagram showing containers and how they communicate. -->
>
> ## 5. Data Model
> <!-- Core entities and their relationships.
>      For each entity:
>      - Name
>      - Key fields (not exhaustive — the important ones)
>      - Relationships to other entities
>      Create an Excalidraw ER diagram or write it as text. -->
>
> ## 6. API Design
> <!-- Key API endpoints or interfaces.
>      For each core user flow from the product vision, define:
>      - The endpoints involved
>      - Request/response shape (brief, not full OpenAPI)
>      - Auth requirements
>      Group by user flow, not by HTTP method. -->
>
> ## 7. Component Breakdown (C4 Level 3)
> <!-- For each container, list its major internal components/modules.
>      For each component:
>      - Name and responsibility (one sentence)
>      - Key dependencies
>      Group by container. This is what developers will implement. -->
>
> ## 8. Key Technical Decisions
> <!-- Non-ADR-level decisions developers need to know:
>      - Project structure / directory layout
>      - Validation library at the API boundary (Zod / Pydantic / class-validator / etc.)
>      - Error handling strategy (typed errors, HTTP mapping, user-facing messages)
>      - Logging approach (structured JSON, correlation IDs)
>      - Testing strategy (unit / integration / e2e split, tooling)
>      - Environment configuration approach (12-factor, secrets manager) -->
>
> ## 9. Caching & Performance Plan
> <!-- For each tier, state what's cached and how:
>      - CDN: which routes/assets, Cache-Control + stale-while-revalidate values
>      - Reverse proxy / framework cache (e.g. Next.js Data Cache, ISR revalidate windows)
>      - Redis: sessions, rate-limit counters, computed aggregates
>      - Database: indexes for hot queries, materialized views if any
>      - Frontend: Core Web Vitals budgets (LCP, INP, CLS), bundle-size budget
>      Note what's intentionally NOT cached yet and why. -->
>
> ## 10. Observability Plan
> <!-- - Structured logs with correlation_id propagation
>      - Tracing (OpenTelemetry spans for HTTP, DB, cache, queue, outbound)
>      - Metrics (request rate, error rate, p50/p95/p99 latency, queue depth, cache hit ratio)
>      - RUM + Core Web Vitals collection
>      - Error tracking (Sentry/etc.) with frontend source maps
>      - Audit logs for tenant-impacting actions (B2B SaaS) -->
>
> ## 11. Security Plan
> <!-- - Auth model (from ADR-3) — recap the threat surface
>      - Authorization checks at the data layer (no IDOR)
>      - Input validation library and where it runs
>      - CSP, HSTS, SameSite cookies, CSRF approach
>      - Secrets management
>      - Dependency scanning in CI
>      - Rate limiting on auth + write endpoints -->
>
> ## 12. Scalability Considerations
> <!-- - First likely bottleneck (DB connections? a specific endpoint? worker throughput?)
>      - The plan when we hit it
>      - What we intentionally did NOT optimize yet, and why -->
>
> ## 13. Verification Criteria
> <!-- The system design is the technical contract. List observable system-level
>      signals that prove the design serves the product vision's verification
>      criteria. Each technical criterion (TC) MUST trace back to one or more
>      product verification criteria (VC) from `.claude/product-vision.md`.
>
>      Format:
>      - TC-1 (verifies VC-1, VC-2): {observable system behaviour, e.g. "POST /signup
>        returns 201 within 500ms p95 and creates a workspace + owning user in one
>        transaction; rollback on any partial failure"}
>      - TC-2 (verifies VC-3): {e.g. "After /invitations/:id/accept, both the
>        inviter and invitee read the same workspace.* rows under their respective
>        sessions"}
>      - TC-3 (verifies VC-1): {e.g. "Login flow: 200 with valid creds + httpOnly
>        Set-Cookie; 401 with invalid; rate-limited after 5 failures/min/IP"}
>      - TC-4 (cross-cutting): {e.g. "All multi-tenant queries include tenant_id
>        in WHERE clause; static analysis check enforces this"}
>
>      Aim for 6-15 criteria. Each is something a reviewer or tester can verify
>      against the running system. If you can't write a TC for an ADR, the ADR
>      may not be load-bearing — reconsider it. -->
>
> ## 14. Implementation Plan
> <!-- Ordered list of work packages. Each package is a thin vertical slice
>      that delivers testable value.
>
>      Format:
>      ### Phase 1: {name} — Foundation
>      1. [Task] — [what to build] — [estimated complexity: S/M/L]
>      2. ...
>      **Delivers:** {what's testable after this phase}
>
>      ### Phase 2: {name} — Core Flow
>      1. ...
>      **Delivers:** {what the user can now do}
>
>      ### Phase 3+: ...
>
>      Dependencies between phases should be clear.
>      Parallelize within phases where possible. -->
>
> ## 15. Open Questions
> <!-- Technical unknowns that need investigation before or during implementation -->
>
> ## 16. Risks
> <!-- Pre-mortem: what could go wrong technically?
>      For each risk: likelihood, impact, mitigation -->
> ```
>
> **Rules:**
> - Every tech choice must have a one-line "why." No unjustified decisions.
> - Default to boring technology. Use innovation tokens only where they create real value.
> - Start with the simplest architecture that works (Gall's Law). Note where it should evolve.
> - The implementation plan is in thin vertical slices. Each phase delivers something testable.
> - Create Excalidraw diagrams for sections 3, 4, and 5. Call `read_me` first.
> - Reference the product vision and prototype throughout — the design serves the product, not the other way around.
> - If you have strong doubts about a product decision, flag it in Open Questions — don't silently reinterpret the vision.
> - This is a **web application**. If something in the vision implies mobile-native, desktop, embedded, or non-web targets, flag it instead of designing it.

## Step 3: Review the design

When architect returns the document, read it yourself (as CEO). Check:
- Does the design serve the product vision? Or did the architect over-engineer?
- Are the ADRs justified? Or is this resume-driven development?
- Is the implementation plan in achievable slices?
- Are there any risks the architect missed that you know about from the client conversation?

If something is off, send architect back with specific feedback.

## Step 4: Update the CEO brain

Once the design is approved, update `.claude/ceo-brain.md`:
- Update "Current State" — design approved, moving to implementation
- Update "Strategic Priorities" — first implementation phase
- Add to "Key Decisions Log" — design approved, key ADRs summarized
- Update "Architecture Overview" — one-paragraph summary of the chosen approach

## Step 5: Update CLAUDE.md

Fill in the `TBD` sections in `CLAUDE.md` Project Context:
- **Overview** — from system design overview
- **Tech Stack** — from ADR-2
- **Project Structure** — from the architect's directory layout
- **Commands** — fill what's known (package manager install, dev server, etc.), leave rest as TBD
- **Coding Conventions** — from the architect's technical decisions (error handling, naming, etc.)

## Step 6: Present to the client

Give the client a brief executive summary:
- What architecture was chosen and why (one sentence)
- What tech stack and why (one sentence)
- The implementation phases — what gets built first, second, third
- Timeline implication — how many phases, what each delivers
- Any open questions that need the client's input

Ask: "This is the technical plan. Any concerns before we start building?"

Wait for approval before proceeding to implementation.
