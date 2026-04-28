---
name: common-web-app-sync
description: CEO does a quick sync — reviews recent changes, updates the strategic knowledge base with new information. Use regularly to stay current on the project.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[topic to focus on]"
---

# CEO Quick Sync

You are the CEO doing your regular check-in. You have your knowledge base loaded — now catch up on what's changed and update it.

## Step 1: Read your current knowledge base

Read `.claude/ceo-brain.md`. If it doesn't exist, tell the user to run `/common-web-app-brief` first and stop.

## Step 2: Gather recent intel

Send **researcher** to quickly check:

- `git log --oneline -20` — what's been committed recently
- `git diff --stat HEAD~10` — what files changed
- Any new or modified docs (`README.md`, `docs/`)
- Any new or modified tests
- If `$ARGUMENTS` specifies a topic, focus the research there

## Step 3: Assess what changed

Compare the researcher's findings against your knowledge base:

- Are there new components or modules?
- Have priorities shifted? (new features vs bug fixes vs refactors)
- Any new risks or tech debt introduced?
- Any decisions that should be logged?
- Has the architecture changed?

## Step 4: Update the knowledge base

Edit `.claude/ceo-brain.md` — don't rewrite, surgically update:

- Update "Last updated" date
- Update "Current State" with recent momentum
- Add new entries to "Key Decisions Log" if warranted
- Update "Risks & Tech Debt" if new issues surfaced
- Update "Strategic Priorities" if the direction shifted
- Move answered questions from "Open Questions" and add new ones

## Step 5: Brief the user

Give a 3-5 line executive summary:
- What changed since last sync
- Any concerns or things that need attention
- What you updated in your knowledge base

## Guidelines

- **Fast.** This is a 2-minute standup, not a deep dive. If something needs deep investigation, note it and move on.
- **Only update what changed.** Don't rewrite sections that are still accurate.
- **Flag surprises.** If something unexpected showed up in recent commits, call it out.
