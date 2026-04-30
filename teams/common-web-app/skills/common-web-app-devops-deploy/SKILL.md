---
name: common-web-app-devops-deploy
description: DevOps sets up the full web-app infrastructure — CI/CD with per-PR preview environments, Docker, web hosting (Vercel/Netlify/Railway/Render/Fly/Cloudflare), managed Postgres, edge CDN, observability stack, feature flags, WAF/rate limiting. Creates handoff guides for actions requiring the client. Works from the system design. Use after system design is approved, before or during sprint.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--update to revise existing infra] [--handoff to generate client guides only]"
---

# Web Deploy — Infrastructure Setup

You are the CEO. The system design is approved. Now the **devops** engineer sets up everything needed to run this web app in production.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — architecture, tech stack, components
- `.claude/tasks/_overview.md` — to understand what's being built
- `.claude/ceo-brain.md` — constraints, timeline, budget context

If `$ARGUMENTS` contains `--update`, read `.claude/infra-plan.md` and revise.
If `$ARGUMENTS` contains `--handoff`, skip to Step 4 (generate client guides only).

## Step 2: Brief the DevOps engineer

Send **devops** with this brief:

> Read these files:
> - `.claude/system-design.md` — architecture decisions, tech stack, data model, API design, scalability considerations
> - `.claude/ceo-brain.md` — constraints (timeline, budget), project stage (MVP vs production)
> - `.claude/tasks/_overview.md` — what features are being built (to understand what the pipeline needs to support)
>
> Create a complete infrastructure plan. Save it as `.claude/infra-plan.md`.
>
> The document MUST follow this structure:
>
> ````markdown
> # Infrastructure Plan
> > Version {N} — {date}
> > Based on system design v{N}
>
> ## 1. Hosting & Deployment
> **Choice:** {Vercel / Netlify / Railway / Render / Fly / Cloudflare Pages+Workers / AWS ECS}
> **Why:** {one paragraph for THIS web app at THIS stage — match stack (Next.js → Vercel; long-running Node/Python → Railway/Render; static → Pages/Netlify; multi-region → Fly)}
> **Migrate to:** {what to move to when we outgrow this, with the trigger condition}
>
> ### Deployment Strategy
> {Rolling on PaaS by default / Blue-Green if zero-downtime DB migrations / Canary if traffic large enough to bucket}
>
> ### Environments
> | Environment | Purpose | URL |
> |------------|---------|-----|
> | Local | Development | localhost:{port} |
> | Preview (per PR) | Review + smoke tests | {pr-N}.preview.{domain} |
> | Staging | Pre-production testing | staging.{domain} |
> | Production | Live users | {domain} |
>
> ## 2. CI/CD Pipeline
>
> ```yaml
> # GitHub Actions
> on PR open/sync:
>   - lint-and-typecheck
>   - unit-tests
>   - build
>   - integration-tests
>   - security-scan          # gitleaks, npm audit / snyk
>   - deploy-preview         # platform handles, or render.yaml / railway preview
>
> on merge to main:
>   - deploy-staging
>   - smoke-tests + web-vitals-check
>   - deploy-production      # manual gate or auto
>   - post-deploy-verify     # health check + Sentry error-rate watch
> ```
>
> ### Branch Strategy
> {Trunk-based with short-lived feature branches — default for web teams}
>
> ## 3. Containerization (skip if Vercel/Netlify)
> {Dockerfile strategy — multi-stage build, base image (`node:*-slim` / distroless), non-root user, healthcheck}
> {Docker Compose for local dev — app + Postgres + Redis + worker}
>
> ## 4. Database & Data
> **Choice:** {Neon / Supabase / PlanetScale / RDS / Cloud SQL / Turso}
> **Why:** {fit for stack, edge needs, branching needs, compliance}
> **Connection pooling:** {Neon pooler / PgBouncer / RDS Proxy — required for serverless / horizontally-scaled app tier}
> **Branching for previews:** {Neon branch per PR / Supabase branch / dump+restore}
> **Backups:** {automated daily, point-in-time recovery, retention}
> **Migrations:** {Prisma / Drizzle / Alembic / Rails — running step in CI before deploy}
>
> ## 5. Background Jobs (if needed)
> **Choice:** {none / BullMQ + Redis worker / Sidekiq / Celery / Inngest / Trigger.dev / Defer}
> **Why:** {match runtime; hosted vs self-run trade-off}
> **Workloads:** {webhooks, emails, image processing, scheduled jobs}
>
> ## 6. Reverse Proxy / Edge (only when not on PaaS)
> **Choice:** {none — PaaS handles routing+TLS / Caddy / nginx / Traefik}
> **Config:** {WebSocket Upgrade headers if real-time, proxy_set_header X-Forwarded-*, gzip/brotli}
>
> ## 7. Caching Strategy
> **CDN:** {Cloudflare / platform CDN / none for MVP}
> **Static assets:** {fingerprinted → `max-age=31536000, immutable`; HTML → `no-cache`}
> **Framework cache:** {Next.js ISR / Nuxt route rules / Astro hybrid — and what `revalidate` values}
> **Tag-based invalidation:** {`revalidateTag` / `Cache-Tag` header — list initial tags and their purge triggers}
> **App cache:** {Upstash Redis / Render Redis — what's cached, TTL, purge-on-write path}
> **Compression:** {brotli + gzip — at CDN or pre-compressed at build time}
>
> ## 8. Domain, SSL, Security Headers, WAF
> **DNS:** {Cloudflare / Route53 / platform-managed}
> **SSL:** {automatic — platform / Cloudflare / Caddy auto-HTTPS}
> **TLS:** {Intermediate — TLS 1.2 + 1.3, AEAD ciphers only}
> **HSTS:** `max-age=63072000; includeSubDomains` (after a short rollout window)
> **Security headers:** CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
> **WAF / bot mitigation:** {Cloudflare managed rulesets + Bot Fight Mode / Turnstile on forms}
> **Rate limiting:** {edge rule for /api/* + Upstash `@upstash/ratelimit` per user/key — or "not needed for MVP"}
>
> ## 9. Observability
> ### Day One (MVP)
> - Sentry — errors, source maps wired in build
> - `/health` endpoint + uptime check ({Better Stack / Checkly / UptimeRobot}, {regions})
> - Web Vitals / RUM — {Vercel Analytics / Cloudflare Web Analytics}
> - Structured JSON logs → platform sink
>
> ### Week One
> - Correlation IDs (`X-Correlation-ID`) propagated through edge → app → workers
> - Sentry release tracking tied to git SHA
>
> ### Month One (if product gains traction)
> - OpenTelemetry tracing → {Datadog / Honeycomb / Grafana Tempo}
> - SLOs defined (availability, p95 latency by route)
> - Product analytics — {PostHog / Amplitude}
>
> ## 10. Feature Flags
> **Platform:** {LaunchDarkly / Statsig / GrowthBook / PostHog / Unleash}
> **Initial flags:** {release flag for {feature} / kill-switch for {expensive path}}
> **Default behavior on flag-service outage:** {flag value to assume}
>
> ## 11. Security
> - Secrets: {platform secrets / Doppler / Vault} — never in code or committed `.env`
> - Pre-commit: gitleaks / detect-secrets
> - CI: Dependabot, npm audit / Snyk, Trivy (if shipping containers)
> - Cookies: `Secure; HttpOnly; SameSite=Lax`
> - IAM: scoped service tokens for CI, least privilege on cloud roles
>
> ## 12. Cost Estimate
> | Service | Monthly Cost | Notes |
> |---------|-------------|-------|
> | Hosting | ${N} | {plan, expected usage} |
> | Database | ${N} | {plan, storage, compute} |
> | Redis / queue | ${N} | {if applicable} |
> | Observability (Sentry, RUM, logs) | ${N} | {plans} |
> | CDN / DNS / WAF | ${N} | {Cloudflare tier} |
> | Feature flags | ${N} | {plan} |
> | **Total** | **${N}/month** | At current scale |
>
> ### Cost at 10x scale
> {What changes — egress, function invocations, log volume, DB tier}
>
> ## 13. Client Handoff Actions
> | # | Action | Guide | Status |
> |---|--------|-------|--------|
> | 1 | Purchase domain | `.claude/handoff/01-domain.md` | PENDING |
> | 2 | Create {platform} account + add billing | `.claude/handoff/02-platform-account.md` | PENDING |
> | 3 | Register OAuth apps ({Google/GitHub}) | `.claude/handoff/03-oauth.md` | PENDING |
> | 4 | Provide third-party API keys ({Stripe/SendGrid/etc.}) | `.claude/handoff/04-api-keys.md` | PENDING |
> | 5 | Delegate DNS to Cloudflare | `.claude/handoff/05-dns.md` | PENDING |
> | ... | ... | ... | ... |
>
> ## 14. Not Yet Needed (and when to add)
> | Feature | Add When | Estimated Effort |
> |---------|----------|-----------------|
> | Multi-region active-active | Users in 3+ continents with <100ms requirement | 1–2 weeks |
> | Full distributed tracing | 3+ services communicating | 1 week |
> | Read replicas | Read load saturates primary p95 | 2–3 days |
> | Kubernetes | 20+ devs or 10+ services with proven need | 2–4 weeks |
> | Dedicated WAF rules + bot scoring | Sustained scraping or credential-stuffing detected | 2–3 days |
> ````
>
> **Rules:**
> - Every choice must be justified for THIS project at THIS stage. No resume-driven infrastructure.
> - Default to simple: PaaS over IaaS, managed over self-hosted, monolith over microservices.
> - Include cost estimates — the client needs to budget.
> - List EVERYTHING the client must do manually, with handoff guides.
> - The "Not Yet Needed" section prevents over-engineering while showing the client you've thought about scale.

## Step 3: Create handoff guides

For every item in the "Client Handoff Actions" table, send **devops** to create a detailed step-by-step guide:

> For each handoff action in `.claude/infra-plan.md`, create a guide in `.claude/handoff/`.
> Each guide must be so clear that a non-technical client can follow it in 10 minutes.
> Include URLs, screenshots descriptions, what to click, what to type, what to share back with us.

## Step 4: Implement infrastructure

Once the client completes their handoff actions (or in parallel for things that don't need client input), send **devops** to create the actual infrastructure files:

> Based on `.claude/infra-plan.md`, create:
> - Platform config — `vercel.json` / `netlify.toml` / `render.yaml` / `fly.toml` / `railway.toml` (whichever applies)
> - `Dockerfile` (if hosting on Render/Railway/Fly with a containerized service)
> - `docker-compose.yml` for local dev (app + Postgres + Redis + worker as needed)
> - `.github/workflows/ci.yml` — lint, typecheck, test, build, security scan, preview deploy on PR; staging+prod deploy on main
> - Preview-environment config — Render preview rules, Railway PR envs, or Vercel/Netlify defaults; DB-branching wiring (Neon/Supabase) per PR
> - Migration step in CI (Prisma/Drizzle/Alembic) — runs before deploy
> - Sentry init wiring + source-map upload step in CI
> - Feature-flag SDK initialization in the app (request from developer)
> - Edge / WAF rules in platform config (Cloudflare WAF, Vercel `vercel.json` rate-limit, etc.)
> - `.env.example` with every required variable documented (DATABASE_URL, SENTRY_DSN, flag SDK keys, third-party API keys)
>
> Remember: you CAN create infrastructure and config files. You MUST NOT modify application code — that's the developer's domain. If the app needs a `/health` endpoint, a feature-flag client init, or Sentry instrumentation, request it from the developer.

## Step 5: Review and present

Read the infra plan yourself. Check:
- Is it right-sized for this project? Not over-engineered?
- Are costs reasonable for the project stage?
- Are all client actions identified with guides?
- Does it align with the architect's system design?

Present to the client:
> "Here's the infrastructure plan:
> - Hosting: {choice} (~${N}/month at MVP, ~${M}/month at growth scale)
> - Database: {choice} with branching for per-PR previews
> - CI/CD: every PR gets a preview URL; merges to main auto-deploy with tests as the gate
> - Observability: Sentry + Web Vitals + uptime check from day one
> - Feature flags: {platform} — we can ship code and toggle features separately
> - {N} things I need from you (handoff guides ready):
>   1. {action 1}
>   2. {action 2}
> - We can start building immediately — infra will be ready in parallel."

## Step 6: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → infra plan: {hosting choice}, ~${N}/month
- "Constraints" → add any infra constraints discovered
