---
name: common-ios-app-tester-plan
description: Tester drafts a test strategy for an iOS app from the system design — pyramid shape, framework picks (XCTest for unit + integration; XCUITest end-to-end against a pinned simulator; `swift-snapshot-testing` for stable views in light + dark + Dynamic Type baselines; in-memory `ModelContainer` / `NSPersistentContainer(NSInMemoryStoreType)`), per-test state isolation via launchArgument-driven Debug reset, simulator pinning in test plans (device + iOS version), `XCAccessibilityAudit` for automated accessibility gates, coverage map per task, Definition of Done. Use after system design and task breakdown are approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--update to revise existing test plan]"
---

# iOS Test Plan — Test Strategy from System Design

You are the CEO. The system design and task breakdown are ready. Before anyone writes Swift, you need a test strategy — the **tester** defines HOW the iOS app will be tested, WHAT tools to use, and WHERE each type of test lives.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — architecture, repository contracts, capabilities, privacy posture
- `.claude/tasks/` — task files (one per task) with acceptance criteria
- `.claude/product-vision.md` — user flows
- `.claude/data-schema.md` — schema (informs persistence-isolation strategy)

Also detect the existing stack so framework picks aren't theoretical:
- `Package.swift` / `Podfile` (look for `XCTest`, `swift-snapshot-testing`, `Quick`/`Nimble`, `ViewInspector`, custom test infrastructure)
- Test plans (`*.xctestplan`) committed

If `$ARGUMENTS` contains `--update`, read `.claude/test-plan.md` and revise.

## Step 2: Brief the tester

Send **tester** with this brief:

