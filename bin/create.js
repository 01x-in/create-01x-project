#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const kleur = require('kleur')
const ora = require('ora')

console.log('')
console.log(kleur.cyan().bold('  ╔══════════════════════════════════════════╗'))
console.log(kleur.cyan().bold('  ║   create-01x-project  v1.2.0             ║'))
console.log(kleur.cyan().bold('  ║   Claude Code agent system scaffolder    ║'))
console.log(kleur.cyan().bold('  ╚══════════════════════════════════════════╝'))
console.log('')

async function run() {

  // ─── Step 1: project name only ───────────────────────────────────────────

  const { projectName } = await prompts(
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name?',
      initial: path.basename(process.cwd()),
      validate: v => v.length > 0 || 'Project name is required',
    },
    {
      onCancel: () => {
        console.log(kleur.red('\n  Cancelled.'))
        process.exit(1)
      },
    }
  )

  // ─── Folder tree preview ─────────────────────────────────────────────────

  console.log('')
  console.log('  ' + kleur.bold('The following files will be created:'))
  console.log('')
  console.log('  ' + kleur.white(projectName) + '/')
  console.log('  ' + kleur.dim('├── ') + kleur.white('CLAUDE.md'))
  console.log('  ' + kleur.dim('├── ') + kleur.white('README.md'))
  console.log('  ' + kleur.dim('├── ') + kleur.white('.gitignore'))
  console.log('  ' + kleur.dim('├── ') + kleur.yellow('agent_docs/'))
  console.log('  ' + kleur.dim('│   ├── ') + kleur.white('product-seed.md') + kleur.dim('  ← fill this after ideation'))
  console.log('  ' + kleur.dim('│   └── ') + kleur.white('build/'))
  console.log('  ' + kleur.dim('└── ') + kleur.yellow('.claude/'))
  console.log('  ' + kleur.dim('    ├── ') + kleur.yellow('agents/') + kleur.dim('  ← 12 agents'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.cyan('orchestrator.md') + kleur.dim('  ← invoke this'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('system-design-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('milestone-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('user-stories-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('product-brief-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('review-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('architect-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('build-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('test-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('build-review-agent.md'))
  console.log('  ' + kleur.dim('    │   ├── ') + kleur.dim('cache-health-agent.md'))
  console.log('  ' + kleur.dim('    │   └── ') + kleur.dim('pr-review-agent.md'))
  console.log('  ' + kleur.dim('    └── ') + kleur.yellow('commands/'))
  console.log('  ' + kleur.dim('        └── ') + kleur.dim('fix-pr-review.md'))
  console.log('')

  // ─── Step 2: git question ─────────────────────────────────────────────────

  const { initGit } = await prompts(
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialise a git repo?',
      initial: true,
    },
    {
      onCancel: () => {
        console.log(kleur.red('\n  Cancelled.'))
        process.exit(1)
      },
    }
  )

  console.log('')
  const spinner = ora('Scaffolding...').start()

  const root = process.cwd()

  // ─── Directories ──────────────────────────────────────────────────────────

  const dirs = ['.claude/agents', '.claude/commands', 'agent_docs/build']
  dirs.forEach(d => fs.mkdirSync(path.join(root, d), { recursive: true }))

  // ─── Copy all agent templates ─────────────────────────────────────────────

  const templatesDir = path.join(__dirname, '..', 'templates')
  const agentFiles = fs.readdirSync(path.join(templatesDir, '.claude', 'agents'))
  agentFiles.forEach(file => {
    fs.copyFileSync(
      path.join(templatesDir, '.claude', 'agents', file),
      path.join(root, '.claude', 'agents', file)
    )
  })

  // ─── Copy command templates ───────────────────────────────────────────────

  const commandFiles = fs.readdirSync(path.join(templatesDir, '.claude', 'commands'))
  commandFiles.forEach(file => {
    fs.copyFileSync(
      path.join(templatesDir, '.claude', 'commands', file),
      path.join(root, '.claude', 'commands', file)
    )
  })

  // ─── CLAUDE.md ────────────────────────────────────────────────────────────

  const claudeMd = `# ${projectName} — Project Operating Manual

## Agent System Overview
This project uses a multi-phase agent orchestration system.
Never start coding without reading the planning docs first.
Never skip the human gates — they exist for a reason.

## Phase Order
0. Architect Agent   → scaffolds repo, installs packages, configures infra
1. Planning Agents   → produce the 4 spec docs from product-seed.md
2. Review Agent      → validates all 4 docs for alignment
3. Build Loop        → build → test → review → fix → repeat per story
4. PR Review Loop    → opens PR, fixes bot review comments, replies and resolves threads

## Documentation References
- Product seed:    @agent_docs/product-seed.md
- System design:   @agent_docs/system-design.md
- Milestones:      @agent_docs/milestones.md
- User stories:    agent_docs/user-stories.md
- Product brief:   @agent_docs/product-brief.md
- Review notes:    @agent_docs/review-notes.md
- Build log:       @agent_docs/build/build-log.md
- Current story:   @agent_docs/build/current-story.md
- Test report:     @agent_docs/build/test-report.md
- Fix notes:       @agent_docs/build/fix-notes.md
- Blocked:         @agent_docs/build/blocked.md
- Scaffold report: @agent_docs/build/scaffold-report.md

## Architecture Decisions — DO NOT OVERRIDE
These are set during planning. Build agents must respect them.
Read agent_docs/system-design.md for the full list before writing any code.

## Coding Standards
- TypeScript strict mode — no \`any\` types
- Named exports only — no default exports except framework-required pages
- All functions must have type signatures
- No raw SQL — use the ORM defined in system-design.md
- Error responses must follow RFC 7807 Problem Details format
- Every feature must have tests before implementation (TDD)

## Test Commands
(Architect agent will populate these after scaffold)
- Run tests:   \`[to be filled by architect agent]\`
- Type check:  \`[to be filled by architect agent]\`
- Lint:        \`[to be filled by architect agent]\`
- Dev server:  \`[to be filled by architect agent]\`

## Post-PR Review Loop (runs automatically after every milestone PR is opened)
After opening a milestone PR, spawn the pr-review-agent as a Task subagent.
It polls for bot comments, fixes actionable issues, replies to each thread
with the fix commit SHA, resolves the conversation, verifies tests pass,
then commits and pushes — up to 3 cycles.

Requires: \`gh\` CLI authenticated + at least one PR review bot configured on the repo.

If pr-review-agent writes to agent_docs/build/blocked.md, stop and wait
for human review before showing the milestone complete gate.

Manual invocation: \`/fix-pr-review\` or \`Run the pr-review-agent.\`

## Session Management — Cache Rules
- Use /clear between MILESTONES, not between stories
- Use /compact at ~70% context capacity, not /clear
- Never change the tool set or model mid-session
- Pass state updates via <system-reminder> tags in messages, not file re-reads

## Branch Rules — NEVER COMMIT TO MAIN
- ALWAYS check \`git branch --show-current\` before starting any milestone work
- If the current branch is \`main\`, immediately run \`git checkout -b milestone/X\` where X is the current milestone number (e.g., \`git checkout -b milestone/10\` for M8)
- ALL implementation work (code, tests, doc updates) MUST happen on a \`milestone/X\` branch
- NEVER commit directly to \`main\` — not even build-log or doc updates
- After all stories in a milestone pass: push the branch and open a PR to \`main\` with \`gh pr create\`
- Human gate required between every milestone (wait for PR review/merge before starting next milestone)

## Build Loop Rules
- Max 3 fix cycles per story — then escalate to human via blocked.md
- Never modify test assertions to make tests pass — fix the implementation
- Commit after every passing story with the story ID in the commit message
- Human gate required between every milestone

## Compact Instructions
When compacting, preserve:
- Current milestone and story being worked on
- All architecture decisions from system-design.md
- List of completed stories from build-log.md
- Any active fix-notes.md content

CACHE-SAFE COMPACTION:
Keep the exact same system prompt, tool definitions, and context structure.
Append the compaction summary as a new user message at the end.
Never change the tool set or switch models during compaction.
`
  fs.writeFileSync(path.join(root, 'CLAUDE.md'), claudeMd)

  // ─── README.md (project-facing guide) ────────────────────────────────────

  const projectReadme = `# ${projectName}

> Scaffolded with [create-01x-project](https://github.com/yourusername/create-01x-project).
> A Claude Code multi-agent build system — from product idea to shipped code.

---

## How to Use

### Step 1 — Fill in the product seed

Open \`agent_docs/product-seed.md\` and describe your product.
This is the only file you write manually. Be specific — the agents
read this and produce everything else from it.

\`\`\`
agent_docs/product-seed.md
  → Problem statement
  → Target user
  → Core value proposition
  → Key features
  → Tech preferences
  → Constraints
  → Out of scope
\`\`\`

### Step 2 — Open in VSCode and run Claude Code

Open this folder in VSCode. Then open Claude Code and type:

\`\`\`
Run the orchestrator agent.
\`\`\`

Claude Code finds \`.claude/agents/orchestrator.md\` automatically
from your open workspace — no imports, no config needed.

### Step 3 — Approve the gates

The orchestrator runs four planning agents in parallel, then a review
agent that cross-checks everything. It stops at two human gates
before writing any code:

\`\`\`
✅ PLANNING COMPLETE — GATE 1
→ Read agent_docs/review-notes.md, then type: proceed with scaffold

✅ SCAFFOLD COMPLETE — GATE 2
→ Check agent_docs/build/scaffold-report.md, then type: proceed with milestone 1
\`\`\`

### Step 4 — Build

The build loop runs story by story — build → test → review → fix —
committing as it goes. At the end of each milestone the orchestrator
opens a PR and runs the pr-review-agent to fix any bot review comments
before showing you the next gate.

**Your total keyboard input for a full build:**

\`\`\`
Run the orchestrator agent.
proceed with scaffold
proceed with milestone 1
proceed with milestone 2
\`\`\`

---

## Project Structure

\`\`\`
${projectName}/
├── CLAUDE.md                    ← agent operating manual (auto-loaded by Claude Code)
├── agent_docs/
│   ├── product-seed.md          ← YOU fill this
│   ├── system-design.md         ← written by system-design-agent
│   ├── milestones.md            ← written by milestone-agent
│   ├── user-stories.md          ← written by user-stories-agent
│   ├── product-brief.md         ← written by product-brief-agent
│   ├── review-notes.md          ← written by review-agent
│   ├── build/
│   │   ├── scaffold-report.md   ← written by architect-agent
│   │   ├── current-story.md     ← updated per story by orchestrator
│   │   ├── build-log.md         ← running commit log
│   │   ├── test-report.md       ← written by test-agent each cycle
│   │   ├── fix-notes.md         ← written by build-review-agent on failures
│   │   ├── blocked.md           ← written when 3 fix cycles exhausted
│   │   ├── pending-infra.md     ← cloud commands awaiting your execution
│   │   └── pr-review-agent.md   ← runs automatically after a milestone PR is opened
│   └── commands/
│       └── fix-pr-review.md.md   ← written by architect-agent
└── .claude/
    └── agents/                  ← 11 agents, all pre-wired
\`\`\`

---

## The Agents

| Agent | Phase | Role |
|---|---|---|
| orchestrator | — | Master conductor. The only one you invoke. |
| system-design-agent | 1 | Technical blueprint — architecture, data model, API surface |
| milestone-agent | 1 | Delivery plan — milestones, story IDs, definition of done |
| user-stories-agent | 1 | Stories with acceptance criteria and edge cases |
| product-brief-agent | 1 | Product positioning, personas, UX principles |
| review-agent | 2 | Cross-checks all 4 planning docs for alignment |
| architect-agent | 0 | Scaffolds repo, installs packages, sets up infra |
| build-agent | 3 | TDD implementation — tests first, then code |
| test-agent | 3 | Runs test suite and reports results |
| build-review-agent | 3 | Code review — issues PASS or NEEDS FIX |
| cache-health-agent | utility | Diagnoses slow or expensive sessions |
| pr-review-agent | 4 | Fixes PR bot comments, replies, resolves threads |

---

## Handling Blocked Stories

If a story fails 3 fix cycles, \`agent_docs/build/blocked.md\` is written
with the story ID and all three failed attempts. To unblock:

1. Read \`agent_docs/build/blocked.md\`
2. Find the root cause (usually an ambiguity in \`system-design.md\`)
3. Fix the relevant doc
4. Type \`proceed\` in Claude Code

---

## Customising the Agents

All agents live in \`.claude/agents/\` as plain markdown files.
Each has a YAML frontmatter block at the top:

\`\`\`yaml
---
name: agent-name
description: When Claude Code should use this agent
tools: Read, Write, Bash, Glob
model: claude-sonnet-4-6
---
\`\`\`

To change an agent's behaviour, edit its \`.md\` file directly.
Changes take effect on the next Claude Code session — no rebuild needed.

**Common customisations:**
- Add project-specific coding standards to \`build-agent.md\`
- Tighten the review checklist in \`build-review-agent.md\`
- Add your preferred test framework commands to \`CLAUDE.md\`

## PR Review Loop

After each milestone, the orchestrator opens a PR and spawns the
pr-review-agent automatically. It:
- Polls for comments from Entelligence, CodeRabbit, Codex, or human reviewers
- Fixes actionable issues (up to 3 cycles)
- Replies to each thread with the fix commit SHA
- Resolves the conversation thread via GitHub GraphQL API
- Verifies tests pass before pushing

**Requires:** \`gh\` CLI authenticated + a PR review bot configured on the repo.
**Manual invocation:** type \`/fix-pr-review\` or \`Run the pr-review-agent.\`

---

## Session Tips

- Run \`/compact\` at ~70% context — not \`/clear\`. Compaction preserves the prompt cache; clearing destroys it.
- Stay in the same session across stories within a milestone. Clear between milestones.
- If sessions feel slow or expensive, run: \`Run the cache-health-agent.\`

---

*Built by the 01x — [01x.in](https://01x.in)*
`
  fs.writeFileSync(path.join(root, 'README.md'), projectReadme)

  // ─── product-seed.md ──────────────────────────────────────────────────────

  const productSeed = `# Product Seed — ${projectName}

> Fill this in after your ideation session.
> This is the single source of truth for all agents.
> Be specific — vague seeds produce vague plans.

---

## Problem Statement
[What pain exists in the world that this product solves?]

## Target User
[Who is this for? Be specific — not "anyone" but a real type of person in a real situation]

## Core Value Proposition
[In one sentence: what does this product do and why does it matter to the target user?]

## Key Features
[List every feature the product must have. One line each.]
-
-
-

## Tech Preferences
[Any strong preferences on stack, language, hosting, DB, etc. If none, leave blank.]
-

## Constraints
[Non-negotiable requirements: performance, compliance, budget, timeline, etc.]
-

## Out of Scope
[What this product explicitly will NOT do.]
-

## Additional Context
[Anything else agents should know: inspiration, competitors, known risks, etc.]
`
  fs.writeFileSync(path.join(root, 'agent_docs', 'product-seed.md'), productSeed)

  // ─── .gitignore ───────────────────────────────────────────────────────────

  if (!fs.existsSync(path.join(root, '.gitignore'))) {
    fs.writeFileSync(
      path.join(root, '.gitignore'),
      `.env\n.env.local\n.env.*.local\nnode_modules/\n.next/\ndist/\nbuild/\n*.log\n.DS_Store\n`
    )
  }

  // Keep agent_docs/build tracked by git
  fs.writeFileSync(path.join(root, 'agent_docs', 'build', '.gitkeep'), '')

  // ─── Git init ─────────────────────────────────────────────────────────────

  if (initGit) {
    try {
      const { execSync } = require('child_process')
      execSync('git init', { cwd: root, stdio: 'ignore' })
      execSync('git add .', { cwd: root, stdio: 'ignore' })
      execSync('git commit -m "chore: scaffold claude agent system"', { cwd: root, stdio: 'ignore' })
    } catch (_) {}
  }

  spinner.succeed('Done!')

  console.log('')
  console.log(kleur.bold('  Next steps:'))
  console.log('')
  console.log(kleur.dim('  1.') + '  Fill in ' + kleur.green('agent_docs/product-seed.md'))
  console.log(kleur.dim('  2.') + '  Open this folder in VSCode')
  console.log(kleur.dim('  3.') + '  Open Claude Code and type:')
  console.log('')
  console.log(kleur.cyan().bold('       Run the orchestrator agent.'))
  console.log('')
}

run().catch(err => {
  console.error(kleur.red('\n  Error: ' + err.message))
  process.exit(1)
})