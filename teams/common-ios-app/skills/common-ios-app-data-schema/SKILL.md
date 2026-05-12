---
name: common-ios-app-data-schema
description: Data agent designs the local persistence layer for a native iOS app from the system design — schema for SwiftData (iOS 17+) or Core Data (iOS 16 floor) with appropriate migrations, encryption posture (Data Protection class + Keychain access class), CloudKit sync configuration when needed, multi-screen data coherence via `@Query` / `@FetchRequest`, sandbox filesystem discipline (Documents / Application Support / Caches / tmp), atomic file writes. Produces `.claude/data-schema.md`. Use after system design is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing schema]"
---

# iOS Data Schema — Local Persistence Design

You are the CEO. The system design is approved. Now the **data** agent designs local persistence — the foundation an iOS app's state lives in. Schema mistakes haunt an iOS product for years because users have app versions you can't migrate centrally.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — architecture, ADR-4 (persistence tier), ADR-5 (sync strategy), high-level data model
- `.claude/product-vision.md` — user flows, "Why a native iOS app?" section (offline? local-first? sensitive data? sync?)
- `.claude/ceo-brain.md` — constraints, supported devices, minimum iOS version

If `$ARGUMENTS` contains `--update`, read `.claude/data-schema.md` and revise.

## Step 2: Brief the data agent

Send **data** with this brief:

> Read these files:
> - `.claude/system-design.md` — architect's persistence tier (ADR-4), sync strategy (ADR-5), high-level data model, repository contracts
> - `.claude/product-vision.md` — user flows: what data is created / read / updated / deleted; offline expectations; sensitivity; cross-device sync needs
> - `.claude/ceo-brain.md` — constraints (timeline, minimum iOS version, sync requirements)
>
> Design the complete local-persistence layer for this iOS app. Save it as `.claude/data-schema.md`.
>
> **Defaults you should follow unless the system design contradicts them:**
> - **iOS 17+ greenfield**: **SwiftData** (`@Model`, `ModelContainer`, `@Query`, `VersionedSchema` + `SchemaMigrationPlan`). For CloudKit sync use the `cloudKitDatabase: .private(...)` option on `ModelConfiguration` (iOS 17.4+).
> - **iOS 16 floor or schema-mature project**: **Core Data** (`NSPersistentContainer` or `NSPersistentCloudKitContainer`). Lightweight migrations by default; heavyweight for type changes / splits.
> - **Complex SQL needs (FTS5, joins, custom indices)**: **GRDB** with `DatabaseMigrator`. Trade: you own the migrator.
> - **Tokens, API keys, biometric items**: **Keychain** (`Security` framework directly, or `KeychainAccess` wrapper). Default access class `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` (tokens stay device-local). NEVER `UserDefaults` for secrets.
> - **Small preferences (≤ a few KB)**: **`UserDefaults`** (or `@AppStorage` from a View). NEVER for user data.
> - **User-authored documents**: filesystem under `Documents/`. Files-app visible via `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace` when the product calls for it.
> - **Regeneratable caches**: `Caches/` or `URLCache`. OS may purge under storage pressure — that's the point.
> - **Cross-device sync (private to user)**: `NSPersistentCloudKitContainer` (Core Data) or SwiftData CloudKit option. iCloud private database. Last-writer-wins on the private DB; per-field merge for multi-user.
> - **Encryption at rest**: Data Protection class (`.completeFileProtectionUntilFirstUserAuthentication` default; `.completeFileProtection` for highest sensitivity). SQLite already encrypted by the OS when the user has a passcode.
> - **Atomic file writes**: `Data.write(to: url, options: [.atomic])` for non-trivial files; OS-coordinated for documents.
> - **NEVER write inside the app bundle** — read-only on device.
>
> The document MUST follow this structure:
>
> ````markdown
> # Data Schema
> > Version {N} — {date}
> > Based on system design v{N}
>
> ## 1. Storage Map
>
> | Layer | Technology | Location | What lives here |
> |-------|-----------|----------|-----------------|
> | Relational user data | {SwiftData / Core Data / GRDB} | `Application Support/{name}.sqlite` (default) | All persistent business data |
> | Settings | UserDefaults / @AppStorage | `~/Library/Preferences/{bundleID}.plist` | Window state, last selected tab, user prefs (theme, locale) |
> | Secrets | Keychain | iOS Keychain | API tokens, refresh tokens, biometric-protected items |
> | User documents | Filesystem (atomic writes) | `Documents/` | Files the user names and owns (Files-app visible if declared) |
> | Caches | URLCache + filesystem | `Caches/` | Re-downloadable / regeneratable data |
> | Temp | NSTemporaryDirectory() | `tmp/` | Truly transient |
>
> NEVER write inside the app bundle.
>
> ## 2. Persistence Engine
>
> ### Choice: {SwiftData | Core Data | GRDB}
> {one paragraph why for THIS app, given the minimum iOS version + access patterns}
>
> ### Container setup
> ```swift
> // SwiftData example
> let schema = Schema([Document.self, DocumentRevision.self])
> let config = ModelConfiguration(
>     schema: schema,
>     isStoredInMemoryOnly: false,
>     allowsSave: true,
>     cloudKitDatabase: .private("iCloud.com.example.MyApp")
> )
> let container = try ModelContainer(for: schema, configurations: config)
> ```
>
> ### Connection model
> - **Main context** drives UI via `@Query` (SwiftData) or `@FetchRequest` (Core Data).
> - **Background contexts** for heavy fetches / writes outside the main actor.
> - Repository protocols hide the persistence engine from ViewModels.
>
> ## 3. Entity Diagram
> <!-- Excalidraw diagram showing entities as boxes with key attributes, relationships with cardinality.
>      Color-code by domain area. Mark which entities sync to CloudKit. -->
>
> ## 4. Entities
>
> For each entity:
>
> ### {Entity}
> **Purpose:** {one sentence}
> **CloudKit:** {yes — synced via private DB | no — local-only}
>
> | Attribute | Type | Optional | Default | Description |
> |-----------|------|----------|---------|-------------|
> | `id` | UUID | NO | UUID() | Primary key |
> | `createdAt` | Date | NO | .now | Creation timestamp (UTC) |
> | `updatedAt` | Date | NO | .now | Last update timestamp (UTC) |
> | `deletedAt` | Date | YES | nil | Soft delete (if applicable) |
> | ... | ... | ... | ... | ... |
>
> **Constraints:**
> - `@Attribute(.unique)` on `{attribute}` (SwiftData) OR `UNIQUE` (Core Data validation rules / GRDB CHECK)
> - `@Relationship(deleteRule: .cascade)` to `{related entity}`
> - {CHECK / validation rules}
>
> ---
>
> ## 5. SwiftData / Core Data Schema (code sketch)
>
> ```swift
> // SwiftData
> @Model
> final class Document {
>     @Attribute(.unique) var id: UUID
>     var title: String
>     var body: String
>     var createdAt: Date
>     var updatedAt: Date
>     @Relationship(deleteRule: .cascade) var revisions: [DocumentRevision]
>
>     init(id: UUID = UUID(), title: String, body: String = "") {
>         self.id = id
>         self.title = title
>         self.body = body
>         let now = Date()
>         self.createdAt = now
>         self.updatedAt = now
>         self.revisions = []
>     }
> }
> ```
>
> Full schema in `Core/Persistence/Models/`. This section is the contract.
>
> ## 6. Migrations
>
> ### Strategy
> - **SwiftData**: `VersionedSchema` per version; `SchemaMigrationPlan` with `.lightweight` stages for additive changes, `.custom` for type changes / backfills.
> - **Core Data**: lightweight migration when changes are additive (add attribute, add entity, rename via mapping model). Heavyweight via `.xcmappingmodel` for type changes / splits.
> - **GRDB**: `DatabaseMigrator` with versioned `registerMigration`. Forward-only.
> - On open, the runner refuses to operate on a store from a newer version than the app supports — surfaces "Please update the app" UI.
>
> ### Initial migration sketch
> ```
> V1 — initial schema (Document, DocumentRevision)
> V2 — add `pinned: Bool` to Document (lightweight)
> V3 — split `attachments` from Document into Attachment entity (custom)
> ```
>
> ### Migration safety notes (iOS reality)
> - Every user has their own copy of the store. You cannot run a "deploy migration" centrally.
> - Migrations MUST be tested against real stores produced by every released app version. Keep fixture stores per version checked into the repo.
> - Backfill migrations on large stores need a progress UI — a 30s migration is acceptable; a 5-minute one is not, without UI feedback.
> - Snapshot the store to `Documents/backups/{ISO-timestamp}.sqlite` before destructive migrations so users can restore.
>
> ## 7. CloudKit Sync (if applicable)
>
> - **Container ID:** `iCloud.com.{org}.{app}`
> - **Database:** private (single Apple ID, multiple devices)
> - **Schema promotion:** development schema deployed to production via the CloudKit Dashboard before the app ships. Apps that hit production CloudKit before schema promotion fail silently.
> - **Conflict resolution:** last-writer-wins on the private DB. (Multi-user collaboration via `CKShare` / `CKSharedDatabase` is out of scope of this default; flag as a future option.)
> - **Sync status surfacing:** repository exposes an `AsyncStream<SyncStatus>` (idle / syncing / lastSyncedAt / error). UI shows a sync indicator.
> - **Edge cases:**
>   - User signed out of iCloud → sync silently disabled; surface a banner with "Sign in to iCloud to sync".
>   - iCloud storage full → sync fails; surface clear error.
>   - Low Data Mode → CloudKit may defer; expected behaviour.
>
> ## 8. Multi-Screen Data Coherence
>
> - **SwiftData**: `@Query` in views subscribes automatically — no manual broadcast.
> - **Core Data**: `@FetchRequest` in views subscribes automatically.
> - **Repository-driven changes** (network refresh, push notification arrival): expose an `AsyncStream` or `PassthroughSubject` from the repository; subscribe via `.task` in the View or `@Observable` in the ViewModel.
> - **NEVER poll**. Battery + bugs.
>
> ## 9. Keychain & Encryption-at-Rest
>
> ### Keychain
> - **Default access class:** `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`. Tokens stay on this device; new device = re-login.
> - **Biometric items:** `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` + `SecAccessControl` with `.biometryCurrentSet`. Passcode fallback always present.
> - **Wrapper:** `KeychainStore` actor in `Core/Security/`. Repositories depend on the protocol; tests inject a stub.
>
> ### Data Protection
> - **Default class:** `.completeFileProtectionUntilFirstUserAuthentication` for app data.
> - **Higher sensitivity:** `.completeFileProtection` for items that must be locked when the device is locked (e.g., health records, financial data).
> - Set on file creation via `URLResourceKey.fileProtectionKey`.
>
> ### Encryption beyond OS-level
> {None unless the threat model demands it. If demanded, column-level encryption via app-side AEAD with a Keychain-stored key. Encrypted columns can't be indexed — plan deterministic hashing for lookup keys.}
>
> ## 10. Filesystem Layout (App Sandbox)
>
> | Directory | Path | iCloud Backup? | When to use |
> |-----------|------|---------------|-------------|
> | `Documents/` | `FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!` | YES | User-authored documents |
> | `Application Support/` | `.applicationSupportDirectory` | YES | App-managed data (SwiftData / Core Data store, internal caches that must survive reinstall) |
> | `Caches/` | `.cachesDirectory` | NO | Regeneratable data; OS may purge |
> | `tmp/` | `NSTemporaryDirectory()` | NO | Truly transient |
>
> - **Exclude large regeneratables from iCloud Backup:** `URL.setResourceValues(URLResourceValues(isExcludedFromBackup: true))` for items in `Documents/` that don't deserve backup.
> - **Atomic writes:** `Data.write(to: url, options: [.atomic])` for non-trivial files.
> - **NEVER write inside the app bundle.**
>
> ## 11. Backups & Recovery
>
> - **iCloud Backup** is the user's safety net. Items in `Documents/` and `Application Support/` are backed up automatically unless excluded.
> - **In-app backup** for users who want explicit control: "Export my data" produces a JSON / SQLite file saved via `UIDocumentPickerViewController`.
> - **Restore from in-app backup**: import via the document picker; validate the schema; replace or merge per user choice. Test the restore flow before shipping.
> - **Integrity check** on first launch after upgrade: a quick consistency check (counts of expected aggregates, dangling references). If broken, surface "your data is being repaired" UI rather than silent recovery.
>
> ## 12. Privacy & Security
>
> ### PII
> - Identify PII at design time (names, emails, addresses, IPs, telemetry IDs).
> - For health / financial data: column-level encryption with a Keychain-stored key + biometric gating on the encryption key.
> - Never ship real production PII in dev seeds. Mask on copy.
>
> ### PrivacyInfo.xcprivacy
> - Declare every data category collected (linked / not linked to user, used for tracking yes/no).
> - Required-reason API codes for: file timestamps, system boot time, disk space, user defaults, active keyboards.
> - Match the ASC App Privacy questionnaire exactly.
>
> ### GDPR / CCPA — "delete my data"
> - One delete-all handler that closes the store, deletes `Application Support/{name}.sqlite`, deletes `Documents/`, clears Keychain items for this app, deletes `Caches/`, then exits.
> - For data referenced from audit logs (rare in single-user iOS apps), anonymize the user reference.
> - Track consent: what the user agreed to, when, version of terms.
> - Export: produce a downloadable file (JSON or SQLite snapshot) via the document picker.
>
> ## 13. Open Questions
> <!-- Things that need decisions: encryption posture per surface, backup retention, FTS5 vs naive search, etc. -->
> ````
>
> **Rules:**
> - Default to SwiftData (iOS 17+) or Core Data (iOS 16 floor). Justify any deviation in writing.
> - Start with the simplest schema; normalize until measured pain.
> - Every business entity: `id: UUID` (primary key), `createdAt: Date`, `updatedAt: Date`. Soft `deletedAt: Date?` only when the product needs it.
> - Money: `Decimal` or integer minor units (`amountCents: Int64`). NEVER `Double`.
> - Timestamps: `Date` (UTC). Display formatting in the View.
> - Tokens via Keychain. NEVER `UserDefaults`.
> - Migrations forward-only. Never silently downgrade.
> - File writes atomic. NEVER write inside the app bundle.
> - CloudKit schema promoted to production BEFORE the App Store submission.
> - `try!` and force-unwrap are blocked by the iron-rule-check hook in production code.

## Step 3: Review

Read the schema. Check:
- Properly normalized? No god entities, no redundant data without justification.
- Every relationship has a `deleteRule` (SwiftData) or `Delete Rule` (Core Data)?
- Constraints comprehensive? `@Attribute(.unique)`, validation rules, relationship inverses?
- Migration plan gated on version refusal-on-newer?
- Backup strategy concrete — iCloud Backup posture, in-app export?
- Multi-screen coherence: `@Query` / `@FetchRequest` for store-driven changes, AsyncStream for repository-driven?
- Encryption posture explicit (Keychain access class, Data Protection class)?
- File writes atomic? CloudKit schema promotion noted?
- Engine choice justified? Did we accidentally pick GRDB when Core Data would do?
- PrivacyInfo.xcprivacy data categories declared?

If issues, send data agent back.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → data schema designed: {SwiftData / Core Data / GRDB} ({N} entities); encryption: {Data Protection class + Keychain}; backup: iCloud Backup + in-app export; sync: {CloudKit / none}
- "Architecture Overview" → add data layer summary

## Step 5: Present to client

> "Local persistence designed: {engine} with {N} entities. Encryption: {posture}. Sync: {CloudKit private DB / local-only}. Migrations forward-only, refusal-on-newer. iCloud Backup + in-app export.
> {Any client decisions needed — e.g., 'Should we expose the documents directory to Files.app for iCloud Drive sync? Pros: users see their files. Cons: more support tickets about iCloud not syncing.'}"
