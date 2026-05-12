---
name: common-ios-app-ui-verify
description: Verify UI on the iOS Simulator — boot the pinned sim, build for simulator destination, install, launch with reset state, capture screenshots at every acceptance-criteria state, optionally stream `os_log`, then have the ux-engineer review the screenshots against `.claude/design-spec.md` for HIG conformance, Dynamic Type behavior, dark-mode parity, and accessibility. Drives the simulator entirely through `xcodebuild` and `xcrun simctl` over `Bash`. Use after a UI task is implemented and before marking it done; also useful for ad-hoc visual exploration during design review.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[TASK-ID | --free for ad-hoc] [--device 'iPhone 15'] [--os 17.5] [--dark] [--a11y XXXL]"
---

# iOS UI Verify — Simulator-Driven Visual Verification

You are the CEO. A UI task is implemented (or you want to look at the app at a point in time). Before reviewer signs off, you need eyes on the running app: real bundle, real navigation, real persistence, real Dynamic Type, real dark mode, real VoiceOver labels. This skill drives that — boot, build, install, launch, capture, review.

No MCP server is involved. Everything goes through `xcodebuild` (to build for the simulator destination) and `xcrun simctl` (to boot, install, launch, drive, and screenshot) over `Bash`. The Read tool then displays the captured `.png` screenshots back to you for direct evaluation against the design spec.

> **Delegation rule:** You orchestrate; you do not run the verification yourself. Brief the **ux-engineer** (HIG specialist who already drives the simulator via `xcrun simctl` and the Accessibility Inspector per their charter) and let them execute the runbook. You read the resulting screenshots + report and either approve, or send back with notes.

## Step 1: Resolve the verification scope

Parse `$ARGUMENTS`:
- A `TASK-ID` (e.g. `TASK-005`) → read `.claude/tasks/<TASK-ID>.md`; the acceptance criteria become the screenshot manifest. Each AC that is visually verifiable gets at least one screenshot.
- `--free` → ad-hoc exploration; boot the app to the primary tab and let the ux-engineer drive.
- `--device "<name>"` / `--os <version>` → override the pinned simulator from `.claude/test-plan.md`. If neither is given and there is no pin, pick the most recent iPhone runtime installed (`xcrun simctl list devices available --json`).
- `--dark` → capture every state in light AND dark.
- `--a11y XXXL` → capture every state at Dynamic Type `accessibilityExtraExtraLarge` in addition to default.

If `$ARGUMENTS` is empty, ask once: "Which task should I verify (TASK-ID) or do you want `--free` exploration?" Then proceed.

## Step 2: Load project context

