# create-01x-project

> Scaffold the Claude Code multi-agent build system into any project. One command, two questions.

---

## What It Does

Drops 11 pre-wired Claude Code agents into your project — an orchestrator, four planning agents, a review agent, an architect agent, a TDD build loop, and a cache health monitor. Stack agnostic. Works for any language, framework, or toolchain.

```bash
npx create-01x-project
```

That's it. Fill in `agent_docs/product-seed.md`, open Claude Code, and type `Run the orchestrator agent.`

---

## Usage

```bash
mkdir my-app && cd my-app
npx create-01x-project
```

```
  ╔══════════════════════════════════════════╗
  ║   create-01x-project  v1.1.0             ║
  ║   Claude Code agent system scaffolder    ║
  ╚══════════════════════════════════════════╝

  Project name? › my-app

  The following files will be created:

  my-app/
  ├── CLAUDE.md
  ├── README.md
  ├── .gitignore
  ├── agent_docs/
  │   ├── product-seed.md  ← fill this after ideation
  │   └── build/
  └── .claude/
      └── agents/  ← 11 agents
          ├── orchestrator.md  ← invoke this
          ├── system-design-agent.md
          ├── milestone-agent.md
          ├── user-stories-agent.md
          ├── product-brief-agent.md
          ├── review-agent.md
          ├── architect-agent.md
          ├── build-agent.md
          ├── test-agent.md
          ├── build-review-agent.md
          └── cache-health-agent.md

  Initialise a git repo? › Yes

  ✔ Done!

  Next steps:

  1.  Fill in agent_docs/product-seed.md
  2.  Open this folder in VSCode
  3.  Open Claude Code and type:

       Run the orchestrator agent.
```

Two questions. A tree. Done.

---

## What Gets Created

```
your-project/
├── CLAUDE.md                          ← project operating manual (auto-loaded by Claude Code)
├── README.md                          ← how-to guide for this project
├── .gitignore
├── agent_docs/
│   ├── product-seed.md                ← fill this after ideation
│   └── build/                         ← agents write state here during builds
└── .claude/
    └── agents/
        ├── orchestrator.md            ← the only agent you ever invoke manually
        ├── system-design-agent.md     ← Phase 1: technical blueprint
        ├── milestone-agent.md         ← Phase 1: delivery plan
        ├── user-stories-agent.md      ← Phase 1: stories + edge cases
        ├── product-brief-agent.md     ← Phase 1: product positioning
        ├── review-agent.md            ← Phase 2: cross-doc alignment check
        ├── architect-agent.md         ← Phase 0: scaffold + install
        ├── build-agent.md             ← Phase 3: TDD implementation
        ├── test-agent.md              ← Phase 3: test runner + reporter
        ├── build-review-agent.md      ← Phase 3: code review + fix notes
        └── cache-health-agent.md      ← utility: diagnose slow/expensive sessions
```

---

## The Workflow After Scaffolding

**Step 1 — Fill the seed**

`agent_docs/product-seed.md` is the only file you write manually. Paste in what you built during your ideation session — problem, target user, features, constraints, out of scope. The agents read this and produce everything else.

**Step 2 — Run the orchestrator**

Open the project in VSCode, open Claude Code, type:

```
Run the orchestrator agent.
```

Claude Code finds `.claude/agents/orchestrator.md` automatically from your open workspace.

**Step 3 — Approve the gates**

The orchestrator runs four planning agents in parallel, then a review agent. It stops and waits at two human gates before writing any code:

```
✅ PLANNING COMPLETE — GATE 1
Type: proceed with scaffold

✅ SCAFFOLD COMPLETE — GATE 2
Type: proceed with milestone 1
```

**Step 4 — Build**

The build loop runs story by story — build → test → review → fix — committing as it goes. Milestone gates pause between milestones so you stay in control.

Your total keyboard input for a complete build:

```
Run the orchestrator agent.
proceed with scaffold
proceed with milestone 1
proceed with milestone 2
```

---

## Stack Agnostic by Design

The architect agent reads `agent_docs/system-design.md` — produced by the planning phase — and sets up whatever stack is defined there. It does not assume Next.js, Node, Python, Go, or anything else. If you spec Rust and SQLite in your system design, that's what it installs.

The `CLAUDE.md` that gets created has placeholder test commands that the architect agent fills in after scaffold, based on what it actually installed.

---

## End-to-End Example — PerishNote

Here's a complete walkthrough using a real product idea: a shared, password-protected checklist that self-destructs after 24 hours. No signups.

