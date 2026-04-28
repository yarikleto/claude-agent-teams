---
name: common-web-app-devops-deploy
description: DevOps sets up the full infrastructure — CI/CD pipeline, Docker, hosting, database, CDN, monitoring, security. Creates handoff guides for actions requiring the client. Works from the system design. Use after system design is approved, before or during sprint.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--update to revise existing infra] [--handoff to generate client guides only]"
---

# SWE Deploy — Infrastructure Setup

You are the CEO. The system design is approved. Now the **devops** engineer sets up everything needed to run this product in production.

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
> **Choice:** {e.g., Railway / Render / AWS ECS / Vercel + Railway}
> **Why:** {one paragraph justifying the choice for THIS project at THIS stage}
> **Alternative:** {what to migrate to when we outgrow this, and the trigger condition}
>
> ### Deployment Strategy
> {Rolling / Blue-Green / Canary — and why for this project}
>
> ### Environments
> | Environment | Purpose | URL |
> |------------|---------|-----|
> | Local | Development | localhost:{port} |
> | Staging | Pre-production testing | staging.{domain} |
> | Production | Live users | {domain} |
>
> ## 2. CI/CD Pipeline
>
> ```yaml
> # Pipeline stages (will be implemented as GitHub Actions / GitLab CI)
> trigger: push to main
>
> stages:
>   - lint-and-typecheck
>   - unit-tests
>   - build
>   - integration-tests
>   - security-scan
>   - deploy-staging
>   - smoke-tests
>   - deploy-production    # manual gate or auto
>   - post-deploy-verify
> ```
>
> ### Branch Strategy
> {Trunk-based / feature branches — and why}
>
> ## 3. Containerization
> {Dockerfile strategy — multi-stage build, base image, what's included}
> {Docker Compose for local dev — services, volumes, networking}
>
> ## 4. Database & Data
> **Choice:** {e.g., Managed Postgres on Railway / RDS / Supabase}
> **Backups:** {strategy — automated daily, retention period}
> **Migrations:** {how schema changes are applied — e.g., Prisma migrate, Alembic}
>
> ## 5. Reverse Proxy / Load Balancer
> **Choice:** {none (PaaS handles it) / Caddy / nginx / Traefik — and why}
> **Config:** {key settings — upstream blocks, WebSocket support if needed, proxy headers}
> **Load balancing:** {not needed / round-robin / least-connections — and why}
>
> ## 6. Caching Strategy
> **CDN:** {Cloudflare / CloudFront / none for MVP}
> **Browser caching:** {fingerprinted assets → immutable, HTML → no-cache}
> **Proxy caching:** {none / nginx proxy_cache / Varnish — for what}
> **Compression:** {brotli + gzip / pre-compressed at build time / CDN handles it}
>
> ## 7. Domain, SSL, Security Headers
> **DNS:** {Cloudflare / Route53}
> **SSL:** {automatic via Cloudflare / Let's Encrypt / Caddy auto-HTTPS}
> **TLS:** {Intermediate profile — TLS 1.2 + 1.3, AEAD ciphers only}
> **HSTS:** {yes, max-age=63072000}
> **Rate limiting:** {Cloudflare edge rules / nginx limit_req / application-level — or "not needed for MVP"}
>
> ## 8. Monitoring & Observability
> ### Day One (MVP)
> - {Sentry for error tracking}
> - {Health check endpoint at /health}
> - {Uptime monitoring — e.g., UptimeRobot, Better Stack}
>
> ### Week One
> - {Structured logging with correlation IDs}
>
> ### Month One (if product gains traction)
> - {Metrics dashboard — Grafana}
> - {Basic SLOs defined}
>
> ## 9. Security
> - Secrets management: {env vars via {platform} / Vault}
> - Pre-commit hooks: {detect-secrets / git-secrets}
> - CI scanning: {Dependabot for deps, Trivy for containers}
> - HTTPS: {forced everywhere, HSTS}
> - IAM: {principle of least privilege — specifics}
>
> ## 10. Cost Estimate
> | Service | Monthly Cost | Notes |
> |---------|-------------|-------|
> | Hosting | ${N} | {details} |
> | Database | ${N} | {details} |
> | Monitoring | ${N} | {details} |
> | CDN/DNS | ${N} | {details} |
> | **Total** | **${N}/month** | At current scale |
>
> ### Cost at 10x scale
> {What changes and how much it costs}
>
> ## 11. Client Handoff Actions
> List everything the client must do themselves:
>
> | # | Action | Guide | Status |
> |---|--------|-------|--------|
> | 1 | {Purchase domain} | `.claude/handoff/01-domain.md` | PENDING |
> | 2 | {Create cloud account} | `.claude/handoff/02-cloud-account.md` | PENDING |
> | 3 | {Provide API keys} | `.claude/handoff/03-api-keys.md` | PENDING |
> | ... | ... | ... | ... |
>
> ## 12. Not Yet Needed (and when to add)
> | Feature | Add When | Estimated Effort |
> |---------|----------|-----------------|
> | Kubernetes | 20+ devs or 10+ microservices | 2-4 weeks |
> | Multi-region | Users in 3+ continents with <100ms requirement | 1-2 weeks |
> | Full observability (tracing) | 5+ services communicating | 1 week |
> | ... | ... | ... |
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
> - `Dockerfile` (if containerized)
> - `docker-compose.yml` (for local dev)
> - `.github/workflows/ci.yml` (CI/CD pipeline)
> - Any Terraform/Pulumi files (if IaaS)
> - Health check endpoint code (coordinate with developer if needed)
> - Monitoring configuration
> - `.env.example` with all required environment variables documented
>
> Remember: you CAN create infrastructure files (Dockerfile, CI configs, docker-compose, Terraform).
> You MUST NOT modify application code — that's the developer's domain.
> If the application needs a health check endpoint, request it from the developer.

## Step 5: Review and present

Read the infra plan yourself. Check:
- Is it right-sized for this project? Not over-engineered?
- Are costs reasonable for the project stage?
- Are all client actions identified with guides?
- Does it align with the architect's system design?

Present to the client:
> "Here's the infrastructure plan:
> - Hosting: {choice} (~${N}/month)
> - CI/CD: automatic deploy on every merge, with tests as the gate
> - {N} things I need from you (handoff guides ready):
>   1. {action 1}
>   2. {action 2}
> - We can start building immediately — infra will be ready in parallel."

## Step 6: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → infra plan: {hosting choice}, ~${N}/month
- "Constraints" → add any infra constraints discovered
