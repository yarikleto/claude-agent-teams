---
name: common-ios-app-architect-design
description: Architect produces a full iOS-app system design from the approved product vision and prototype (the **Plan** phase of the spec-driven loop) — ADRs (architecture pattern, modularization, navigation API, state ownership, persistence tier, sync strategy, concurrency posture, signing posture), C4 context / container diagrams, repository / service contracts, capabilities + entitlements list, privacy posture (PrivacyInfo.xcprivacy, ATT, purpose strings), and technical verification criteria that bind back to the vision's product criteria. Use after product vision and prototype are approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing design]"
---

# Architect Design — System Design from Vision + Prototype

You are the CEO. The product vision and prototype are approved. Now hand off to the **architect** to produce a full system design for the native iOS application.

## Step 1: Verify inputs exist

Check that these files exist:
- `.claude/product-vision.md` — the product vision
- `.claude/prototypes/` — at least one prototype version
- `.claude/design-spec.md` — design tokens and screen map (preferred — has SF Symbols inventory references)
- `.claude/ceo-brain.md` — CEO knowledge base

If any are missing, tell the user what's needed and suggest running `/common-ios-app-init` first.

If `$ARGUMENTS` contains `--update`, read the existing `.claude/system-design.md` — architect will revise, not start from scratch.

## Step 2: Brief the architect

Send **architect** with this brief:

