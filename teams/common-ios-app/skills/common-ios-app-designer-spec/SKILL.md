---
name: common-ios-app-designer-spec
description: Designer extracts an iOS design specification from the approved HTML prototype — design tokens (asset-catalog color tokens with Any + Dark Appearance, typography mapped to Dynamic Type semantic styles, spacing on the 8pt grid), component inventory, screen map with visual acceptance criteria per screen, plus the iOS-specific artefacts every native app needs on day one — a **screen map** (navigation graph: every screen, transitions, modal presentations) and an **SF Symbols inventory** (every symbol used, weight, where surfaced). Use after the prototype is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing spec]"
---

# iOS Design Spec — From Prototype to Implementation Blueprint

You are the CEO. The prototype is approved by the client. Before any Swift is written, the **designer** must extract a design specification — the bridge between "how it looks/feels" (prototype) and "how to build it" (tasks).

This is an iOS team. The spec covers a native iOS UI: tokens, components, screens, navigation, SF Symbols, Dynamic Type behavior, and dark-mode + Increase-Contrast adaptations.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/prototypes/README.md` — prototype index
- Latest approved HTML prototype (`.claude/prototypes/v{N}/index.html`)
- `.claude/product-vision.md` — for context (supported devices, minimum iOS version, app lifecycle mode)

If `$ARGUMENTS` contains `--update`, read existing `.claude/design-spec.md`, `.claude/screen-map.md`, `.claude/sf-symbols.md` and revise.

## Step 2: Brief the designer

Send **designer** with this brief:

> Read the latest approved prototype from `.claude/prototypes/`.
> Read `.claude/product-vision.md` for supported devices and minimum iOS version.
> Open the HTML file and analyze it completely — every screen, every component, every navigation transition, every modal presentation, every color, every spacing value.
>
> Produce THREE artefacts:
> - `.claude/design-spec.md` — design tokens + components + screen map + Dynamic Type plan
> - `.claude/screen-map.md` — navigation graph: every screen, transitions, modal presentations
> - `.claude/sf-symbols.md` — every SF Symbol used, its weight, where it appears
>
> Use the structures below. Extract EXACT values from the prototype HTML/CSS — don't invent. Skip sections that don't apply (no iPad layout? skip iPad section).
>
> ## Artefact 1: `.claude/design-spec.md`
>
> ````markdown
> # Design Specification
> > Extracted from prototype v{N} — {date}
> > Prototype: `.claude/prototypes/v{N}/index.html`
>
> ## 1. Asset Catalog Color Tokens
>
> Every token lives in `Core/DesignSystem/Colors.xcassets`. Each entry has Any Appearance + Dark Appearance, plus High Contrast variants for Increase Contrast users.
>
> | Token | Light | Dark | Light (High Contrast) | Dark (High Contrast) | Usage |
> |-------|-------|------|----------------------|---------------------|-------|
> | `brand/accent` | `#007AFF` | `#0A84FF` | `#0040AA` | `#3DA0FF` | Primary CTAs, links, focus rings |
> | `brand/accent-secondary` | `#5856D6` | `#5E5CE6` | `#3D3BBE` | `#7E7CFA` | Secondary accents |
> | `surface/canvas` | `#FFFFFF` | `#000000` | `#FFFFFF` | `#000000` | Window background |
> | `surface/grouped` | `#F2F2F7` | `#1C1C1E` | `#E5E5EA` | `#2C2C2E` | Grouped table cells |
> | `surface/elevated` | `#FFFFFF` | `#2C2C2E` | `#FFFFFF` | `#3A3A3C` | Cards, dialogs, popovers |
> | `text/primary` | system `.label` | system `.label` | system `.label` | system `.label` | Body text |
> | `text/secondary` | system `.secondaryLabel` | system `.secondaryLabel` | — | — | Captions, subtitles |
> | `border/separator` | system `.separator` | system `.separator` | — | — | Dividers |
> | `status/success` | `.systemGreen` | `.systemGreen` | — | — | Success states |
> | `status/warning` | `.systemOrange` | `.systemOrange` | — | — | Warnings |
> | `status/danger` | `.systemRed` | `.systemRed` | — | — | Errors, destructive actions |
>
> Reasoning: system colors (`.label`, `.secondaryLabel`, `.separator`, `.systemBackground`, …) adapt automatically to dark mode + Increase Contrast + Reduce Transparency. Use them wherever possible; reserve brand colors for accents.
>
> ## 2. Typography — Dynamic Type Mapping
>
> Every text style maps to a semantic Dynamic Type style. Custom faces use `.font(.custom(_, size:, relativeTo:))` so they scale.
>
> | Token | Dynamic Type Style | Default Size | Weight | Usage |
> |-------|-------------------|--------------|--------|-------|
> | `text/largeTitle` | `.largeTitle` | 34pt | Regular | Top-level screen titles in `.large` navigation bar mode |
> | `text/title` | `.title` | 28pt | Regular | Section titles |
> | `text/title2` | `.title2` | 22pt | Regular | Sub-section titles |
> | `text/headline` | `.headline` | 17pt | Semibold | Emphasized labels, list-row primary text |
> | `text/body` | `.body` | 17pt | Regular | Default body |
> | `text/callout` | `.callout` | 16pt | Regular | Secondary body |
> | `text/subheadline` | `.subheadline` | 15pt | Regular | Captions inside content |
> | `text/footnote` | `.footnote` | 13pt | Regular | Footnote text |
> | `text/caption` | `.caption` | 12pt | Regular | Photo captions, badges |
> | `text/caption2` | `.caption2` | 11pt | Regular | Smallest |
>
> Custom font (if any): `{brand font name}` for {marketing surfaces only} — via `.font(.custom("BrandFont", size: 17, relativeTo: .body))`.
>
> NEVER use `.font(.system(size: N))` with a raw number — it does not scale.
>
> ## 3. Spacing (8pt grid)
>
> | Token | Value | Usage |
> |-------|-------|-------|
> | `space/xs` | 4pt | Icon-to-label, badge padding |
> | `space/sm` | 8pt | Related elements |
> | `space/md` | 12pt | Form field internal padding |
> | `space/lg` | 16pt | Default content padding (iPhone) |
> | `space/xl` | 24pt | Default content padding (iPad), between sections |
> | `space/xxl` | 32pt | Major page breaks |
>
> ## 4. Borders, Radius, Shadow, Motion
>
> | Token | Value | Usage |
> |-------|-------|-------|
> | `radius/sm` | 6pt | Badges, chips |
> | `radius/md` | 10pt | Buttons, small cards |
> | `radius/lg` | 14pt | Cards, sheets |
> | `radius/xl` | 20pt | Top-level surfaces |
> | `shadow/sm` | `0 1pt 2pt rgba(0,0,0,0.05)` | Subtle elevation |
> | `shadow/md` | `0 4pt 6pt rgba(0,0,0,0.07)` | Popovers, dropdowns |
> | `shadow/lg` | `0 10pt 15pt rgba(0,0,0,0.10)` | Dialogs |
> | `duration/fast` | 120ms | Hovers, taps |
> | `duration/base` | 220ms | Most transitions |
> | `easing/out` | spring(response: 0.4, dampingFraction: 0.8) | Default |
>
> All transitions skipped under `accessibilityReduceMotion == true`.
> Click targets ≥44×44pt (HIG minimum).
>
> ## 5. Device & Platform Coverage
>
> ### iPhone
> - Supported size classes: compact (most iPhones).
> - Default content padding: 16pt from screen edges.
> - Safe area: status bar at top, Dynamic Island clipping on Pro devices, home indicator gesture region at bottom.
> - Orientation: {portrait only | portrait + landscape}.
>
> ### iPad (if supported)
> - Supported size classes: compact (Slide Over) + regular (full screen / Split View / Stage Manager).
> - Default content padding: 24pt from screen edges in regular size class.
> - Layout: `NavigationSplitView` (sidebar + content + detail) in regular; falls back to `NavigationStack` in compact.
> - Orientation: portrait + landscape; multitasking states tested.
>
> ## 6. Component Inventory
>
> ### Buttons
> | Variant | Style | Usage |
> |---------|-------|-------|
> | Primary | `bg(brand/accent) fg(white) cornerRadius(radius/md) padding(.horizontal, space/lg) padding(.vertical, space/md)` | Default action |
> | Secondary | `border(border/separator) fg(text/primary) cornerRadius(radius/md)` | Secondary action |
> | Destructive | `bg(status/danger) fg(white) cornerRadius(radius/md)` | Delete / remove |
> | Tertiary (ghost) | `fg(brand/accent) bg(.clear) padding(space/md)` | Inline links / tertiary actions |
> | Icon-only | square 44×44pt, accessible label required | Toolbars |
>
> ### Form controls
> { Text fields, secure fields, date pickers, segmented controls — describe each with Dynamic Type behavior + dark mode adaptation }
>
> ### Cards / Lists / Sections
> { describe each — `List` with `.insetGrouped`, `List` with `.plain`, custom cards }
>
> ### Native dialogs (system-presented)
> { `.alert`, `.confirmationDialog`, `dialog.showActionSheet`-equivalent (iPad popover) — documented as system; no in-app rendering }
>
> ### Overlays
> { `.sheet` with detents, `.fullScreenCover`, `.popover` (iPad), `.alert`, `.confirmationDialog` — Esc/swipe-down dismisses each `.sheet`; default button on Return where applicable }
>
> ### Feedback
> { Empty (`ContentUnavailableView` iOS 17+), Loading (`ProgressView` indeterminate or `ProgressView(value:)` known-bounded), Error (inline + action), Success (toast top-right or system feedback generator) }
>
> ## 7. Screen Map
>
> For EACH screen in the prototype:
>
> ### Screen: {name} (e.g., "Documents Home", "Document Detail", "Settings")
> **Window:** {primary tab / pushed / sheet / fullScreenCover / popover (iPad)}
> **Title style:** {`.large` / `.inline`}
> **Prototype location:** Screen #{N} in `.claude/prototypes/v{N}/index.html`
> **Purpose:** {what the user does here}
> **Layout:** {SwiftUI structure, e.g., `NavigationStack { List { ... } }`}
> **Navigation bar items:** leading {back / cancel}, trailing {primary action / icon group}
>
> **Components used:**
> - { component list }
>
> **Visual acceptance criteria:**
> - [ ] Background uses `surface/canvas` (no white flash)
> - [ ] List uses `.insetGrouped` style with section headers
> - [ ] Primary CTA on trailing toolbar, semibold weight, brand accent color
> - [ ] Title bar font + size matches Dynamic Type `.largeTitle` (or inline as specified)
> - [ ] Empty state: `ContentUnavailableView` with `doc.text` symbol, "No documents" headline, primary CTA
> - [ ] Loading: `ProgressView` overlay (centered) on initial load
> - [ ] Error: inline banner above the list with "Try again" button
> - [ ] Light + dark mode: contrast 4.5:1 text / 3:1 components
> - [ ] AccessibilityExtraExtraLarge: layout doesn't break, no clipped text
> - [ ] VoiceOver: list rows announce title + secondary text; trailing chevron announces "Navigates to detail"
>
> ### Screen: {next}
> ...
>
> ## 8. Interaction States
>
> - **Pressed** — subtle scale (`.scaleEffect(0.97)`) or color shift on press, animated with `duration/fast`
> - **Disabled** — `.opacity(0.5)`, no press response
> - **Loading** — `ProgressView` overlay or skeleton placeholders (skeletons preferred when layout is predictable)
> - **Error** — inline near the input, `status/danger` color, clear "what failed + how to fix"
> - **Empty** — `ContentUnavailableView` with system illustration + headline + supporting text + CTA
> - **Success** — system feedback generator (`.notificationOccurred(.success)`) + transient toast or screen update
>
> ## 9. Dark Mode + Increase Contrast
>
> - Toggle: `Environment(\.colorScheme)` observed automatically; flip on system theme change mid-session is seamless.
> - All color tokens have Dark Appearance counterparts in the asset catalog (Section 1).
> - All colors have High Contrast variants for Increase Contrast users.
> - `accessibilityReduceTransparency` respected — material-backed surfaces fall back to solid `surface/elevated`.
> - Shadows softened or removed in dark; depth via layered surface tokens.
>
> ## 10. Accessibility Commitments
>
> - WCAG AA contrast on all text + UI components (Section 1 tokens are designed to meet this).
> - Every interactive element has a `.accessibilityLabel` (when not self-describing).
> - Custom controls expose traits (`.accessibilityAddTraits(.isButton / .isHeader / .isSelected)`).
> - Click targets ≥44×44pt.
> - `accessibilityReduceMotion` respected — non-essential animations gated.
> - `accessibilityDifferentiateWithoutColor` respected — color is never the only signal.
> - All form inputs have semantic labels; errors are linked via `.accessibilityLabel` updates.
> - Native menus / system dialogs are NOT in the SwiftUI hierarchy — manual-qa verifies VoiceOver paths.
> ````
>
> ## Artefact 2: `.claude/screen-map.md`
>
> ````markdown
> # Screen Map
> > Extracted from prototype v{N} — {date}
>
> ## Navigation Graph
> {Excalidraw diagram showing every screen and the transitions between them — push, sheet, fullScreenCover, popover, tab change.}
>
> ## Tab Structure (if tab-based)
>
> | Tab Index | Title | SF Symbol (regular) | SF Symbol (selected) | Root Screen |
> |-----------|-------|--------------------|--------------------|-----|
> | 0 | Documents | `doc.text` | `doc.text.fill` | Documents Home |
> | 1 | Search | `magnifyingglass` | `magnifyingglass` | Search |
> | 2 | Settings | `gearshape` | `gearshape.fill` | Settings |
>
> ## Routes (enum cases for `NavigationStack` path)
>
> ```swift
> enum Route: Hashable {
>     case document(id: UUID)
>     case settings
>     case licenses
>     // ...
> }
> ```
>
> ## Modal Presentations
>
> | Trigger | Presents | Style | Detents (sheet) | Drag Indicator | Dismiss |
> |---------|----------|-------|----------------|----------------|---------|
> | Documents + button | CreateDocument | `.sheet` | [.medium, .large] | yes | Swipe down or "Cancel" |
> | Settings → Export | DocumentPicker | system | n/a | n/a | System |
> | Settings → Sign Out | Confirmation | `.confirmationDialog` | n/a | n/a | Cancel or "Sign Out" |
>
> ## Screens (matches `.claude/design-spec.md` section 7)
>
> Cross-link to design-spec for visual details. This file is the structural source of truth.
> ````
>
> ## Artefact 3: `.claude/sf-symbols.md`
>
> ````markdown
> # SF Symbols Inventory
> > Extracted from prototype v{N} — {date}
>
> Every SF Symbol used in the app, its weight, and where it surfaces. Weights chosen to match the surrounding text weight.
>
> | Symbol | Weight | Render Mode | Where | Notes |
> |--------|--------|-------------|-------|-------|
> | `doc.text` | regular | monochrome | Empty state on Documents Home; tab icon | `doc.text.fill` for the selected-tab variant |
> | `plus` | semibold | monochrome | Trailing toolbar on Documents Home | 17pt to match `.headline` weight |
> | `magnifyingglass` | regular | monochrome | Search tab; search-bar accessory | — |
> | `square.and.arrow.up` | regular | monochrome | Share toolbar item on Document Detail | System share affordance |
> | `ellipsis.circle` | regular | monochrome | "More" toolbar item on Document Detail | Anchors a popover on iPad |
> | `trash` | regular | hierarchical | Swipe action on Documents list | `status/danger` tint via swipe action style |
> | `archivebox` | regular | monochrome | Swipe action on Documents list | `status/warning` tint |
> | `chevron.right` | regular | monochrome | List-row trailing accessory | System-provided via `NavigationLink` — don't override |
> | `gearshape` | regular | monochrome | Settings tab | `gearshape.fill` for the selected-tab variant |
> | `person.crop.circle` | regular | hierarchical | Profile row in Settings | Sign-in-state-dependent variant |
> | `xmark` | semibold | monochrome | Cancel buttons in sheets | 17pt |
> | `checkmark` | semibold | monochrome | Confirm buttons in sheets | 17pt |
> | ... | | | | |
>
> ## Custom Icons
>
> {None — all icons use SF Symbols.}
> {If a brand icon is unavoidable (custom logo on the launch screen, a feature-specific custom drawing), list here with rationale + asset-catalog path. SF Symbols beat custom icons every time they fit because they scale, tint, and ship with accessibility for free.}
> ````
>
> **Rules:**
> - Extract EXACT values from the prototype HTML/CSS — don't invent.
> - Every token must be actually used in the prototype.
> - Visual acceptance criteria per screen are CRITICAL — reviewer and designer verify against these.
> - Component inventory must cover every distinct UI element in the prototype.
> - All typography uses semantic Dynamic Type styles. NEVER `.font(.system(size: N))` with a raw number.
> - All colors use asset-catalog tokens with Any + Dark Appearance pairs (and High Contrast variants).
> - Tap targets ≥44pt.
> - Skip sections that don't apply.

## Step 3: Review

Read all three artefacts. Check:
- Tokens extracted from the actual prototype (not invented)?
- Asset-catalog colors have Light + Dark + High Contrast variants?
- Typography mapped to Dynamic Type semantic styles (no raw sizes)?
- Spacing on the 8pt grid?
- Component inventory matches what's visible in the prototype?
- Every screen has visual acceptance criteria?
- Tab structure clear; routes enumerated?
- Modal presentations have correct style (sheet vs fullScreenCover vs popover) + detents + dismiss path?
- Every SF Symbol used in the prototype is listed with weight + location?
- iPad section present if iPad is in scope; absent if not?

If gaps, send designer back.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → design spec created, {N} screens, {N} components, {M} SF Symbols, dark mode + High Contrast variants present, Dynamic Type mapping complete

## Step 5: Present to client

> "The designer extracted a full design spec from the approved prototype — {N} screens, {N} components, all with exact asset-catalog tokens (Light + Dark + High Contrast), a complete screen map with navigation transitions, and an SF Symbols inventory.
> This means the developer won't guess at colors, typography, or icons, and the reviewer can verify every screen against the visual acceptance criteria."
