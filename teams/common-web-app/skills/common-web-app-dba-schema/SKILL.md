---
name: common-web-app-dba-schema
description: DBA designs the database schema from the system design — tables, relationships, indexes, constraints, migration plan. Works with architect on data model. Produces .claude/database-schema.md. Use after system design is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing schema]"
---

# SWE DBA Schema — Database Design

You are the CEO. The system design is approved. Now the **dba** designs the database — the foundation everything else is built on. A bad schema haunts the project forever.

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
> - `.claude/product-vision.md` — understand user flows to know what data is created, read, updated, deleted
> - `.claude/ceo-brain.md` — constraints (timeline, scale expectations)
>
> Design the complete database schema. Save it as `.claude/database-schema.md`.
>
> The document MUST follow this structure:
>
> ````markdown
> # Database Schema
> > Version {N} — {date}
> > Based on system design v{N}
>
> ## 1. Database Choice
> **Engine:** {Postgres / SQLite / MongoDB / etc.}
> **Why:** {one paragraph justification for THIS project}
> **Managed service:** {Supabase / Neon / RDS / Railway Postgres / etc.}
>
> ## 2. ER Diagram
> <!-- Create an Excalidraw diagram showing:
>      - All entities as boxes with key columns
>      - Relationships with cardinality (1:1, 1:N, M:N)
>      - Junction tables for M:N relationships
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
> | `id` | BIGSERIAL | NO | auto | Primary key |
> | `created_at` | TIMESTAMPTZ | NO | NOW() | Row creation time |
> | `updated_at` | TIMESTAMPTZ | NO | NOW() | Last modification |
> | ... | ... | ... | ... | ... |
>
> **Constraints:**
> - PK: `id`
> - UNIQUE: `{column}` — {why}
> - FK: `{column}` → `{table}(id)` ON DELETE {CASCADE/SET NULL/RESTRICT}
> - CHECK: `{expression}` — {what it validates}
>
> **Indexes:**
> - `idx_{table}_{columns}` — {why this index, what queries it serves}
>
> ---
>
> ## 4. Relationships Summary
>
> | From | To | Type | FK | ON DELETE |
> |------|-----|------|-----|-----------|
> | orders | users | N:1 | orders.user_id → users.id | CASCADE |
> | ... | ... | ... | ... | ... |
>
> ## 5. Migration Plan
>
> Ordered migrations for initial schema setup:
>
> ```
> 001_create_users.sql
> 002_create_products.sql
> 003_create_orders.sql
> 004_create_order_items.sql
> 005_add_indexes.sql
> 006_seed_data.sql (if applicable)
> ```
>
> ### Migration Safety Notes
> - {Any columns that may need expand/contract later}
> - {Large tables that need CONCURRENTLY for index creation}
> - {Data types that are hard to change later (choose carefully)}
>
> ## 6. Query Patterns
>
> For each core user flow, document the expected query pattern:
>
> ### Flow: {user flow name}
> ```sql
> -- {description of what this query does}
> SELECT ... FROM ... WHERE ... JOIN ...
> ```
> **Index used:** `idx_{table}_{columns}`
> **Expected performance:** {fast/medium — and why}
>
> ## 7. Scaling Considerations
> <!-- When will this schema hit limits?
>      - Which tables will grow fastest?
>      - When to add read replicas?
>      - When to consider partitioning? (which table, by what key)
>      - Caching opportunities (which queries, what TTL) -->
>
> ## 8. Backup & Recovery
> - Backup strategy: {automated daily + PITR via WAL}
> - Retention: {30 days minimum}
> - Recovery time objective: {target}
> - Tested restore procedure: {TBD — will test after first deploy}
> ````
>
> **Rules:**
> - Default to Postgres unless there's a compelling reason not to.
> - Start in 3NF. Denormalize only with documented justification.
> - Every table must have: PK, created_at, updated_at.
> - Every FK must have an index.
> - NOT NULL on every column unless NULL has genuine semantic meaning.
> - Use BIGSERIAL for internal IDs, UUIDv7 for external/exposed IDs.
> - Money as DECIMAL or integer cents. NEVER float.
> - Timestamps as TIMESTAMPTZ in UTC. NEVER without timezone.
> - Document expected query patterns and which indexes serve them.
> - The migration plan must be safe for zero-downtime deployment.

## Step 3: Review

Read the schema. Check:
- Is it properly normalized? (no god tables, no redundant data)
- Does every FK have an index?
- Are constraints comprehensive? (NOT NULL, CHECK, UNIQUE, FK)
- Do query patterns match the user flows from the product vision?
- Is the migration plan safe for production?
- Does the database choice make sense for this project?

If issues, send DBA back.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → database schema designed: {engine}, {N} tables
- "Architecture Overview" → add data model summary

## Step 5: Present to client

> "Database designed: {engine}, {N} tables, properly normalized with full constraints.
> Key entities: {list main entities}.
> Migration plan ready. {Any client decisions needed — e.g., managed service choice}."