Read in this order (skip files that don't exist yet — this skill works against a fresh project too):
- `.claude/system-design.md` — architecture, capabilities, navigation graph
- `.claude/design-spec.md` — design tokens, screen specs, visual criteria
- `.claude/test-plan.md` — pinned simulator (device + iOS version), launch arguments contract (`--uitesting-reset-state`, `--uitesting-disable-animations`)
- `.claude/screen-map.md` — navigation routes
- `.claude/tasks/<TASK-ID>.md` if a task ID was passed — acceptance criteria

Detect the Xcode project shape:
- Workspace: `ls -d *.xcworkspace 2>/dev/null`
- Project: `ls -d *.xcodeproj 2>/dev/null`
- Schemes: `xcodebuild -workspace <ws> -list` (or `-project <proj> -list`)

If neither a workspace nor a project exists, stop and tell the user the app hasn't been scaffolded yet — direct them to `/common-ios-app-init`.

## Step 3: Brief the ux-engineer

Send **ux-engineer** with this brief (verbatim — they execute, you observe):

> Your job is to verify the UI for **{TASK-ID or "ad-hoc exploration"}**.
>
> Inputs you have:
> - Pinned simulator: **{device, os}** (from test-plan.md or args).
> - Scheme: **{scheme}** (default: the only scheme, or the one passed in args).
> - Acceptance criteria: see `.claude/tasks/{TASK-ID}.md` (skip if `--free`).
> - Design spec: `.claude/design-spec.md` (tokens, per-screen visual criteria).
>
> Run this runbook. At every step, on non-zero exit, stop and report the failure to me with the offending command + last 50 lines of stderr.
>
> ### Runbook
>
> **1. Pick & boot the simulator.**
> ```bash
> UDID=$(xcrun simctl list devices available --json \
>   | jq -r --arg name "{device}" --arg os "{os}" \
>     '.devices | to_entries[] | select(.key | endswith($os)) | .value[] | select(.name==$name) | .udid' \
>   | head -1)
> if [ -z "$UDID" ]; then
>   echo "No simulator matching {device} on iOS {os}. Falling back to the latest available iPhone."
>   UDID=$(xcrun simctl list devices available --json \
>     | jq -r '.devices | to_entries | sort_by(.key) | reverse | .[].value[] | select(.name | startswith("iPhone")) | .udid' \
>     | head -1)
> fi
> xcrun simctl boot "$UDID" 2>/dev/null || true   # idempotent: already-booted is fine
> xcrun simctl bootstatus "$UDID" -b
> open -b com.apple.iphonesimulator   # bring the Simulator.app window to front
> ```
>
> Note the chosen UDID + device name + iOS version — log it in the report header so screenshots are reproducible.
>
> **2. Build for the simulator destination.**
> ```bash
> DERIVED=$(mktemp -d)
> xcodebuild \
>   -workspace "{workspace OR project flag}" \
>   -scheme "{scheme}" \
>   -configuration Debug \
>   -destination "platform=iOS Simulator,id=$UDID" \
>   -derivedDataPath "$DERIVED" \
>   build \
>   | xcbeautify 2>/dev/null || cat   # xcbeautify if installed, raw log otherwise
> ```
>
> On build failure: stop. Report the first compiler error (file:line + message). Do not try to "fix and retry" — that's developer's job; come back to verification after fix.
>
> **3. Install the app bundle.**
> ```bash
> APP=$(find "$DERIVED/Build/Products/Debug-iphonesimulator" -name "*.app" -maxdepth 1 -type d | head -1)
> xcrun simctl install "$UDID" "$APP"
> BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP/Info.plist")
> ```
>
> **4. Reset state, then launch with the standard test launch arguments.**
> ```bash
> xcrun simctl uninstall "$UDID" "$BUNDLE_ID" 2>/dev/null || true
> xcrun simctl install   "$UDID" "$APP"
> xcrun simctl launch    "$UDID" "$BUNDLE_ID" \
>   --uitesting-reset-state \
>   --uitesting-disable-animations
> sleep 1   # let the cold-launch settle; Dynamic Island finishes its first paint
> ```
>
> If the app uses launchArguments different from `--uitesting-reset-state` (read test-plan.md), substitute the project's contract.
>
> **5. Capture screenshots per the manifest.**
>
> For each acceptance criterion with a visual outcome, drive the app to that state and screenshot:
> ```bash
> SHOT_DIR=".claude/qa/ui-verify/{TASK-ID}/$(date -u +%Y%m%dT%H%M%SZ)"
> mkdir -p "$SHOT_DIR"
> xcrun simctl io "$UDID" screenshot "$SHOT_DIR/{NN}-{state-slug}.png"
> ```
>
> Driving the app: prefer `xcrun simctl ui {UDID} appearance light|dark` for appearance switches; for navigation, either drive via XCUITest accessibility queries OR via deep links (`xcrun simctl openurl "$UDID" "<scheme>://..."`) if the app handles them.
>
> If `--dark` was passed, every state captures twice: light + dark. If `--a11y XXXL` was passed, every state captures again at:
> ```bash
> xcrun simctl ui "$UDID" content_size accessibility-extra-extra-large
> ```
>
> **6. Stream logs (optional, on failure).**
>
> If any step misbehaves, capture the last 60 seconds of `os_log` filtered to the bundle:
> ```bash
> xcrun simctl spawn "$UDID" log show \
>   --predicate "subsystem == \"$BUNDLE_ID\"" \
>   --last 1m --style compact > "$SHOT_DIR/_logs.txt" 2>&1 || true
> ```
>
> **7. Tear down.**
> ```bash
> # Leave the simulator booted for follow-up runs; only kill if we booted it fresh.
> # If you booted it in step 1 (it wasn't running before), shut it down now:
> xcrun simctl shutdown "$UDID" 2>/dev/null || true
> rm -rf "$DERIVED"
> ```
>
> Skip the shutdown if the developer asked you to leave the sim running for iteration.
>
> **8. Review the screenshots against `.claude/design-spec.md`.**
>
> For each screenshot, evaluate:
> - **Tokens** — fonts come from the asset catalog / Dynamic Type semantic styles (`.title`, `.body`, …); colors from the asset catalog (Color set); spacings match the spec (4/8/12/16/24/32/48 ladder if defined). No hardcoded `.font(.system(size:))` or raw RGB.
> - **HIG** — safe area respected; navigation pattern matches the screen map; modal style appropriate (sheet vs full-screen vs inspector); tab bar present where required; tap targets ≥ 44×44 pt.
> - **Dynamic Type (if `--a11y XXXL`)** — text wraps without truncation; layout reflows; no clipped buttons; multi-line labels OK.
> - **Dark mode (if `--dark`)** — backgrounds adapt; text contrast WCAG AA on all surfaces; vector assets adapt; no white flashes on transitions.
> - **VoiceOver labels** — every interactive element has an `accessibilityLabel`; decorative images are hidden; landmarks are correct. (Run `xcrun simctl io "$UDID" enumerate` and grep accessibility labels, or use Accessibility Inspector if available.)
>
> **9. Produce the report.**
>
> Write `$SHOT_DIR/_report.md`:
>
> ````markdown
> # UI Verification — {TASK-ID or "ad-hoc"}
> > Run: {ISO timestamp UTC} · Simulator: {device} · iOS {os} · UDID {udid}
> > Scheme: {scheme} · Build: Debug · Bundle: {BUNDLE_ID}
> > Modes captured: light{, dark}{, Dynamic Type XXXL}
>
> ## Acceptance Criteria → Evidence
>
> | AC | Screenshot(s) | Result | Notes |
> |----|---------------|--------|-------|
> | AC-1: Documents tab cold-launch shows empty state with "+ Add" button | `01-empty-state.png` (+ dark, XXXL) | PASS | Tokens match; Dynamic Type wraps cleanly |
> | AC-2: Tapping + opens the create sheet | `02-create-sheet.png` | FAIL | Sheet is full-screen instead of `.sheet` style — spec says detents [.medium] |
> | ... | ... | ... | ... |
>
> ## HIG / Accessibility / Dynamic Type / Dark Mode
>
> - [PASS / FAIL] Safe area respected on every screen
> - [PASS / FAIL] Tap targets ≥ 44×44 pt
> - [PASS / FAIL] All Color uses from asset catalog (no hardcoded RGB)
> - [PASS / FAIL] All Font uses are semantic styles
> - [PASS / FAIL] Dynamic Type XXXL — no truncation, no clipping
> - [PASS / FAIL] Dark mode — adapts cleanly, contrast OK
> - [PASS / FAIL] VoiceOver labels present on every interactive element
>
> ## Recommendation
>
> - **APPROVE** if every AC PASS and the global checklist passes.
> - **REQUEST CHANGES** if any AC FAILs or a checklist item FAILs. List the failing items with the exact spec reference (design-spec.md section + screenshot filename) so developer can fix without guessing.
> ````
>
> Hand the report path + the screenshot directory back to the CEO when done.

## Step 4: Read the report

Open `$SHOT_DIR/_report.md` and the screenshots. Read the screenshots with the Read tool — they render visually. Compare against `.claude/design-spec.md` independently of the ux-engineer's call; if you disagree, say so and send them back with a specific note.

## Step 5: Decide

- **APPROVE** → update `.claude/tasks/<TASK-ID>.md`: append a `UI Verification: PASS — $SHOT_DIR/_report.md` line under the task's status section, and mark the task ready for reviewer.
- **REQUEST CHANGES** → write the failing items as feedback in `.claude/agent-notes/developer.md` (or `ux-engineer.md` if the failure is purely token / HIG drift in the View), then loop back to developer through `/common-ios-app-sprint`.

If running with `--free`, no task update happens — just hand the screenshot directory back to the user.

## Notes & failure modes

- **No simulator runtime installed for the requested iOS version.** Fall back to the latest available (already in the runbook). Mention the fallback in the report header so reviewers know baselines may shift.
- **`xcodebuild` not on PATH** (Command Line Tools only, no full Xcode). Tell the user: install Xcode from the App Store or set `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`. Don't try to work around it.
- **App crashes on launch.** Capture `xcrun simctl spawn "$UDID" log show --last 1m` and attach to the report. Mark verification FAIL with the crash signature. Do not retry; loop back to developer.
- **Snapshot tests are a different thing.** This skill captures eyeballed evidence for the CEO + ux-engineer. `swift-snapshot-testing` baselines are the developer's tool inside `xcodebuild test`. The two complement each other; don't conflate them.
- **No `.mcp.json` involved.** This skill is the team's complete answer to "how do I get eyes on the running app from inside Claude Code" — `xcodebuild` + `xcrun simctl` + `Read` on the captured PNGs is the whole stack. If a first-party iOS Simulator MCP appears later, fold it in via `.mcp.json` and slim this skill down.
