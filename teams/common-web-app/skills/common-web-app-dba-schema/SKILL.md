---
name: common-web-app-dba-schema
description: DBA designs the database schema for a web application from the system design — tables, indexes, constraints, RLS, zero-downtime migration plan. Defaults to Postgres + Redis. Produces .claude/database-schema.md. Use after system design is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing schema]"
---

# Web-App DBA Schema — Database Design

You are the CEO. The system design is approved. Now the **dba** designs the database — the foundation everything else is built on. A bad schema haunts a web app forever.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — architecture, data model (high-level), API contracts
- `.claude/product-vision.md` — user flows (what data is created/read/updated)
- `.claude/ceo-brain.md` — constraints

If `$ARGUMENTS` contains `--update`, read `.claude/database-schema.md` and revise.

## Step 2: Brief the DBA

Send **dba** with this brief:

> Read these files:
> - `.claude/system-design.md` — the architect's data model, API design, and component breakdown
> - `.claude/product-vision.md` — user flows: know what data is created, read, updated, deleted
> - `.claude/ceo-brain.md` — constraints (timeline, scale expectations, tenancy model)
>
> Design the complete database schema for this web application. Save it as `.claude/database-schema.md`.
>
> **Defaults you should follow unless the system design contradicts them:**
> - Primary store: **Postgres** (managed: Neon, Supabase, RDS, Cloud SQL, or Railway).
> - Cache / sessions / rate-limit / ephemeral queues: **Redis**.
> - Search: in-Postgres `tsvector` first; Meilisearch / Typesense / Elasticsearch only if the system design requires it.
> - Multi-tenant: single DB, `tenant_id` (or `organization_id`) on every business table, RLS enforced.
>
> The document MUST follow this structure:
>
> ````markdown
> # Database Schema
> > Version {N} — {date}
> > Based on system design v{N}
>
> ## 1. Engine & Topology
> **Primary:** Postgres {version} (managed: {Neon / Supabase / RDS / Cloud SQL / Railway})
> **Cache / sessions / rate limits:** Redis (managed: {Upstash / ElastiCache / managed Redis})
> **Search:** {Postgres tsvector | Meilisearch | Typesense | Elasticsearch} — {why}
> **Other engines (if any):** {engine — one-paragraph justification}
> **Pooling:** {PgBouncer transaction mode | Neon pooler | Supabase pooler | RDS Proxy}
> **Multi-tenancy model:** {single DB + tenant_id + RLS | schema-per-tenant | DB-per-tenant} — {why}
>
> ## 2. ER Diagram
> <!-- Create an Excalidraw diagram showing:
>      - All entities as boxes with key columns
>      - Relationships with cardinality (1:1, 1:N, M:N)
>      - Junction tables for M:N relationships
>      - Tenant boundary highlighted
>      - Color-code by domain area if applicable -->
>
> ## 3. Tables
>
> For each table:
>
> ### {table_name}
> **Purpose:** {one sentence — what this table stores}
>
> | Column | Type | Nullable | Default | Description |
> |--------|------|----------|---------|-------------|
> | `id` | BIGINT GENERATED ALWAYS AS IDENTITY | NO | auto | Internal primary key |
> | `public_id` | UUID | NO | uuidv7() | External / API-exposed ID |
> | `tenant_id` | BIGINT | NO | — | RLS boundary |
> | `created_at` | TIMESTAMPTZ | NO | now() | Row creation time |
> | `updated_at` | TIMESTAMPTZ | NO | now() | Last modification |
> | `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete (if applicable) |
> | ... | ... | ... | ... | ... |
>
> **Constraints:**
> - PK: `id`
> - UNIQUE: `public_id`; `({tenant_id, slug})` — {why}
> - FK: `{column}` → `{table}(id)` ON DELETE {CASCADE | SET NULL | RESTRICT}
> - CHECK: `{expression}` — {what it validates}
>
> **Indexes:**
> - `idx_{table}_tenant_created` on `(tenant_id, created_at DESC)` — feed queries
> - `idx_{table}_{columns}` — {what query, partial / expression / GIN if applicable}
>
> **RLS policy:** `tenant_id = current_setting('app.tenant_id')::bigint` (or N/A if global table)
>
> ---
>
> ## 4. Relationships Summary
>
> | From | To | Type | FK | ON DELETE |
> |------|-----|------|-----|-----------|
> | orders | users | N:1 | orders.user_id → users.id | RESTRICT |
> | ... | ... | ... | ... | ... |
>
> ## 5. Cross-Cutting Tables
>
> Document the standard web-app integrity tables:
> - `idempotency_keys` — for webhook handlers and retried API mutations
> - `outbox` — for delivering events to Stripe / SendGrid / SQS / etc.
> - `audit_events` — append-only activity log (if required by product)
> - `sessions` (Redis) — key shape, TTL
> - `rate_limits` (Redis) — key shape, window
>
> ## 6. Migration Plan
>
> Ordered migrations for initial schema setup:
>
> ```
> 001_extensions.sql            -- pgcrypto, uuid-ossp / pg_uuidv7, pg_trgm, etc.
> 002_create_tenants_users.sql
> 003_create_{domain}.sql
> ...
> 0NN_enable_rls.sql            -- RLS policies for every tenant-scoped table
> 0NN_create_indexes.sql        -- CONCURRENTLY for any non-empty table
> 0NN_seed_reference_data.sql   -- if applicable
> ```
>
> ### Migration Safety Notes (live web traffic)
> - All index creation uses `CREATE INDEX CONCURRENTLY` after launch.
> - `lock_timeout = '2s'` on every migration.
> - Future column type / rename changes follow expand/contract.
> - Migrations run from a release job, not on app boot.
> - {Tables expected to grow large — flag for future partitioning}
>
> ## 7. Query Patterns
>
> For each core user flow, document the expected query and the index it relies on:
>
> ### Flow: {user flow name}
> ```sql
> -- {what this query does}
> SELECT ... FROM ... WHERE tenant_id = $1 AND ... ORDER BY ... LIMIT $N;
> ```
> **Index used:** `idx_{table}_{columns}`
> **Pagination:** {keyset on (created_at, id) | OFFSET acceptable because admin-only}
> **Expected performance:** {fast / medium — and why, with EXPLAIN expectations}
>
> ## 8. Scaling Considerations
> - Hottest tables and projected growth.
> - When to add read replicas (and which reads are replica-safe).
> - Partitioning candidates (`audit_events`, `outbox`, time-series tables) — partition key.
> - Caching opportunities (which queries, what TTL, invalidation trigger).
> - Search migration trigger (Postgres tsvector → Meilisearch/Typesense): row count or QPS threshold.
>
> ## 9. Security & Compliance
> - PII columns enumerated with sensitivity level.
> - RLS enforcement summary.
> - Encryption-at-rest assumptions (managed-service default + any column-level encryption).
> - GDPR deletion path: which tables purge, which anonymize, which retain (legal hold).
> - Consent / terms-version tracking.
>
> ## 10. Backup & Recovery
> - Backup strategy: {automated daily + PITR via WAL on the managed service}
> - Retention: {30 days minimum}
> - Recovery time objective: {target}
> - Recovery point objective: {target}
> - Tested restore procedure: {scheduled — first test before launch}
> ````
>
> **Rules:**
> - Default to Postgres + Redis. Justify any other engine in writing.
> - Start in 3NF. Denormalize only with documented justification.
> - Every business table: internal `id` (BIGINT identity), external `public_id` (UUIDv7), `tenant_id`, `created_at`, `updated_at`.
> - Every FK has an index. Composite indexes lead with `tenant_id` for multi-tenant tables.
> - NOT NULL on every column unless NULL has genuine semantic meaning.
> - Money: `NUMERIC(12,2)` or integer minor units (`amount_cents BIGINT`). Currency stored alongside. NEVER float.
> - Timestamps: `TIMESTAMPTZ` in UTC. NEVER `TIMESTAMP` without timezone.
> - RLS enabled on every tenant-scoped table; policies committed alongside the schema.
> - Idempotency keys + outbox are first-class — design them now, not after the first webhook bug.
> - Keyset pagination for any user-facing list. OFFSET only for bounded admin views.
> - Migration plan is zero-downtime safe under live traffic.

## Step 3: Review

Read the schema. Check:
- Properly normalized? No god tables, no redundant data without justification.
- Every FK indexed? Every multi-tenant index lead with `tenant_id`?
- Constraints comprehensive? NOT NULL, CHECK, UNIQUE, FK, RLS where needed?
- Cross-cutting tables present? `idempotency_keys`, `outbox`, sessions / rate-limits in Redis?
- Query patterns match the user flows in the product vision?
- Migration plan safe under live traffic? `CONCURRENTLY`, `lock_timeout`, no `NOT NULL` adds in one step?
- Engine choice justified? Did we accidentally pick MongoDB when JSONB would do?
- GDPR deletion path actually deletes (not just soft-deletes)?

If issues, send DBA back.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → database schema designed: Postgres ({N} tables) + Redis ({uses}); tenancy model: {chosen}
- "Architecture Overview" → add data model summary

## Step 5: Present to client

> "Database designed: Postgres with {N} tables, Redis for {sessions / cache / rate-limits}, multi-tenant via {single DB + RLS | schema-per-tenant}.
> Key entities: {list main entities}.
> Zero-downtime migration plan ready. {Any client decisions needed — e.g., managed service choice (Neon vs Supabase vs RDS)}."
