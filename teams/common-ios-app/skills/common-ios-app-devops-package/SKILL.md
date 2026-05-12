---
name: common-ios-app-devops-package
description: DevOps sets up the full iOS packaging + release pipeline — Xcode project / `.xcconfig` settings (deployment target, Swift version, strict concurrency, build configurations), code signing (Apple Developer Program enrollment guidance, certificates, provisioning profiles, fastlane match), fastlane lanes (`gym` builds, `pilot` for TestFlight, `deliver` for App Store metadata + screenshots, `match` for cert sync), capabilities + entitlements file, `PrivacyInfo.xcprivacy`, all `NSUsageDescription` purpose strings, App Tracking Transparency wiring (if needed), Sign in with Apple capability (if needed), GitHub Actions macOS matrix with Xcode pinned, App Store Connect metadata as code via `fastlane/metadata/`. Produces `.claude/packaging-plan.md` plus per-action handoff guides under `.claude/handoff/`. Use after system design is approved, before or during sprint.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--update to revise existing plan] [--handoff to generate client guides only]"
---

# iOS Package & Ship — Packaging, Signing, TestFlight, App Store

You are the CEO. The system design is approved. Now the **devops** engineer sets up everything needed to produce a signed, App-Store-Connect-uploadable build.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/system-design.md` — ADR-7 (security & privacy posture), ADR-8 (bundle identifier & capabilities), ADR-2 (modularization)
- `.claude/product-vision.md` — supported devices, distribution + monetization, required iOS integrations
- `.claude/tasks/_overview.md` — to understand what's being built
- `.claude/ceo-brain.md` — constraints, timeline, Apple Developer Program status

If `$ARGUMENTS` contains `--update`, read `.claude/packaging-plan.md` and revise.
If `$ARGUMENTS` contains `--handoff`, skip to Step 4 (generate client guides only).

## Step 2: Brief the DevOps engineer

Send **devops** with this brief:

> Read these files:
> - `.claude/system-design.md` — ADR-7 (privacy posture, including `PrivacyInfo.xcprivacy` data categories + required-reason API codes, ATT, Sign in with Apple), ADR-8 (bundle identifier + capabilities)
> - `.claude/product-vision.md` — supported devices (iPhone-only / iPad universal), minimum iOS version, monetization (free / IAP / subscription), required integrations (push, widgets, Siri, share extension, Universal Links)
> - `.claude/ceo-brain.md` — constraints, Apple Developer Program enrollment status
> - `.claude/tasks/_overview.md` — what features are being built
>
> Create a complete packaging plan. Save it as `.claude/packaging-plan.md`.
>
> The document MUST follow this structure:
>
> ````markdown
> # Packaging Plan
> > Version {N} — {date}
> > Based on system design v{N}
>
> ## 1. Project Configuration
>
> ### Build Configurations + xcconfig
> ```
> Config/Shared.xcconfig
>   SWIFT_VERSION = 6.0
>   IPHONEOS_DEPLOYMENT_TARGET = {17.0 | 16.0}
>   SWIFT_STRICT_CONCURRENCY = complete
>   ENABLE_USER_SCRIPT_SANDBOXING = YES
>   PRODUCT_BUNDLE_IDENTIFIER = com.{org}.{app}
>
> Config/Debug.xcconfig (#include Shared)
>   SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG
>   GCC_OPTIMIZATION_LEVEL = 0
>   API_BASE_URL = https://api-dev.{org}.com
>
> Config/Release.xcconfig (#include Shared)
>   SWIFT_ACTIVE_COMPILATION_CONDITIONS =
>   GCC_OPTIMIZATION_LEVEL = s
>   SWIFT_OPTIMIZATION_LEVEL = -O
>   API_BASE_URL = https://api.{org}.com
> ```
>
> ### Bundle Identifier Layout
>
> | Target | Bundle ID |
> |--------|-----------|
> | App | `com.{org}.{app}` |
> | Widget Extension (if any) | `com.{org}.{app}.widget` |
> | Share Extension (if any) | `com.{org}.{app}.share` |
> | Intents Extension (if any) | `com.{org}.{app}.intents` |
> | Watch App (if any) | `com.{org}.{app}.watch` |
>
> ### App Group (if data shared between app + extensions)
> `group.{org}.{app}` — shared `Application Support/` + `UserDefaults` suite.
>
> ## 2. Apple Developer Program
>
> - **Account type:** {individual ($99/yr) | organization ($99/yr + D-U-N-S registration ~3-week lead time)}
> - **Team ID:** {value or PENDING handoff}
> - **App Bundle ID registered:** {YES with date | PENDING}
> - **Capabilities registered:** {list — Push, Sign in with Apple, Associated Domains, CloudKit, App Groups, HealthKit, In-App Purchase, Family Controls, ...}
>
> If PENDING, see `.claude/handoff/apple-developer-enrollment.md`.
>
> ## 3. Code Signing Strategy
>
> ### Method
> **{Automatic signing in Xcode (solo) | fastlane match (teams)}** — {one-paragraph why}
>
> ### fastlane match (teams)
> - Match Git repo: `git@github.com:{org}/ios-certs.git` (encrypted)
> - Storage mode: `git`
> - App identifiers: `[com.{org}.{app}, com.{org}.{app}.widget, ...]`
> - Types: `development`, `appstore` (and `adhoc` only if needed for internal testing outside TestFlight)
> - Authentication: App Store Connect API key (long-lived; avoids 2FA in CI)
>
> ## 4. Capabilities & Entitlements
>
> Each capability flips an entry in `MyApp.entitlements` and requires:
> 1. Xcode "Signing & Capabilities" tab adds the entitlement.
> 2. Developer portal App ID enables the capability.
> 3. fastlane match regenerates the provisioning profile.
> 4. Build picks up the new profile.
>
> | Capability | Why | Entitlement | Status |
> |------------|-----|-------------|--------|
> | Push notifications | Reminders feature | `aps-environment` (development / production) | PENDING / DONE |
> | Sign in with Apple | Required (third-party social login present) OR primary identity | `com.apple.developer.applesignin` | PENDING / DONE |
> | Associated Domains | Universal Links (`applinks:{domain}`) | `com.apple.developer.associated-domains` | PENDING / DONE |
> | CloudKit | Cross-device sync | `com.apple.developer.icloud-container-identifiers` + `com.apple.developer.icloud-services` | PENDING / DONE |
> | App Groups | Share data with widget / extension | `com.apple.security.application-groups` | PENDING / DONE |
> | HealthKit | (if applicable) | `com.apple.developer.healthkit` + access types | PENDING / DONE |
> | In-App Purchase | (if applicable) | (configured in App Store Connect) | PENDING / DONE |
>
> ## 5. Info.plist & Purpose Strings
>
> Every privacy-sensitive capability needs an `NSUsageDescription`. Each is honest, app-specific, in the user's language.
>
> | Key | Why | String (initial draft — refine before submission) |
> |-----|-----|--------------------------------------------------|
> | `NSCameraUsageDescription` | Capture documents | "{App} uses the camera to scan documents you add to your library." |
> | `NSPhotoLibraryUsageDescription` | Import images | "{App} accesses your photos to import images into documents." |
> | `NSPhotoLibraryAddUsageDescription` | Save exports | "{App} can save exported documents to your photo library." |
> | `NSLocationWhenInUseUsageDescription` | (if applicable) | "{App} uses your location to tag documents with where they were captured." |
> | `NSContactsUsageDescription` | (if applicable) | "{App} uses your contacts to share documents." |
> | `NSMotionUsageDescription` | (if applicable) | "{App} uses motion to detect orientation." |
> | `NSUserTrackingUsageDescription` | ATT prompt (if cross-app tracking) | "{App} uses your activity to personalize content across apps and websites." |
> | ... | | |
>
> ## 6. PrivacyInfo.xcprivacy
>
> ```xml
> <dict>
>   <key>NSPrivacyAccessedAPITypes</key>
>   <array>
>     <dict>
>       <key>NSPrivacyAccessedAPIType</key>
>       <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
>       <key>NSPrivacyAccessedAPITypeReasons</key>
>       <array><string>C617.1</string></array>
>     </dict>
>     <dict>
>       <key>NSPrivacyAccessedAPIType</key>
>       <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
>       <key>NSPrivacyAccessedAPITypeReasons</key>
>       <array><string>CA92.1</string></array>
>     </dict>
>     <!-- list every required-reason API actually used + the chosen reason codes -->
>   </array>
>   <key>NSPrivacyTracking</key><{true | false}/>
>   <key>NSPrivacyTrackingDomains</key>
>   <array>
>     <!-- list domains used for cross-app tracking; empty array if no tracking -->
>   </array>
>   <key>NSPrivacyCollectedDataTypes</key>
>   <array>
>     <!-- each data category collected: type, linked yes/no, tracking yes/no, purposes -->
>   </array>
> </dict>
> ```
>
> Cross-reference: this file must match the ASC App Privacy questionnaire exactly. Falsifying either gets the app pulled.
>
> ## 7. App Tracking Transparency (if applicable)
>
> If the app or any SDK does cross-app tracking:
> 1. `NSUserTrackingUsageDescription` set in Info.plist with honest copy.
> 2. `ATTrackingManager.requestTrackingAuthorization { status in ... }` called BEFORE any tracking SDK starts (typically right after onboarding).
> 3. SDKs configured to respect the result.
> 4. ASC App Privacy "Used for Tracking" matches runtime behavior.
>
> If NOT applicable (no cross-app tracking): no `NSUserTrackingUsageDescription`, no ATT call. ASC questionnaire reports "Not used for tracking."
>
> ## 8. Sign in with Apple (if applicable)
>
> Required by App Review when any third-party social login (Google, Facebook, …) is offered. Implemented via `AuthenticationServices.ASAuthorizationAppleIDProvider`.
>
> Button: `SignInWithAppleButton` (SwiftUI; iOS 14+).
>
> ## 9. fastlane Setup
>
> ```ruby
> # fastlane/Fastfile
> default_platform(:ios)
>
> platform :ios do
>   desc "Sync signing certificates and profiles via match"
>   lane :certificates do
>     match(type: "development", readonly: is_ci)
>     match(type: "appstore",   readonly: is_ci)
>   end
>
>   desc "Build + upload to TestFlight (internal testers)"
>   lane :beta do
>     setup_ci if is_ci
>     certificates
>     build_app(
>       scheme: "MyApp",
>       configuration: "Release",
>       export_method: "app-store",
>       output_directory: "build/"
>     )
>     upload_to_testflight(
>       skip_submission: true,
>       skip_waiting_for_build_processing: true,
>       groups: ["Internal"]
>     )
>   end
>
>   desc "Submit a TestFlight build to external testers"
>   lane :beta_external do |options|
>     upload_to_testflight(
>       build_number: options[:build_number],
>       distribute_external: true,
>       groups: ["Public Beta"],
>       notify_external_testers: true,
>       changelog: options[:changelog]
>     )
>   end
>
>   desc "Submit to App Store Review"
>   lane :release do
>     deliver(
>       submit_for_review: true,
>       automatic_release: false,           # release manually after approval
>       force: true,
>       skip_screenshots: false,
>       skip_metadata: false
>     )
>   end
> end
> ```
>
> ```ruby
> # fastlane/Appfile
> app_identifier("com.{org}.{app}")
> apple_id("ci@{org}.com")
> team_id("XXXXXXXXXX")
> ```
>
> ```ruby
> # fastlane/Matchfile
> git_url("git@github.com:{org}/ios-certs.git")
> storage_mode("git")
> type("appstore")
> app_identifier(["com.{org}.{app}", "com.{org}.{app}.widget"])
> ```
>
> ## 10. CI Configuration (GitHub Actions)
>
> ```yaml
> # .github/workflows/release.yml
> name: Release
> on:
>   push:
>     tags: ['v*']
>
> jobs:
>   build:
>     runs-on: macos-14
>     env:
>       XCODE_VERSION: '16.0'
>     steps:
>       - uses: actions/checkout@v4
>       - name: Select Xcode
>         run: sudo xcode-select -s "/Applications/Xcode_${{ env.XCODE_VERSION }}.app"
>       - name: Cache derived data
>         uses: actions/cache@v4
>         with:
>           path: ~/Library/Developer/Xcode/DerivedData
>           key: derived-${{ runner.os }}-${{ hashFiles('**/Package.resolved', '**/project.pbxproj') }}
>       - name: Run tests
>         run: |
>           xcodebuild test \
>             -scheme MyApp \
>             -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.5' \
>             -resultBundlePath TestResults.xcresult \
>             CODE_SIGNING_ALLOWED=NO
>       - name: Setup ASC API key
>         env:
>           ASC_API_KEY_BASE64: ${{ secrets.ASC_API_KEY_BASE64 }}
>         run: echo "$ASC_API_KEY_BASE64" | base64 -d > AuthKey.p8
>       - name: Build + upload to TestFlight
>         env:
>           MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
>           ASC_API_KEY_ID: ${{ secrets.ASC_API_KEY_ID }}
>           ASC_API_KEY_ISSUER_ID: ${{ secrets.ASC_API_KEY_ISSUER_ID }}
>         run: bundle exec fastlane beta
> ```
>
> Pin Xcode via `xcode-select`. macOS runners ship with multiple Xcode versions; floating defaults break builds without warning.
>
> ## 11. TestFlight Strategy
>
> | Ring | Audience | Cadence | Review needed |
> |------|----------|---------|---------------|
> | Internal | Up to 100 ASC users on the team | Every merge to `main` | No |
> | External Public Beta | Up to 10,000 testers via invite or public link | Every release candidate | Yes — first build per version (~24h) |
> | External Closed Beta | Specific groups (customer beta, partner beta) | Per-feature | Yes — first build per version |
>
> Build number bumped monotonically (via `agvtool` or `fastlane increment_build_number`). No build number is ever reused.
>
> ## 12. App Store Connect Metadata
>
> Owned in `fastlane/metadata/` — committed to Git, reviewed via PR, synced via `fastlane deliver`.
>
> ```
> fastlane/
>   metadata/
>     en-US/
>       name.txt
>       subtitle.txt
>       description.txt
>       keywords.txt
>       support_url.txt
>       marketing_url.txt
>       privacy_url.txt
>       release_notes.txt
>     {other locales}/
>   screenshots/
>     en-US/
>       6.7-iPhone-1.png
>       6.7-iPhone-2.png
>       ...
>       12.9-iPad-1.png
>       ...
>     {other locales}/
> ```
>
> Screenshots generated via `fastlane snapshot` (Apple's UI testing-driven screenshot tool) for repeatability.
>
> ## 13. Phased Release
>
> Enable on the first App Store submission. New version rolls out to 1% on day 1, expanding daily over 7 days. If a critical bug surfaces, pause the rollout via ASC and ship a fix without 100% of users on the broken version.
>
> ## 14. Release-Day Checklist (the 8 items)
>
> Before submitting to App Review:
>
> 1. **Build number bumped** — higher than any previously uploaded for this bundle ID.
> 2. **`CFBundleShortVersionString` follows semver** — `1.2.0` for new feature; `1.2.1` for bug fix.
> 3. **`PrivacyInfo.xcprivacy` matches ASC App Privacy questionnaire** — every data type, every required-reason API code.
> 4. **All purpose strings reviewed for honesty + clarity** in Info.plist.
> 5. **Sign in with Apple present** if any third-party social login is offered.
> 6. **No private API references** — `nm` on the binary; check for symbols Apple's static analyzer flags.
> 7. **Crash-free sessions > 99%** on the latest TestFlight build.
> 8. **Screenshots match the latest UI** — outdated screenshots are a common reviewer complaint.
>
> ## 15. Environment Variables (CI Secrets)
>
> | Variable | Description | Where to get it |
> |----------|-------------|-----------------|
> | `MATCH_PASSWORD` | Match repo encryption password | Client / team password manager |
> | `ASC_API_KEY_ID` | ASC API key ID | ASC → Users and Access → Keys |
> | `ASC_API_KEY_ISSUER_ID` | ASC API issuer ID | ASC → Users and Access → Keys |
> | `ASC_API_KEY_BASE64` | Base64 of the .p8 file | `base64 -i AuthKey.p8` |
>
> ## 16. Client Handoff Actions
>
> | # | Action | Guide | Status |
> |---|--------|-------|--------|
> | 1 | Enroll in Apple Developer Program ($99/yr) | `.claude/handoff/01-apple-developer.md` | PENDING |
> | 2 | Reserve App Bundle ID(s) | `.claude/handoff/02-bundle-id.md` | PENDING |
> | 3 | Submit Banking and Tax info to ASC | `.claude/handoff/03-asc-banking.md` | PENDING (paid app / IAP only) |
> | 4 | Set up Universal Links domain | `.claude/handoff/04-universal-links.md` | PENDING (if Universal Links in scope) |
> | 5 | Set up Sign in with Apple (Apple Developer side) | `.claude/handoff/05-sign-in-with-apple.md` | PENDING (if used) |
> | 6 | Create CloudKit Container | `.claude/handoff/06-cloudkit.md` | PENDING (if used) |
> | 7 | Set up fastlane match Git repo | `.claude/handoff/07-match-repo.md` | PENDING |
> | 8 | Generate ASC API key | `.claude/handoff/08-asc-api-key.md` | PENDING |
> | ... | ... | ... | ... |
>
> ## 17. Crash & Performance Telemetry
>
> - Crash reporting: {Sentry Cocoa SDK / Crashlytics / raw MXMetricManager}
> - MetricKit: enabled, delivered to {backend}; cold-launch / hang rate / scroll smoothness logged
> - ASC Xcode Organizer: monitored
>
> ## 18. Cost Estimate
>
> | Service | Monthly Cost | Notes |
> |---------|-------------|-------|
> | Apple Developer Program | $8.25 ($99/yr) | Required |
> | GitHub Actions macOS minutes | ~${N} | macOS is more expensive than Linux |
> | Crash reporting (Sentry / Crashlytics) | $0–{N} | Free tiers usually sufficient at MVP scale |
> | Universal Links domain | Existing if owned | DNS access required |
> | **Total** | **~${N}/month** | At MVP scale |
>
> ## 19. Not Yet Needed (and when to add)
>
> | Feature | Add When | Estimated Effort |
> |---------|----------|------------------|
> | Localized App Store screenshots | Shipping to 2+ markets | 2–3 days (snapshot setup per locale) |
> | Mac Catalyst | Demand from existing iOS users | 1–2 weeks |
> | Apple Vision | Strategic decision | 2–4 weeks |
> | Apple Watch companion | Defined product role | 2–3 weeks |
> | Snap Layouts equivalent (no iOS equivalent — drop) | n/a | n/a |
> | StoreKit testing config | First IAP added | 1 day |
> ````
>
> **Rules:**
> - Default to fastlane for the release pipeline.
> - Default to fastlane match for teams; automatic signing for solo.
> - Pin Xcode via `xcode-select` in CI.
> - `PrivacyInfo.xcprivacy` required for App Store submission — match ASC questionnaire exactly.
> - All `NSUsageDescription` strings honest, app-specific, never reused boilerplate.
> - ATT prompt BEFORE any tracking SDK starts.
> - Sign in with Apple if any third-party social login is offered.
> - Build number monotonically increasing.
> - Phased release enabled on first App Store submission.
> - Include cost estimates — the client needs to budget Apple Developer fees + GitHub Actions macOS minutes.
> - List EVERYTHING the client must do manually, with handoff guides.

## Step 3: Create handoff guides

For every item in the "Client Handoff Actions" table, send **devops** to create a detailed step-by-step guide:

> For each handoff action in `.claude/packaging-plan.md`, create a guide in `.claude/handoff/`.
> Each guide must be so clear that a non-technical client can follow it in 30 minutes.
> Include URLs, what to click, what to type, what to share back with us, and how long the step typically takes.
> Apple Developer enrollment can take 24–48 hours for individuals; organizations need D-U-N-S registration which can take weeks (hard gate).

## Step 4: Implement packaging

Once the client completes their handoff actions (or in parallel for things that don't need client input), send **devops** to create the actual packaging files:

> Based on `.claude/packaging-plan.md`, create:
> - `Config/Shared.xcconfig`, `Config/Debug.xcconfig`, `Config/Release.xcconfig`
> - `MyApp.entitlements` (capabilities flipped on as planned)
> - `Info.plist` purpose strings (all `NSUsageDescription` keys from §5)
> - `PrivacyInfo.xcprivacy` (data categories, required-reason API codes from §6)
> - `fastlane/Fastfile`, `fastlane/Appfile`, `fastlane/Matchfile`, `fastlane/Snapfile` (if using snapshot for screenshots)
> - `fastlane/metadata/en-US/*.txt` placeholders (CEO + designer will fill copy + screenshots before first submission)
> - `.github/workflows/ci.yml` (typecheck + lint + tests on PR) and `.github/workflows/release.yml` (per the matrix above)
> - `Gemfile` with fastlane pinned
>
> You CAN create config + workflow files. You MUST NOT modify Swift application code — that's the developer's domain. If the app target needs auto-updater-equivalent or push registration code, request it from the developer with the exact API surface you need.

## Step 5: Review and present

Read the packaging plan yourself. Check:
- fastlane lanes match the team's release cadence?
- Capabilities match the system design ADR-8?
- Every `NSUsageDescription` matches a real declared capability?
- `PrivacyInfo.xcprivacy` data categories match the ASC questionnaire we'll fill?
- ATT prompt order correct (if applicable)?
- Sign in with Apple present (if any third-party social login)?
- Build number strategy unambiguous?
- Phased release on the first submission?
- Handoff guides cover every Apple Developer action the client must take?
- Cost estimate honest?

Present to the client:
> "Here's the packaging plan:
> - Project: Swift 6 strict concurrency, deployment target iOS {N}, configurations Debug + Release
> - Signing: fastlane match (encrypted Git repo) — or automatic if you're solo
> - TestFlight: internal ring on every merge; external ring on tagged release candidates
> - App Store: phased release enabled on first submission
> - Privacy: `PrivacyInfo.xcprivacy` declaring {N} data categories + {N} required-reason API codes; all purpose strings honest and app-specific
> - Cost: ~${N}/month (mostly Apple Developer Program + GitHub Actions macOS minutes)
> - {N} things I need from you (handoff guides ready):
>   1. {action 1 — and how long it typically takes}
>   2. {action 2}
> - We can start building immediately — packaging is ready in parallel."

## Step 6: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → packaging plan: fastlane match, TestFlight internal + external rings, phased release on first ASC submission
- "Constraints" → add any signing-cert provisioning gates (Apple Developer Program 24–48h, D-U-N-S 3-week lead time for orgs)
