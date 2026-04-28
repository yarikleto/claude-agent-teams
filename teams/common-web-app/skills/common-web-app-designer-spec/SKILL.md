---
name: common-web-app-designer-spec
description: Designer extracts a design specification from the approved prototype — design tokens (colors, fonts, spacing), component inventory, screen map with annotations, and visual acceptance criteria per screen. This becomes the single source of truth for UI implementation. Use after prototype is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing spec]"
---

# SWE Design Spec — From Prototype to Implementation Blueprint

You are the CEO. The prototype is approved by the client. Before any code is written, the **designer** must extract a design specification — the bridge between "how it looks/feels" (prototype) and "how to build it" (tasks).

The scope of this spec depends on the project type:
- **Web/Mobile/Desktop UI:** Full visual spec — tokens, components, screens, interaction states
- **CLI tool:** Output formatting spec — colors, layout, progress indicators, help text format
- **API/SDK:** Developer experience spec — naming conventions, error format, response structure, docs template
- **Game:** Visual spec + HUD layout + menu structure
- **Pure backend/infra:** Skip this skill. No design spec needed — system-design.md covers everything.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/prototypes/README.md` — prototype index
- Latest approved prototype (HTML file, CLI script, API examples, etc.)
- `.claude/product-vision.md` — for context

If `$ARGUMENTS` contains `--update`, read `.claude/design-spec.md` and revise.

If the project is pure backend/infrastructure with no user-facing interface, tell the user this skill is not needed and suggest proceeding to `/swe-design` or `/swe-tasks` instead.

## Step 2: Brief the designer

Send **designer** with this brief:

> Read the latest approved prototype from `.claude/prototypes/`.
> Open the HTML file and analyze it completely — every screen, every component, every color, every spacing value.
>
> Produce a design specification document. Save it as `.claude/design-spec.md`.
>
> The document MUST follow this structure:
>
> ````markdown
> # Design Specification
> > Extracted from prototype v{N} — {date}
> > Prototype: `.claude/prototypes/v{N}/index.html`
>
> ## 1. Design Tokens
>
> ### Colors
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--color-primary` | `#3B82F6` | Primary buttons, links, active states |
> | `--color-primary-hover` | `#2563EB` | Primary button hover |
> | `--color-bg` | `#FFFFFF` | Page background |
> | `--color-bg-secondary` | `#F9FAFB` | Cards, sidebars, secondary surfaces |
> | `--color-text` | `#111827` | Body text |
> | `--color-text-secondary` | `#6B7280` | Secondary text, labels, placeholders |
> | `--color-border` | `#E5E7EB` | Borders, dividers |
> | `--color-success` | `#10B981` | Success states, confirmations |
> | `--color-error` | `#EF4444` | Errors, destructive actions |
> | `--color-warning` | `#F59E0B` | Warnings |
> | ... | ... | ... |
>
> ### Typography
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--font-family` | `'Inter', system-ui, sans-serif` | All text |
> | `--font-size-xs` | `12px` | Captions, labels |
> | `--font-size-sm` | `14px` | Secondary text |
> | `--font-size-base` | `16px` | Body text |
> | `--font-size-lg` | `18px` | Subheadings |
> | `--font-size-xl` | `20px` | Section titles |
> | `--font-size-2xl` | `24px` | Page titles |
> | `--font-size-3xl` | `30px` | Hero headings |
> | `--font-weight-normal` | `400` | Body text |
> | `--font-weight-medium` | `500` | Labels, buttons |
> | `--font-weight-semibold` | `600` | Headings |
> | `--font-weight-bold` | `700` | Hero, emphasis |
> | `--line-height-tight` | `1.25` | Headings |
> | `--line-height-normal` | `1.5` | Body text |
>
> ### Spacing
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--space-1` | `4px` | Tight: icon to label |
> | `--space-2` | `8px` | Small: related elements |
> | `--space-3` | `12px` | Between form fields |
> | `--space-4` | `16px` | Between groups |
> | `--space-6` | `24px` | Between sections |
> | `--space-8` | `32px` | Major section breaks |
> | `--space-12` | `48px` | Page-level spacing |
>
> ### Borders & Shadows
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--radius-sm` | `4px` | Inputs, small elements |
> | `--radius-md` | `8px` | Cards, buttons |
> | `--radius-lg` | `12px` | Modals, large cards |
> | `--radius-xl` | `16px` | Hero sections |
> | `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
> | `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, dropdowns |
> | `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
>
> ## 2. Component Inventory
>
> List every reusable UI component visible in the prototype:
>
> ### Buttons
> | Variant | Style | Usage |
> |---------|-------|-------|
> | Primary | bg-primary, text-white, rounded-md, font-medium, px-4 py-2 | Main CTAs |
> | Secondary | border border-gray-300, text-gray-700, rounded-md | Secondary actions |
> | Destructive | bg-error, text-white | Delete, remove |
> | Ghost | text-primary, no background | Tertiary actions |
>
> ### Inputs
> | Variant | Style | Notes |
> |---------|-------|-------|
> | Text input | border, rounded-sm, px-3 py-2, font-size-base | Has focus ring |
> | Select | same as text input + chevron icon | ... |
> | ... | ... | ... |
>
> ### Cards
> ...
>
> ### Navigation
> ...
>
> ### {Other components as they appear in the prototype}
>
> ## 3. Screen Map
>
> For EACH screen in the prototype, document:
>
> ### Screen: {name} (e.g., "Login", "Dashboard", "Settings")
> **Prototype location:** Screen #{N} in `.claude/prototypes/v{N}/index.html`
> **Purpose:** {what the user does on this screen}
> **Layout:** {grid structure — e.g., "sidebar left 280px + main content"}
>
> **Components used:**
> - Header with logo + nav links + user avatar
> - Sidebar with menu items (active state = bg-primary/10, text-primary)
> - Main content area with card grid (3 columns, gap-6)
> - ...
>
> **Visual Acceptance Criteria:**
> - [ ] Header is fixed, 64px height, shadow-sm on scroll
> - [ ] Sidebar is 280px wide, bg-secondary
> - [ ] Active menu item has left border 3px primary + bg-primary/10
> - [ ] Cards have shadow-sm, radius-lg, hover:shadow-md transition
> - [ ] Page title is font-size-2xl, font-weight-semibold, color-text
> - [ ] Empty state shows illustration + CTA button centered
> - ...
>
> ### Screen: {next screen}
> ...
>
> ## 4. Responsive Behavior
> <!-- How does the layout adapt?
>      - Breakpoints (if defined in prototype)
>      - What happens to sidebar on mobile?
>      - What stacks, what hides?
>      - Minimum supported width -->
>
> ## 5. Interaction States
> <!-- Document non-obvious states:
>      - Hover states for buttons, cards, links
>      - Focus states for form inputs (ring color, width)
>      - Active/pressed states
>      - Disabled states (opacity, cursor)
>      - Loading states (skeleton, spinner, placeholder)
>      - Error states on form fields
>      - Empty states for lists/tables
>      - Transition durations and easing -->
>
> ## 6. Dark Mode (if applicable)
> <!-- How do tokens change in dark mode?
>      - bg → dark surface colors
>      - text → light text colors
>      - borders → darker borders
>      - shadows → more subtle or removed -->
> ````
>
> **Rules:**
> - Extract EXACT values from the prototype HTML/CSS — don't invent new values.
> - Every token must be actually used in the prototype. Don't add theoretical tokens.
> - Visual acceptance criteria per screen are CRITICAL — the reviewer and designer will verify against these.
> - Component inventory should cover every distinct UI element. If you see it in the prototype, document it.
> - Skip sections that don't apply (no dark mode? skip it).

## Step 3: Review

Read the design spec. Check:
- Are the tokens extracted from the actual prototype?
- Does the component inventory match what's visible in the prototype?
- Does every screen have visual acceptance criteria?
- Could a developer implement the UI from this document alone?

If gaps, send designer back.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → design spec created, {N} screens documented, {N} components

## Step 5: Present to client

> "The designer extracted a full design spec from the approved prototype — {N} screens, {N} components, all with exact colors, spacing, and visual acceptance criteria.
> This ensures the final product looks exactly like what you approved."