> Read these files:
> - `.claude/system-design.md` — architecture, repository contracts (every protocol is a contract to test), capabilities, privacy posture
> - `.claude/tasks/` — every task and its acceptance criteria
> - `.claude/product-vision.md` — core user flows (these become the XCUITest spec list)
> - `.claude/data-schema.md` — schema (informs per-test isolation strategy)
> - `Package.swift` / `Podfile` — what's already installed
>
> Produce a test strategy for this **native iOS application**. Save it as `.claude/test-plan.md`.
>
> **Default framework picks (override only if the project already uses something else):**
> - **Unit + integration**: **XCTest**. Swift Testing (Apple's newer framework introduced WWDC 2024) for greenfield projects when the team agrees and the minimum iOS supports it (iOS 17+).
> - **ViewModel tests**: instantiate the ViewModel, inject stubbed dependencies, drive via public methods, assert published state. Plain XCTest in the unit test target.
> - **Repository tests**: real persistence engine, in-memory. SwiftData: `ModelConfiguration(isStoredInMemoryOnly: true)`. Core Data: `NSInMemoryStoreType`. GRDB: in-memory `DatabaseQueue`.
> - **Network tests**: `URLProtocol`-based stub registered on a custom `URLSessionConfiguration`. Real `URLSession`, fake network.
> - **Snapshot tests**: **`pointfreeco/swift-snapshot-testing`**. Baselines per device class (iPhone, iPad) and per appearance (light, dark) and per Dynamic Type bucket where the layout differs.
> - **XCUITest**: **XCTest UI Testing target** against a **pinned simulator** (device + iOS version explicit in the test plan). Launch with `app.launchArguments.append("--uitesting-reset-state")` and a Debug-only entry point that performs the state reset.
> - **Accessibility**: **`XCAccessibilityAudit`** (Xcode 15+) inside the XCUITest target catches WCAG-violation-style issues automatically.
> - **Determinism**: pinned device + iOS version in the test plan; `TZ=UTC`, `LANG=en_US.UTF-8` env in CI; clock + RNG injectable; `URLProtocol` stubs for all network in unit/integration tests.
> - **Per-test isolation**: each XCUITest sends `--uitesting-reset-state` so the Debug entry point wipes `Documents/`, `Application Support/`, `Caches/`, Keychain items for this app.
>
> The document MUST follow this structure:
>
> ````markdown
> # Test Strategy
> > Version {N} — {date}
>
> ## 1. Testing Philosophy
> <!-- For THIS iOS app:
>      - QA verification approach: tests written alongside / after implementation; developer owns each task's tests
>      - Pyramid shape: many ViewModel + repository unit; fewer snapshot; fewer still XCUITest
>      - Target distribution (e.g., 70% unit / 20% snapshot / 10% XCUITest)
>      - Classicist (real objects with in-memory stores) or mockist? Why for this project? -->
>
> ## 2. Test Frameworks & Tools
>
> | Layer | Framework | Runner | Why this project |
> |-------|-----------|--------|------------------|
> | ViewModel unit | XCTest | `xcodebuild test` | Mock the repository protocol; assert published state |
> | Repository integration | XCTest with in-memory store | `xcodebuild test` | Real SwiftData / Core Data; fast (no disk) |
> | Network unit | XCTest + URLProtocol stub | `xcodebuild test` | Real URLSession; fake network |
> | Snapshot | swift-snapshot-testing | `xcodebuild test` | Per-device, per-appearance, per-Dynamic-Type baselines |
> | XCUITest | XCTest UI Testing target | `xcodebuild test` | Pinned simulator; launchArguments-driven reset |
> | Accessibility audit | XCAccessibilityAudit (Xcode 15+) | inside XCUITest | Automated WCAG checks |
> | Static | Swift strict concurrency, SwiftLint | per-PR | Cheapest test there is |
>
> ### Test Doubles Strategy
> - **Default to real objects** for ViewModels + repositories + domain logic (classicist). Use doubles at the protocol boundary.
> - **Repository protocols**: stub with a fixture (`StubDocumentsRepository(documents: [...])`).
> - **Persistence**: real engine, in-memory store. Tests are realistic and fast.
> - **Network**: `URLProtocol` subclass registered on a test `URLSessionConfiguration`. Real `URLSession`, deterministic responses.
> - **Keychain in tests**: a `KeychainStore` protocol; in tests, inject `InMemoryKeychainStore`. (Real Keychain in tests is slow and pollutes the simulator's Keychain across runs.)
> - **Date / UUID / RNG**: injected via a `Clock` protocol, a `UUIDFactory` protocol. Tests pin them.
> - **Sign in with Apple in XCUITest**: stubbed at the auth client protocol; UI tests verify the post-sign-in state, not the actual ASAuthorizationController dance.
>
> ### Determinism Rules (non-negotiable)
> - Pinned device + iOS version in the test plan.
> - `TZ=UTC` and `LANG=en_US.UTF-8` env in CI.
> - Clock injected; tests use `TestClock`. Never assert on `Date()` directly.
> - RNG seeded or injected.
> - All network in unit / integration tests via `URLProtocol` stub. No real network in CI tests.
> - Animations disabled in XCUITest via `--uitesting-disable-animations` launchArgument + a Debug-only `UIView.setAnimationsEnabled(false)`.
> - Async UI waits: XCTest `expectation(for: NSPredicate)` + `await fulfillment(of: [expectation])`, or Combine `awaitValue`. Never `Thread.sleep`.
>
> ### Per-Test Isolation
> - **XCUITest:** `app.launchArguments.append("--uitesting-reset-state")` triggers a Debug-only entry point that:
>   - deletes `Documents/`, `Application Support/`, `Caches/`
>   - clears Keychain items for this app
>   - resets `UserDefaults` (`UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)`)
> - **Unit/integration tests**: each test owns its `ModelContainer` / `NSPersistentContainer` instance via a fresh `setUp()`.
> - **`URLProtocol` stubs**: registered + unregistered per test class.
>
> ### CI Integration
> - **PR**: type-check + SwiftLint + XCTest unit + integration + snapshot — target <5 min.
> - **Merge to main**: + XCUITest on pinned simulator + accessibility audit.
> - **Pinned simulator(s)**: iPhone 15 on iOS 17.5 (primary); add iPad Pro 11" on iOS 17.5 if iPad is supported.
> - **Xcode pinned** via `xcode-select` in CI.
> - **Caching**: Xcode DerivedData cached by hash of `Package.resolved` + `project.pbxproj`.
> - **Flake quarantine**: fail loud; never auto-retry without an issue link.
>
> ## 3. Testing Pyramid for This Project
>
> ### Unit (many, fast)
>
> **ViewModels, domain logic, repositories, formatters, validators, network clients.**
>
> ```swift
> import XCTest
> @testable import Features_Documents
>
> final class DocumentsViewModelTests: XCTestCase {
>     func testLoadSurfacesError() async {
>         let repo = StubDocumentsRepository(error: AppError.offline)
>         let vm = DocumentsViewModel(repository: repo)
>         await vm.load()
>         XCTAssertEqual(vm.error, .offline)
>         XCTAssertTrue(vm.documents.isEmpty)
>     }
> }
> ```
>
> List specific modules / components and what to test:
> <!-- - "DocumentsRepository — fetchAll returns documents sorted by updatedAt; save round-trips with retrieved id; delete removes the row"
>      - "DocumentsViewModel — load surfaces error, refresh restores documents, save dismisses sheet"
>      - "AuthClient — Sign in with Apple success stores token in Keychain; signOut clears it"
>      - "URLProtocolStub network tests for APIClient.fetchDocuments" -->
>
> ### Integration (some, medium)
>
> **Repository + real persistence engine, in-memory.**
>
> ```swift
> func makeInMemoryContainer() throws -> ModelContainer {
>     let config = ModelConfiguration(isStoredInMemoryOnly: true)
>     return try ModelContainer(for: Schema([Document.self]), configurations: config)
> }
>
> func testSavePersistsAcrossFetches() async throws {
>     let container = try makeInMemoryContainer()
>     let repo = SwiftDataDocumentsRepository(context: container.mainContext)
>     let doc = Document(title: "Test")
>     try await repo.save(doc)
>     let fetched = try await repo.fetchAll()
>     XCTAssertEqual(fetched.first?.title, "Test")
> }
> ```
>
> ### Snapshot (some, medium)
>
> **Stable views, stable configurations.**
>
> ```swift
> func testDocumentsListEmpty() throws {
>     let view = DocumentsListView(viewModel: .init(repository: StubDocumentsRepository(documents: [])))
>     assertSnapshot(of: view, as: .image(layout: .device(config: .iPhone15Pro)))
>     assertSnapshot(of: view, as: .image(layout: .device(config: .iPhone15Pro), traits: .init(userInterfaceStyle: .dark)))
>     assertSnapshot(of: view, as: .image(layout: .device(config: .iPhone15Pro), traits: .init(preferredContentSizeCategory: .accessibilityExtraExtraLarge)))
> }
> ```
>
> Per-device, per-appearance, per-Dynamic-Type baselines for stable screens. Re-record deliberately.
>
> ### XCUITest (few, slow — pinned simulator)
>
> **Real bundle, real launch, real navigation, real persistence.**
>
> List specific golden paths:
> <!-- - "Flow 1: Cold launch → Documents tab shows → tap + → enter title → tap Create → row appears in list. Relaunch → row still there. Verifies TC-1, TC-2."
>      - "Flow 2: Sign in with Apple stub → signed-in state → sign out → signed-out state. Verifies TC-X."
>      - "Flow 3: Receive Universal Link → cold-start → target document loaded with target data. Verifies TC-3."
>      - "Flow 4: Toggle dark mode → primary screens render correctly. Verifies TC-Y." -->
>
> Keep this list SHORT (5-15 specs typical for an MVP).
>
> ### Accessibility
> <!-- - `XCAccessibilityAudit` inside the XCUITest for every primary screen — catches axe-equivalent issues automatically
>      - Manual VoiceOver walks during milestone reviews by manual-qa — for the 70% audits miss
>      - Fail on serious / critical violations -->
>
> ### Out of scope for automated tests (manual-qa territory)
> - VoiceOver pacing and natural-language quality
> - Voice Control reachability
> - Switch Control / Full Keyboard Access walks
> - Device-only behavior: push notifications, biometric Keychain prompts, low-power throttling
> - First-run trust prompts on first install from TestFlight
> - Cross-device CloudKit sync (real iCloud accounts required)
>
> ## 4. Test Coverage Map
>
> | Task | ViewModel | Repository | Network | Snapshot | XCUITest | a11y |
> |------|-----------|-----------|---------|----------|----------|------|
> | TASK-001 (setup) | — | — | — | — | — | — |
> | TASK-002 (Welcome) | WelcomeViewModelTests | HealthCheckRepositoryTests | — | WelcomeViewSnapshotTests | smoke-launch | — |
> | TASK-005 (Documents list) | DocumentsViewModelTests | SwiftDataDocumentsRepositoryTests | — | DocumentsListViewSnapshotTests | save-restart-restore | XCAccessibilityAudit |
> | TASK-008 (Sign in with Apple) | AuthViewModelTests | KeychainStoreTests | — | — | sign-in-out flow | — |
> | ... | ... | ... | ... | ... | ... | ... |
>
> ## 5. Test Design Techniques by Area
>
> | Area | Techniques | Why |
> |------|-----------|-----|
> | API decode | Equivalence partitioning, boundary values, error guessing | Many JSON shapes with clear edges |
> | Schema migrations | Decision tables, error guessing | VersionedSchema paths interact; high blast radius |
> | Auth state machine | State transitions | Signed-out → signing-in → signed-in → token-expiring → refreshing → signed-in / signed-out |
> | CloudKit sync (if applicable) | Pairwise testing, error guessing | Signed-in/out × network on/off × write count |
> | File IO | Boundary values, error guessing | Permission errors, low-storage, traversal |
> | SwiftUI Views | Snapshot per appearance + Dynamic Type | Catches layout breaks under accessibility settings |
>
> ## 6. Test File Conventions
>
> ```
> MyApp/
>   Features/
>     Documents/
>       Sources/
>         DocumentsViewModel.swift
>         DocumentsListView.swift
>         DocumentsRepository.swift
>       Tests/
>         DocumentsViewModelTests.swift        ← unit
>         DocumentsRepositoryTests.swift       ← integration (in-memory store)
>         DocumentsListViewSnapshotTests.swift ← snapshot (light + dark + Dynamic Type)
>   Core/
>     Networking/
>       Sources/APIClient.swift
>       Tests/APIClientTests.swift             ← URLProtocol-based
>   UITests/
>     SaveFlowUITests.swift                    ← XCUITest end-to-end
>     UniversalLinkColdStartUITests.swift
>   Tests/
>     Helpers/
>       InMemoryContainer.swift
>       URLProtocolStub.swift
>       StubRepositories/
>         StubDocumentsRepository.swift
>     Factories/
>       Document.factory.swift
> ```
>
> Naming: `{Type}Tests.swift` for XCTest unit/integration; `{View}SnapshotTests.swift` for snapshots; `{Flow}UITests.swift` for XCUITest.
> Pattern: Arrange/Act/Assert. Accessibility queries (`app.buttons["Save"]`) by accessibilityLabel first; identifier only when nothing else works.
>
> ## 7. Definition of Done (Testing)
>
> Applies to EVERY task:
> - [ ] All unit + integration + snapshot tests pass on PR
> - [ ] No flaky tests introduced (run the suite 3× locally if in doubt)
> - [ ] No skipped/disabled tests, no `.disabled`, no `fdescribe`
> - [ ] Acceptance criteria each map to at least one assertion
> - [ ] Regression suite green
> - [ ] Type-check + SwiftLint pass on test files
> - [ ] No real network calls in unit / integration tests
> - [ ] No real clock / RNG dependence in any test
> - [ ] Per-test isolation respected — no test relies on another test's state
> - [ ] If snapshot tests added, baselines reviewed for correctness (not just "make CI green")
>
> ## 8. Adversarial Testing Checklist
>
> For every task, the tester also considers:
> - [ ] Decoded JSON: missing optional field, extra field, wrong type, null, empty string, unicode, emoji
> - [ ] Boundary values (0, 1, MAX-1, MAX, MAX+1)
> - [ ] Wrong types at the API boundary — decoder must reject with a typed error
> - [ ] Keychain: item exists vs missing vs duplicate; access denied (biometric)
> - [ ] Repository: concurrent writes; signed-out CloudKit mid-sync; full storage
> - [ ] Auth: expired token, refresh-token race, signed-out iCloud
> - [ ] UI: Dynamic Type at AccessibilityExtraExtraLarge, VoiceOver enabled, dark + Increase Contrast, RTL locale, landscape lock on iPad
> - [ ] Background-foreground: backgrounded mid-network-call; foregrounded with push deep-link
> - [ ] Schema migration: store at version N+1 (newer) → refuse to open; store at version N-1 → migrate
> - [ ] Universal Link: cold-start vs warm-start; malformed link → safe error UI
>
> ## 9. Risks
> <!-- Testing-specific risks for THIS iOS app:
>      - Snapshot tests are device-pinned; bumping simulator runtime can require re-recording baselines (expected, deliberate)
>      - CloudKit XCUITest impossible on hosted CI without a real iCloud account — gate behind XCTSkipUnless and accept manual QA coverage
>      - Sign in with Apple in XCUITest is stubbed; real Sign in with Apple verified by manual-qa on a TestFlight build
>      - Swift Testing (newer framework) gaps for XCUITest — keep XCUITest on XCTest -->
> ````
>
> **Rules:**
> - Every choice must be justified for THIS iOS app.
> - Coverage map must account for every task in `.claude/tasks/`.
> - XCUITest runs against a **pinned simulator** (device + iOS version).
> - Per-test state isolation is non-negotiable — leaks make tests order-dependent and impossible to debug.
> - Snapshot baselines reviewed deliberately — never re-record just to make CI green.
> - This is a **native iOS app**. If the brief points elsewhere (web SaaS, cross-platform desktop, Android, embedded, CLI), refuse and tell the CEO.

## Step 3: Review

Read the test plan. Check:
- Pyramid shape fits the architecture (heavy ViewModel layer → more unit tests; heavy repository / sync → more integration tests; UI-heavy → more snapshot tests).
- Framework picks match what's already installed, or are justified replacements.
- Every task is covered in the coverage map.
- XCUITest runs against a pinned simulator (not floating).
- Per-test isolation strategy is concrete (launchArgument-driven Debug reset for XCUITest; fresh container per integration test).
- Snapshot tests include light + dark + (where relevant) AccessibilityExtraExtraLarge.
- Determinism rules cover clock, RNG, TZ, animations.
- Definition of Done is achievable on every PR.

If issues, send tester back with specific feedback.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Current State" → test strategy defined, ready to start development
- "Key Decisions Log" → test plan approved: XCTest unit + integration (in-memory stores) + swift-snapshot-testing + XCUITest on pinned simulator, accessibility audit via XCAccessibilityAudit

## Step 5: Present to client

Brief summary:
- "Here's how we'll ensure quality: pyramid shape — many ViewModel + repository unit tests, fewer snapshot tests for stable screens, fewer still XCUITest for golden user paths."
- "Frameworks: XCTest + swift-snapshot-testing + XCUITest on a pinned iPhone 15 (iOS 17.5) simulator."
- "Accessibility: XCAccessibilityAudit catches automated issues; manual-qa does VoiceOver walks at milestone reviews."
- "Critical paths covered by XCUITest: {list, 5–15 items}."

Ask: "Any concerns? Ready to start building?"