### 1. Scaffold the project

```bash
mkdir perishnote && cd perishnote
npx create-01x-project
```

```
  Project name? › perishnote

  The following files will be created:

  perishnote/
  ├── CLAUDE.md
  ├── README.md
  ├── .gitignore
  ├── agent_docs/
  │   ├── product-seed.md  ← fill this after ideation
  │   └── build/
  └── .claude/
      └── agents/  ← 11 agents
          ├── orchestrator.md  ← invoke this
          └── ...

  Initialise a git repo? › Yes

  ✔ Done!
```

### 2. Fill in the product seed

Open `agent_docs/product-seed.md` and fill it in:

```markdown
# Product Seed — PerishNote

## Problem Statement
Shared checklists built on-the-fly have no lightweight, zero-auth home.
Existing tools require accounts, persist forever, and feel too heavy
for transient coordination like a grocery run or a packing list.

## Target User
Anyone who needs to share a quick checklist with a specific person —
no technical setup, no account, no friction.

## Core Value Proposition
A URL-shareable, password-protected checklist that auto-deletes
after 24 hours. Zero signup required.

## Key Features
- Create a list, set a password, get a unique shareable URL
- Checkbox-style items with text labels
- Real-time sync for anyone with the URL + password
- Auto-deletion at 24h from creation

## Tech Preferences
Next.js, Redis for TTL-based auto-expiry, deploy to Vercel

## Constraints
- Must work on mobile browser
- No accounts, no email, no cookies

## Out of Scope
- User history or saved lists
- File attachments
- Notifications
```

### 3. Run the orchestrator

Open VSCode with the project. Open Claude Code. Type:

```
Run the orchestrator agent.
```

**Phase 1 — four planning agents run in parallel (you watch, you don't type):**

```
⠸ system-design-agent    writing agent_docs/system-design.md...
⠸ milestone-agent        writing agent_docs/milestones.md...
⠸ user-stories-agent     writing agent_docs/user-stories.md...
⠸ product-brief-agent    writing agent_docs/product-brief.md...

✓ All 4 planning docs complete.
```

**Phase 2 — review:**

```
⠸ review-agent    cross-checking all 4 docs...

Verdict: APPROVED

═══════════════════════════════════════
✅ PLANNING COMPLETE — GATE 1
Type: proceed with scaffold
═══════════════════════════════════════
```

### 4. Approve Gate 1

```
proceed with scaffold
```

```
⠸ architect-agent    scaffolding repo...
  → next-app initialised
  → packages installed (redis, nanoid, zod, bcrypt)
  → .env.example written
  → CLAUDE.md test commands updated
  → dev server: OK ✓

═══════════════════════════════════════
✅ SCAFFOLD COMPLETE — GATE 2
Type: proceed with milestone 1
═══════════════════════════════════════
```

### 5. Approve Gate 2

```
proceed with milestone 1
```

```
Story STORY-101: Create a list and get a shareable URL
  ✓ PASS → committed: [STORY-101] Create list endpoint

Story STORY-102: Access a list with password
  ✗ NEEDS FIX (cycle 1/3): bcrypt compare called before await
  ✓ PASS → committed: [STORY-102] Password-protected list access

Story STORY-103: Real-time checkbox sync
  ✓ PASS → committed: [STORY-103] Real-time sync via SSE

═══════════════════════════════════════
✅ MILESTONE 1 COMPLETE — GATE 3
Type: proceed with milestone 2
═══════════════════════════════════════
```

### What you typed across the entire build

```
Run the orchestrator agent.
proceed with scaffold
proceed with milestone 1
proceed with milestone 2
```

---

## Package Structure

```
create-01x-project/
├── bin/
│   └── create.js               ← CLI entry point
├── templates/
│   └── .claude/
│       └── agents/             ← all 11 agent .md files
├── package.json
└── README.md
```

No `lib/` folder. No stack definitions. No generators. The tool has one job — copy the agents, create the folder structure, write `CLAUDE.md`, `README.md`, and `product-seed.md`. Everything stack-specific is handled by the agents themselves at runtime.

---

## About 01x

This tool is part of **[01x](https://01x.in)** — a paid builder environment where you join a cohort, explore an idea, use AI to accelerate, and ship an MVP. If you want to build real products (not just learn concepts) and are serious about using AI as a force multiplier, check it out. Applications are reviewed manually and cohort sizes are kept small by design.

---

*From zero to one to scale.*