> Read these files carefully:
> - `.claude/product-vision.md` — what we're building, supported devices, minimum iOS version, distribution + monetization, app lifecycle mode, sync needs, required iOS integrations
> - `.claude/prototypes/README.md` — index of prototypes; find the latest approved version
> - The latest prototype HTML file — understand screens, flows, modal styles, tab structure
> - `.claude/design-spec.md` — design tokens, typography mapping, screen map with visual acceptance criteria
> - `.claude/screen-map.md` — navigation graph (informs router decisions)
> - `.claude/sf-symbols.md` — symbol inventory (informs asset-catalog vs SF Symbol decisions)
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
> <!-- One paragraph: what this iOS app does, in technical terms.
>      Reference the product vision for the "why." -->
>
> ## 2. Architecture Decision Records
>
> ### ADR-1: Architecture Pattern
> **Status:** Accepted
> **Context:** Choosing the app's primary pattern shapes every screen, every test, every code review. MVVM is the boring default; TCA earns its keep on state-machine-heavy apps; VIPER is legacy-only in 2026.
> **Decision:**
> - Pattern: {MVVM | TCA | VIPER (legacy) | MVC (tiny utility)}
> - View layer: SwiftUI primary; UIKit interop where SwiftUI is still thin ({list the screens / features that need UIKit, e.g. AVCaptureSession-driven camera UI, complex collection-view feeds}).
> - State observation: {`@Observable` macro (iOS 17+) | `ObservableObject` + `@Published` (iOS 16)}.
> - View → ViewModel binding: {`@State`-owned VM for screen-local | DI-injected for cross-screen}.
> **Alternatives Considered:**
> - {Option} — rejected because {trade-off}
> **Consequences:** {testability gain, learning curve, refactor cost}
>
> ### ADR-2: Modularization
> **Status:** Accepted
> **Context:** A single-target Xcode project is fine for small apps but compile times and Git friction grow with the codebase. SPM packages buy incremental builds and clean module boundaries.
> **Decision:**
> - {Single app target | App target + `Core` package | App target + `Core` + feature packages | Tuist / XcodeGen managed}
> - Module boundaries: {list the top-level packages and their responsibilities — e.g. `Core/Networking`, `Core/Persistence`, `Core/DesignSystem`, `Features/Documents`, `Features/Settings`}
> **Alternatives Considered:**
> - {Option} — rejected because {trade-off}
> **Consequences:** {build speed, refactor cost, onboarding complexity}
>
> ### ADR-3: Navigation API
> **Status:** Accepted
> **Context:** iOS 16+ ships `NavigationStack` with value-typed paths. Pre-iOS-16 needs `NavigationView` (deprecated). iPad benefits from `NavigationSplitView` in regular size class.
> **Decision:**
> - Primary: `NavigationStack` + `navigationDestination(for: Route.self)` where `Route` is an `enum` (Hashable).
> - iPad regular size class: `NavigationSplitView` with adaptive fallback to `NavigationStack` in compact.
> - Router type: {none — each tab owns its own path | a `Router` `@Observable` that holds the `NavigationPath` and exposes `push(_:)` / `pop()`}.
> **Alternatives Considered:**
> - Coordinator pattern over UIKit — rejected because SwiftUI-first project
> **Consequences:** Type-safe routes, restorable paths, but every new screen needs a `Route` enum case + a `navigationDestination` arm.
>
> ### ADR-4: Persistence Tier
> **Status:** Accepted
> **Context:** SwiftData ships from iOS 17+ and is the modern default. Core Data is mature, supports earlier iOS, and has heavyweight migrations. GRDB earns its keep when you need real SQL.
> **Decision:**
> - Primary store: {SwiftData (iOS 17+) | Core Data (iOS 16 floor or schema-mature) | GRDB (SQL-heavy)}.
> - Schema overview: {top-level entities — e.g. Document, DocumentRevision, Tag, SyncState}.
> - View context vs background context: {pattern — main context for reads driving UI; background contexts for writes / heavy fetches}.
> - Migration runner: {SwiftData `VersionedSchema` + `SchemaMigrationPlan` | Core Data lightweight + heavyweight | GRDB `DatabaseMigrator`}.
> **Alternatives Considered:**
> - Realm — rejected because end-of-life maintenance trajectory
> **Consequences:** {trade-offs}
>
> ### ADR-5: Sync Strategy
> **Status:** Accepted
> **Context:** Three honest options — local-only, CloudKit (iCloud private DB; first-party, free), custom server.
> **Decision:** {Local-only | CloudKit via `NSPersistentCloudKitContainer` | CloudKit via SwiftData `cloudKitDatabase: .private` | Custom REST/GraphQL server | Hybrid}
> **Consequences:** {cross-device sync gain; operational complexity; conflict resolution model — last-writer-wins on CloudKit private DB; per-field merge or CRDTs for multi-user collaboration}
>
> ### ADR-6: Concurrency Posture
> **Status:** Accepted
> **Context:** Swift 6 strict concurrency is the future. Adopt now or schedule the migration.
> **Decision:**
> - Compiler setting: `-strict-concurrency=complete` (Swift 6 strict) — default for greenfield.
> - `@MainActor` on Views, ViewModels, and any UIKit-/SwiftUI-touching helpers.
> - `actor` for shared mutable state outside the main actor (caches, network rate-limiters).
> - `Sendable` audit: every cross-actor type. `@unchecked Sendable` only with a written rationale.
> **Alternatives Considered:**
> - Targeted strict-concurrency for now, complete later — acceptable when retrofitting a legacy codebase; greenfield projects start at complete.
> **Consequences:** Compile-time data-race safety; some refactoring up-front to satisfy Sendable.
>
> ### ADR-7: Security & Privacy Posture
> **Status:** Accepted
> **Context:** App Store hard-rejects builds with missing `PrivacyInfo.xcprivacy` since 2024. Tokens in UserDefaults are a forensic-tool dump waiting to happen.
> **Decision:**
> - Secrets at rest: **Keychain** with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` default access class. Biometric gating via `LAContext` for sensitive surfaces.
> - Data Protection class: `.completeFileProtectionUntilFirstUserAuthentication` for app data; `.completeFileProtection` for highest-sensitivity items.
> - ATS: default-deny; no `NSExceptionDomains` entries unless a specific HTTPS-only-fails domain is documented here.
> - `PrivacyInfo.xcprivacy`: {data categories collected, tracking yes/no, required-reason API codes — list the actual codes you'll use}.
> - App Tracking Transparency: {NOT needed | needed for {feature/SDK} — present prompt after onboarding, before SDK starts tracking}.
> - Sign in with Apple: {NOT needed | needed because {third-party social login is offered}}.
> - Universal Links: {NOT needed | needed for {feature} — associated domain `example.com`}.
> **Consequences:** Slight friction (tokens via Keychain wrapper, every privacy access wired explicitly) in exchange for App-Review-clean submissions.
>
> ### ADR-8: Bundle Identifier & Capabilities
> **Status:** Accepted
> **Decision:**
> - Bundle ID layout: `com.{org}.{app}`, with extensions as `com.{org}.{app}.widget`, `com.{org}.{app}.share`, etc.
> - Capabilities required: {list — Push, Sign in with Apple, Associated Domains, CloudKit, App Groups, HealthKit, In-App Purchase, etc.}
> - Each capability has a justification tied to a feature.
> **Consequences:** Provisioning profile + Apple Developer App ID configuration tracked in `.claude/packaging-plan.md`.
>
> ### ADR-9+: {Other key decisions}
> <!-- Add ADRs for: dependency injection style (manual DI default; Swinject when graph grows), networking layer (URLSession + async/await default; Alamofire when its retrier/interceptor surface is needed), image loading (AsyncImage for trivial; Nuke for production), crash reporting (Sentry / Crashlytics / MXMetricManager), analytics (PostHog / Mixpanel / Amplitude — each ships its own PrivacyInfo.xcprivacy you inherit), feature flags. Only Type 1 (irreversible) or high-impact decisions. -->
>
> ## 3. System Context (C4 Level 1)
> <!-- Create an Excalidraw diagram showing:
>      - The app as a central box
>      - Users / personas around it
>      - External services (auth provider, sync API, push notification server, analytics, crash reporting)
>      - iOS platform integrations (Keychain, CloudKit, Photos, Camera, Universal Links domain, Siri / Shortcuts)
>      - Arrows showing relationships -->
>
> ## 4. Container Diagram (C4 Level 2 — Module Graph)
> <!-- The high-level technical building blocks INSIDE the app:
>      - Main app target
>      - Extensions (widget, share, intents) — each is a separate target with its own bundle ID
>      - Watch target (if any)
>      - SPM packages (Core, Features/*)
>      - Persistence store
>      - Keychain
>      - Sync subsystem (CloudKit container or custom server client)
>      Show module dependencies. SwiftUI doesn't enforce these — the architect does. Excalidraw. -->
>
> ## 5. Repository / Service Contracts
> <!-- Every cross-feature service surface. ViewModels depend on these protocols; the production DI graph injects implementations.
>
>      | Protocol | Responsibility | Implementation | Tests use |
>      |----------|----------------|----------------|-----------|
>      | `DocumentsRepository` | CRUD on documents | `SwiftDataDocumentsRepository` | In-memory `ModelContainer` |
>      | `AuthClient` | Sign in / sign out / token refresh | `AppleSignInAuthClient` | Stub returning canned `AuthResult` |
>      | `PushClient` | Register for remote notifications, handle deliveries | `APNsPushClient` | `URLProtocol`-based stub |
>      | `Analytics` | Donate events with type-safe payloads | `PostHogAnalytics` | `RecordingAnalytics` spy |
>      | `FeatureFlags` | Read flag values | `ConfigCatFeatureFlags` | `StaticFeatureFlags(["foo": true])` |
>
>      For each: error model, async-ness, threading expectations. -->
>
> ## 6. Data Model
> <!-- High-level entity sketch — the `data` agent owns the full schema.
>      For each entity: name, key attributes, relationships, sync inclusion (CloudKit yes/no).
>      Note which writes trigger UI refresh via @Query / @FetchRequest. -->
>
> ## 7. Component Breakdown (C4 Level 3)
> <!-- For each major area (per feature, plus shared core), list modules:
>      - Features/Documents: DocumentsView, DocumentsViewModel, DocumentDetailView, DocumentDetailViewModel, DocumentsRepository (protocol + impl)
>      - Core/Networking: APIClient, AuthInterceptor, URLProtocol-friendly Session config
>      - Core/Persistence: ModelContainer factory, repository implementations
>      - Core/DesignSystem: Color asset catalog, Typography, common Views
>      One sentence per module; key dependencies. -->
>
> ## 8. Key Technical Decisions
> <!-- Non-ADR-level decisions developers need to know:
>      - Routing: enum-based Route + per-tab path
>      - State observation pattern: @Observable VM injected via @State at the screen root; child views use @Bindable
>      - Error model: typed `AppError` enum with cases per failure class (network, auth, persistence, validation, …); user-facing copy lives in the View layer
>      - Logging: `os.Logger` with subsystem `com.{org}.{app}` and category per module
>      - Dependency injection: manual constructor injection; an `AppContainer` struct holds the live graph; tests construct `AppContainer.test(repository: stub)` etc.
>      - Localization: String(localized:) on iOS 15+; xcstrings on iOS 17+
>      - Analytics events: typed payloads; consent-gated; the SDK ships its own PrivacyInfo.xcprivacy -->
>
> ## 9. Performance Plan
> <!-- - Cold-launch budget: first frame <400ms, interactive <1.5s.
>      - Heavy work off the main actor: `Task` + `await` to background actor / detached.
>      - Large lists: `LazyVStack` / `LazyHStack` / `List`; image pre-decoding via Nuke.
>      - SwiftData / Core Data: writes on background context; reads via main context for UI.
>      - Image caches bounded (`NSCache.countLimit` + `totalCostLimit`).
>      - Profiling: Instruments App Launch + Time Profiler + Allocations for regressions. -->
>
> ## 10. Observability Plan
> <!-- - `os.Logger` with subsystem + category per module
>      - Crash reporting: {Sentry Cocoa | Crashlytics | raw MXMetricManager}
>      - MetricKit: enabled, delivered to {backend}; cold-launch / scroll smoothness / hang rate logged
>      - Analytics (opt-in per privacy stance): {SDK}
>      - Sync telemetry (if CloudKit / custom server): success rate, conflict count, error categories -->
>
> ## 11. Security Plan
> <!-- - Recap ADR-7 — security posture is one cohesive set, never partial (Keychain access class, Data Protection class, ATS posture, ATT order)
>      - Sign in with Apple via AuthenticationServices
>      - OAuth via ASWebAuthenticationSession
>      - Biometric gating via LAContext where the product demands it
>      - PrivacyInfo.xcprivacy audit before every submission
>      - Required-reason API usage: list the codes and the call sites
>      - Universal Link validation: scheme + host + path on every onOpenURL
>      - URL scheme parsing: reject anything unexpected; never blindly trust deep-link parameters
>      - No private API usage — `nm` audit before submission -->
>
> ## 12. Cross-Device Considerations
> <!-- - Size classes: compact vs regular; iPad regular gets NavigationSplitView
>      - Device matrix: iPhone SE through iPhone 15 Pro Max; iPad mini through Pro 12.9
>      - iOS version matrix: support floor + current major
>      - Dynamic Type: every text style scales; layouts tested at AccessibilityExtraExtraLarge
>      - VoiceOver: labels + traits on every interactive element
>      - Reduce Motion: non-essential animations gated
>      - Dark mode + Increase Contrast: every color from the adaptive system or asset catalog -->
>
> ## 13. Verification Criteria
> <!-- The system design is the technical contract. List observable system-level
>      signals that prove the design serves the product vision's verification
>      criteria. Each technical criterion (TC) MUST trace back to one or more
>      product verification criteria (VC) from `.claude/product-vision.md`.
>
>      Format:
>      - TC-1 (verifies VC-1): {observable system behaviour, e.g. "Cold launch on
>        iPhone 12 mini (iOS 17.0) shows the first frame within 400ms (Instruments
>        App Launch trace asserts this)"}
>      - TC-2 (verifies VC-2): {e.g. "On second launch, the documents list
>        restores to the last scroll position and the editor restores any draft
>        text (Documents/ persisted via SwiftData)"}
>      - TC-3 (verifies VC-3): {e.g. "Sharing a document via the system share
>        sheet produces a Universal Link of the form
>        `https://example.com/doc/<id>` that opens the target on a recipient's
>        device"}
>      - TC-4 (verifies VC-4): {e.g. "A signed-in user on iPhone sees their data
>        on iPad within 60s without manual sync — verified via
>        `NSPersistentCloudKitContainer` events"}
>      - TC-5 (cross-cutting security): {e.g. "Every auth token is stored in
>        Keychain with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` access
>        class; no token is reachable via `UserDefaults` or filesystem inspection"}
>      - TC-6 (cross-cutting privacy): {e.g. "Packaged app contains
>        `PrivacyInfo.xcprivacy` declaring exactly the data categories listed
>        below, and ASC App Privacy questionnaire matches"}
>      - TC-7 (cross-cutting accessibility): {e.g. "Every primary user flow
>        completable via VoiceOver alone, verified by `XCAccessibilityAudit` +
>        manual-qa walk"}
>
>      Aim for 6-15 criteria. Each is verifiable against a TestFlight build or
>      an XCTest spec. If you can't write a TC for an ADR, the ADR may not be
>      load-bearing — reconsider it. -->
>
> ## 14. Implementation Plan
> <!-- Ordered list of work packages — thin vertical slices.
>
>      ### Phase 1: Walking Skeleton — Foundation
>      The iOS walking skeleton is concrete:
>      1. Xcode project scaffolded (App target + Core package + Features/Welcome package) — S
>      2. App launches, primary tab opens, a "Hello" SwiftUI view renders — S
>      3. Repository roundtrip: a dummy `HealthCheckRepository` returns `{ status: ok, version }`; ViewModel calls it; View renders the version — S
>      4. Persistence: write a single user-typed value to SwiftData (or Core Data), restart, read it back on next launch — M
>      5. Signing: cert + provisioning profile via fastlane match; first archive succeeds — M
>      6. TestFlight: first build uploaded to internal testers; installable on a real iPhone — M
>      7. PrivacyInfo.xcprivacy committed; ATS posture set; entitlements file matches capabilities — S
>      **Delivers:** a real TestFlight-installable app that opens, persists data, and is on the path to App Store submission. This is the architecture proven in software, not in a doc.
>
>      ### Phase 2: {Core Feature Name} — Core Flow
>      1. ...
>      **Delivers:** {what the user can now do}
>
>      ### Phase 3+: ... -->
>
> ## 15. Open Questions
> <!-- Technical unknowns that need investigation before or during implementation.
>      E.g., "Confirm SwiftData CloudKit option works on iOS 17.4+ for our schema shape — needs a spike."
>      "Verify match cert sync works on our self-hosted Git CI runner — needs a spike."
>      "Validate App Tracking Transparency wording with privacy counsel — needs client input." -->
>
> ## 16. Risks
> <!-- Pre-mortem: what could go wrong technically?
>      iOS-specific risks worth surfacing:
>      - Apple Developer Program enrollment delayed (D-U-N-S for orgs takes weeks)
>      - PrivacyInfo.xcprivacy audit fails at submission
>      - CloudKit schema drift between development and production (must promote schema explicitly)
>      - Universal Links domain verification fails (apple-app-site-association misconfigured)
>      - Sign in with Apple required by reviewer for a feature we didn't anticipate
>      - Swift 6 strict concurrency conformance for a third-party SDK we depend on
>      For each: likelihood, impact, mitigation. -->
> ```
>
> **Rules:**
> - Every tech choice must have a one-line "why." No unjustified decisions.
> - Default to boring technology — SwiftUI, MVVM, SwiftData (iOS 17+) / Core Data (iOS 16), URLSession + async/await, Swift 6 strict concurrency, fastlane match, XCTest + XCUITest. Use innovation tokens only where they create real value.
> - Start with the simplest architecture that works (Gall's Law). Note where it should evolve (e.g. "single target now; revisit SPM packages when builds exceed 30s incremental").
> - The implementation plan is in thin vertical slices — Phase 1 is the walking skeleton (TestFlight-installable signed app).
> - Create Excalidraw diagrams for sections 3 and 4. Call `read_me` first.
> - Reference the product vision and prototype throughout — the design serves the product, not the other way around.
> - This is a **native iOS application**. If something in the vision implies pure web SaaS, cross-platform desktop, Android, embedded, blockchain, CLI, or generic library work, flag it instead of designing it.
> - `try!` / `as!` / force-unwrap in production is forbidden — hook-enforced.
> - SwiftUI / UIKit imports in ViewModels are forbidden — hook-enforced.
> - URLSession / persistence calls in Views are forbidden — hook-enforced.
> - Tokens in UserDefaults are forbidden — must use Keychain.
> - `PrivacyInfo.xcprivacy` is required for App Store submission.

## Step 3: Review the design

When architect returns the document, read it yourself (as CEO). Check:
- Does the design serve the product vision? Or did the architect over-engineer (e.g. TCA + Tuist + Swinject before the walking skeleton)?
- Are the ADRs justified? Or is this resume-driven development?
- Is the walking skeleton truly a TestFlight-installable signed app? That's the bar.
- Are the security red lines explicit (Keychain, Data Protection, ATS, PrivacyInfo.xcprivacy, ATT, Sign in with Apple)?
- Does ADR-1 (architecture) match the product complexity? MVVM is the default; only complex state machines need TCA.
- Does ADR-5 (sync) match the product needs? Local-only is fine for many apps.
- Is the implementation plan in achievable slices?
- Are there any risks the architect missed that you know about from the client conversation?

If something is off, send architect back with specific feedback.

## Step 4: Update the CEO brain

Once the design is approved, update `.claude/ceo-brain.md`:
- Update "Current State" — design approved, moving to packaging plan + data schema + test plan
- Update "Strategic Priorities" — first implementation phase (walking skeleton)
- Add to "Key Decisions Log" — design approved, key ADRs summarized
- Update "Architecture Overview" — one-paragraph summary (pattern, modules, persistence, sync, concurrency posture)

## Step 5: Update CLAUDE.md

Fill in the `TBD` sections in `CLAUDE.md` Project Context:
- **Overview** — from system design overview
- **Supported Devices & iOS Version** — from ADR-4 / product vision
- **Tech Stack** — from ADRs (Swift version, architecture pattern, persistence engine, sync, fastlane)
- **Project Structure** — module layout
- **Commands** — fill what's known (`xcodebuild build / test`, `fastlane beta`, `fastlane release`), leave rest TBD
- **Coding Conventions** — MVVM separation (hook-enforced), Swift 6 strict, Keychain for secrets, semantic Dynamic Type, asset-catalog colors

## Step 6: Present to the client

Give the client a brief executive summary:
- What architecture pattern was chosen and why
- What persistence + sync strategy and why
- The walking skeleton — what it delivers (TestFlight-installable signed app)
- Timeline implication — how many phases, what each delivers
- Any open questions that need the client's input (especially Apple Developer Program enrollment, ASC banking, Universal Links domain)

Ask: "This is the technical plan. Any concerns before we start building?"

Wait for approval before proceeding to implementation.
