---
name: common-web-app-designer-spec
description: Designer extracts a web design specification from the approved HTML prototype — design tokens (CSS custom properties for color/type/spacing/radius/shadow), component inventory, screen map with visual acceptance criteria per screen, responsive behavior, and interaction states. This becomes the single source of truth for UI implementation. Use after the prototype is approved.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent, mcp__claude_ai_Excalidraw__read_me, mcp__claude_ai_Excalidraw__create_view, mcp__claude_ai_Excalidraw__export_to_excalidraw
argument-hint: "[--update to revise existing spec]"
---

# Web Design Spec — From Prototype to Implementation Blueprint

You are the CEO. The prototype is approved by the client. Before any code is written, the **designer** must extract a design specification — the bridge between "how it looks/feels" (prototype) and "how to build it" (tasks).

This is a web-only team. The spec covers a web UI: tokens, components, screens, responsive behavior, interaction states, and (if defined) dark mode.

## Step 1: Verify inputs

Check that these files exist:
- `.claude/prototypes/README.md` — prototype index
- Latest approved HTML prototype (`.claude/prototypes/v{N}/index.html`)
- `.claude/product-vision.md` — for context

If `$ARGUMENTS` contains `--update`, read `.claude/design-spec.md` and revise.

## Step 2: Brief the designer

Send **designer** with this brief:

> Read the latest approved prototype from `.claude/prototypes/`.
> Open the HTML file and analyze it completely — every screen, every component, every color, every spacing value.
>
> Produce a design specification document. Save it as `.claude/design-spec.md`.
>
> Use the structure below. Extract EXACT values from the prototype HTML/CSS — don't invent new ones. Skip sections that don't apply (no dark mode? skip it).
>
> ````markdown
> # Design Specification
> > Extracted from prototype v{N} — {date}
> > Prototype: `.claude/prototypes/v{N}/index.html`
>
> ## 1. Design Tokens (CSS custom properties)
>
> ### Colors (semantic)
> | Token | Light | Dark | Usage |
> |-------|-------|------|-------|
> | `--color-bg` | `#ffffff` | `#0a0a0a` | Page background |
> | `--color-bg-surface` | `#f9fafb` | `#171717` | Cards, sidebars |
> | `--color-bg-elevated` | `#ffffff` | `#1f1f1f` | Popovers, modals |
> | `--color-text` | `#0a0a0a` | `#ededed` | Body text |
> | `--color-text-muted` | `#6b7280` | `#a1a1aa` | Secondary text, labels |
> | `--color-border` | `#e5e7eb` | `#262626` | Borders, dividers |
> | `--color-accent` | `#3b82f6` | `#60a5fa` | Primary CTAs, links |
> | `--color-accent-hover` | `#2563eb` | `#3b82f6` | Primary hover |
> | `--color-success` | `#10b981` | `#34d399` | Success states |
> | `--color-warning` | `#f59e0b` | `#fbbf24` | Warnings |
> | `--color-danger` | `#ef4444` | `#f87171` | Errors, destructive |
>
> ### Typography
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--font-sans` | `'Inter', ui-sans-serif, system-ui, sans-serif` | All text |
> | `--font-mono` | `ui-monospace, 'JetBrains Mono', monospace` | Code, IDs |
> | `--text-xs` | `0.75rem` (12px) | Captions, badges |
> | `--text-sm` | `0.875rem` (14px) | Secondary, table cells |
> | `--text-base` | `1rem` (16px) | Body |
> | `--text-lg` | `1.125rem` (18px) | Subheadings |
> | `--text-xl` | `1.25rem` (20px) | Section titles |
> | `--text-2xl` | `1.5rem` (24px) | Page titles |
> | `--text-3xl` | `1.875rem` (30px) | Hero subhead |
> | `--text-4xl` | `2.25rem` (36px) | Hero h1 (mobile) |
> | `--text-5xl` | `3rem` (48px) | Hero h1 (desktop) |
> | `--font-weight-normal` | `400` | Body |
> | `--font-weight-medium` | `500` | Labels, buttons |
> | `--font-weight-semibold` | `600` | Headings |
> | `--font-weight-bold` | `700` | Hero, emphasis |
> | `--leading-tight` | `1.25` | Headings |
> | `--leading-normal` | `1.5` | Body |
>
> Web font loading: preconnect to `fonts.googleapis.com`, `font-display: swap`, preload critical weight (400 or 500).
>
> ### Spacing (8px grid, rem-based)
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--space-1` | `0.25rem` (4px) | Tight: icon-to-label |
> | `--space-2` | `0.5rem` (8px) | Related elements |
> | `--space-3` | `0.75rem` (12px) | Form fields |
> | `--space-4` | `1rem` (16px) | Between groups |
> | `--space-6` | `1.5rem` (24px) | Between sections |
> | `--space-8` | `2rem` (32px) | Major breaks |
> | `--space-12` | `3rem` (48px) | Page-level |
> | `--space-16` | `4rem` (64px) | Hero / landing |
>
> ### Borders, radius, shadow
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--radius-sm` | `0.25rem` | Inputs, badges |
> | `--radius-md` | `0.5rem` | Buttons, small cards |
> | `--radius-lg` | `0.75rem` | Cards, modals |
> | `--radius-xl` | `1rem` | Hero blocks |
> | `--radius-full` | `9999px` | Pills, avatars |
> | `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05)` | Subtle elevation |
> | `--shadow-md` | `0 4px 6px rgb(0 0 0 / 0.07)` | Cards, dropdowns |
> | `--shadow-lg` | `0 10px 15px rgb(0 0 0 / 0.1)` | Modals, popovers |
>
> ### Motion
> | Token | Value | Usage |
> |-------|-------|-------|
> | `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default |
> | `--duration-fast` | `150ms` | Hovers, small state changes |
> | `--duration-base` | `200ms` | Most transitions |
> | `--duration-slow` | `300ms` | Modals, sheets |
>
> All transitions must be skipped under `@media (prefers-reduced-motion: reduce)`.
>
> ## 2. Responsive breakpoints
>
> | Name | Min width | Use |
> |------|-----------|-----|
> | (default) | 0 | Mobile-first base |
> | `sm` | 640px | Large phones, small tablets |
> | `md` | 768px | Tablets |
> | `lg` | 1024px | Small laptops |
> | `xl` | 1280px | Desktops |
> | `2xl` | 1536px | Large desktops |
>
> Strategy: {mobile-first | desktop-first} — justify the choice.
> Minimum supported width: {e.g., 360px}.
>
> ## 3. Component inventory
>
> Document every reusable UI element visible in the prototype.
>
> ### Buttons
> | Variant | Style | Usage |
> |---------|-------|-------|
> | Primary | `bg-accent text-white rounded-md font-medium px-4 py-2` | Main CTAs |
> | Secondary | `border border-border text-text rounded-md px-4 py-2` | Secondary actions |
> | Destructive | `bg-danger text-white rounded-md` | Delete, remove |
> | Ghost | `text-accent hover:bg-accent/10` | Tertiary |
> | Icon-only | square 36×36, accessible label required | Toolbars |
>
> Sizes: sm (h-8), md (h-10), lg (h-12). Touch target ≥44px on mobile.
>
> ### Inputs & form controls
> | Variant | Style | Notes |
> |---------|-------|-------|
> | Text input | `border rounded-md px-3 py-2 text-base` + focus ring | Label above, inline error below |
> | Select | input + chevron icon | Native or Radix |
> | Checkbox / Radio | 16×16, accent color when checked | Visible focus ring |
> | Textarea | `min-h-24 resize-y` | |
>
> ### Cards
> { surface, elevated, interactive — describe each }
>
> ### Navigation
> { top bar / sidebar / combo — describe structure, active state, mobile behavior }
>
> ### Overlays
> { Modal / Sheet / Popover / Toast / Banner — when each is used }
>
> ### Data display
> { Tables / Lists / Stat cards / Charts — describe styling }
>
> ### Feedback
> { Empty / Loading (skeleton) / Error / Success states — describe each }
>
> ## 4. Screen map
>
> For EACH screen in the prototype:
>
> ### Screen: {name} (e.g., "Dashboard", "Login", "Settings/Billing")
> **Prototype location:** Screen #{N} in `.claude/prototypes/v{N}/index.html`
> **Purpose:** {what the user does here}
> **Layout:** {e.g., "sidebar left 280px + main content max-w-7xl"}
> **Responsive behavior:** {what happens at md / sm — sidebar collapses to drawer, grid stacks, etc.}
>
> **Components used:**
> - Sticky top bar (h-16) with logo + workspace switcher + user menu
> - Sidebar (w-72) with section labels and nav items, active = `bg-accent/10 text-accent border-l-2 border-accent`
> - Main content: page header + 3-column stat-card grid (gap-6) + chart card + recent-activity table
>
> **Visual acceptance criteria:**
> - [ ] Header is sticky, h-16, `shadow-sm` and `backdrop-blur` on scroll
> - [ ] Sidebar w-72 on `lg+`, off-canvas drawer below `lg`
> - [ ] Active nav item: `bg-accent/10 text-accent`, 2px left border accent
> - [ ] Stat cards: `rounded-lg shadow-sm border`, `hover:shadow-md` transition
> - [ ] Page title: `text-2xl font-semibold text-text`
> - [ ] Empty state: centered illustration + headline + primary CTA
> - [ ] Loading: skeleton placeholders matching final card layout (no spinner)
> - [ ] Error: inline banner with retry action
>
> ### Screen: {next}
> ...
>
> ## 5. Interaction states
>
> Document non-obvious states for every interactive component:
> - **Hover** — color/shadow shift, 150ms ease-out
> - **Focus** — visible ring (`ring-2 ring-accent ring-offset-2`), never `outline: none` without replacement
> - **Active / pressed** — slightly darker / scale-95
> - **Disabled** — `opacity-50 cursor-not-allowed`, no hover effect
> - **Loading** — skeleton screens (preferred) or inline spinner; preserve layout to prevent shift
> - **Error** — inline message below field, `text-danger`, optional icon
> - **Empty** — illustration/icon + headline + supporting text + CTA
> - **Success** — toast top-right, auto-dismiss 3–4s, dismissible
>
> ## 6. Accessibility commitments
>
> - WCAG AA contrast on all text and UI components
> - Visible focus rings on every interactive element
> - Touch targets ≥44×44 CSS px on all viewports
> - Respect `prefers-reduced-motion` — disable or shorten transitions
> - Color is never the only signal (pair with icon/label/shape)
> - All form inputs have associated `<label>`; errors are `aria-describedby` linked
>
> ## 7. Dark mode (if defined in the prototype)
>
> Toggle mechanism: `[data-theme="dark"]` on `<html>` or `prefers-color-scheme`.
> All color tokens have a dark counterpart (see Section 1).
> Shadows softened or removed; depth via layered surface tokens.
> Borders shift from `--color-border` light to dark.
>
> ## 8. Web font loading
>
> Strategy: {Google Fonts via preconnect | self-hosted | system stack}
> Critical preload: {weight}
> `font-display: swap` for all faces.
> ````
>
> **Rules:**
> - Extract EXACT values from the prototype HTML/CSS — don't invent.
> - Every token must be actually used in the prototype. No theoretical tokens.
> - Visual acceptance criteria per screen are CRITICAL — reviewer and designer verify against these.
> - Component inventory must cover every distinct UI element in the prototype.
> - Skip sections that don't apply.

## Step 3: Review

Read the design spec. Check:
- Are tokens extracted from the actual prototype (not invented)?
- Does the component inventory match what's visible?
- Does every screen have visual acceptance criteria?
- Is responsive behavior documented per screen?
- Are interaction states covered?
- Could a developer implement the UI from this document alone?

If gaps, send designer back.

## Step 4: Update CEO brain

Update `.claude/ceo-brain.md`:
- "Key Decisions Log" → design spec created, {N} screens, {N} components, {breakpoints}, dark mode {yes/no}

## Step 5: Present to client

> "The designer extracted a full design spec from the approved prototype — {N} screens, {N} components, all with exact tokens, responsive behavior, and visual acceptance criteria.
> This ensures the final product looks exactly like what you approved, on every screen size."
