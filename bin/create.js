#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const kleur = require('kleur')
const ora = require('ora')

console.log('')
console.log(kleur.cyan().bold('  ╔══════════════════════════════════════════╗'))
console.log(kleur.cyan().bold('  ║   create-01x-project  v1.0.0             ║'))
console.log(kleur.cyan().bold('  ║   Claude Code agent system scaffolder    ║'))
console.log(kleur.cyan().bold('  ╚══════════════════════════════════════════╝'))
console.log('')

async function run() {
  const answers = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name?',
        initial: path.basename(process.cwd()),
        validate: v => v.length > 0 || 'Project name is required',
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialise a git repo?',
        initial: true,
      },
    ],
    {
      onCancel: () => {
        console.log(kleur.red('\n  Cancelled.'))
        process.exit(1)
      },
    }
  )

  const projectName = answers.projectName
  const root = process.cwd()

  // ─── Folder tree preview ─────────────────────────────────────────────────

  console.log('')
  console.log('  ' + kleur.white(projectName) + '/')
  console.log('  ' + kleur.dim('├── ') + kleur.white('CLAUDE.md'))
  console.log('  ' + kleur.dim('├── ') + kleur.white('.gitignore'))
  console.log('  ' + kleur.dim('├── ') + kleur.yellow('agent_docs/'))
  console.log('  ' + kleur.dim('│   ├── ') + kleur.white('product-seed.md') + kleur.dim('  ← fill this after ideation'))
  console.log('  ' + kleur.dim('│   └── ') + kleur.white('build/'))
  console.log('  ' + kleur.dim('└── ') + kleur.yellow('.claude/'))
  console.log('  ' + kleur.dim('    └── ') + kleur.yellow('agents/') + kleur.dim('  ← 11 agents'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.cyan('orchestrator.md') + kleur.dim('  ← invoke this'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('system-design-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('milestone-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('user-stories-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('product-brief-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('review-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('architect-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('build-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('test-agent.md'))
  console.log('  ' + kleur.dim('        ├── ') + kleur.dim('build-review-agent.md'))
  console.log('  ' + kleur.dim('        └── ') + kleur.dim('cache-health-agent.md'))
  console.log('')

  const spinner = ora('Scaffolding...').start()

  // ─── Directories ──────────────────────────────────────────────────────────

  const dirs = ['.claude/agents', 'agent_docs/build']
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

## Documentation References
- Product seed:    @agent_docs/product-seed.md
- System design:   @agent_docs/system-design.md
- Milestones:      @agent_docs/milestones.md
- User stories:    @agent_docs/user-stories.md
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

## Session Management — Cache Rules
- Use /clear between MILESTONES, not between stories
- Use /compact at ~70% context capacity, not /clear
- Never change the tool set or model mid-session
- Pass state updates via <system-reminder> tags in messages, not file re-reads

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

  // ─── README stub ──────────────────────────────────────────────────────────

  if (!fs.existsSync(path.join(root, 'README.md'))) {
    fs.writeFileSync(
      path.join(root, 'README.md'),
      `# ${projectName}\n\n> Scaffolded with create-01x-project.\n> Fill in \`agent_docs/product-seed.md\` then open Claude Code and type:\n> \`Run the orchestrator agent.\`\n`
    )
  }

  // Keep agent_docs/build tracked by git
  fs.writeFileSync(path.join(root, 'agent_docs', 'build', '.gitkeep'), '')

  // ─── Git init ─────────────────────────────────────────────────────────────

  if (answers.initGit) {
    try {
      const { execSync } = require('child_process')
      execSync('git init', { cwd: root, stdio: 'ignore' })
      execSync('git add .', { cwd: root, stdio: 'ignore' })
      execSync('git commit -m "chore: scaffold claude agent system"', { cwd: root, stdio: 'ignore' })
    } catch (_) {}
  }

  spinner.succeed('Done!')

  // ─── Next steps ───────────────────────────────────────────────────────────

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
