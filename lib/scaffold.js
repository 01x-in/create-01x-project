'use strict'

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { getAgentRuntimeProfile } = require('./model-profiles')
const { RUNTIMES, getRuntimeConfig } = require('./runtime-profiles')

const VERSION = '1.5.0'
const ROOT_DIR = path.join(__dirname, '..')
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates')
const SHARED_AGENT_TEMPLATE_DIR = path.join(TEMPLATES_DIR, 'agents-shared')
const RUNTIME_TEMPLATE_DIR = path.join(TEMPLATES_DIR, 'runtime')
const CLAUDE_COMMAND_TEMPLATE_DIR = path.join(RUNTIME_TEMPLATE_DIR, 'claude', 'commands')
const STATE_DIR = '01x'
const BUILD_DIR = path.join(STATE_DIR, 'build')
const PRODUCT_SEED_PATH = path.join(STATE_DIR, 'product-seed.md')
const HOWTO_PATH = path.join(STATE_DIR, 'HOWTO.md')
const RUNTIME_MARKER_PATH = path.join(STATE_DIR, 'runtime.json')

function slugifyProjectName(projectName) {
  return (projectName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project'
}

function resolveTargetDirectory({
  cwd,
  projectName,
  useCurrentDirectory,
  folderName,
}) {
  const suggestedFolderName = slugifyProjectName(projectName)
  const targetDirectoryMode = useCurrentDirectory ? 'current' : 'custom'
  const targetDir = useCurrentDirectory
    ? cwd
    : path.isAbsolute(folderName)
      ? folderName
      : path.resolve(cwd, folderName)

  return {
    currentFolderName: path.basename(cwd),
    suggestedFolderName,
    targetDir,
    targetDirectoryMode,
    targetLabel: useCurrentDirectory
      ? path.basename(cwd)
      : path.relative(cwd, targetDir) || path.basename(targetDir),
  }
}

function parseFrontmatter(frontmatterSource) {
  const lines = frontmatterSource.split('\n')
  const frontmatter = {}

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/)

    if (!match) {
      continue
    }

    const key = match[1]
    const rawValue = match[2]

    if (rawValue === '>' || rawValue === '|') {
      const collected = []
      let cursor = index + 1

      while (cursor < lines.length) {
        const nextLine = lines[cursor]
        if (!/^\s+/.test(nextLine)) {
          break
        }

        collected.push(nextLine.trim())
        cursor += 1
      }

      frontmatter[key] = rawValue === '>'
        ? collected.join(' ').trim()
        : collected.join('\n').trim()
      index = cursor - 1
      continue
    }

    frontmatter[key] = rawValue.trim()
  }

  return frontmatter
}

function parseMarkdownTemplate(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  if (!match) {
    return { frontmatter: {}, body: content.trim() }
  }

  return {
    frontmatter: parseFrontmatter(match[1]),
    body: match[2].trim(),
  }
}

function toSnakeCase(value) {
  return value
    .replace(/\.md$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toLowerCase()
}

function escapeTomlString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
}

function escapeTomlMultiline(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"""')
}

function listTemplateFiles(directory, extension) {
  return fs
    .readdirSync(directory)
    .filter(file => file.endsWith(extension))
    .sort()
}

function readMarkdownTemplateFile(absolutePath) {
  const content = fs.readFileSync(absolutePath, 'utf8')
  const parsed = parseMarkdownTemplate(content)

  return {
    absolutePath,
    frontmatter: parsed.frontmatter,
    body: parsed.body,
  }
}

function getSharedAgents() {
  return listTemplateFiles(SHARED_AGENT_TEMPLATE_DIR, '.md').map(file => {
    const absolutePath = path.join(SHARED_AGENT_TEMPLATE_DIR, file)
    const parsed = readMarkdownTemplateFile(absolutePath)
    const baseName = file.replace(/\.md$/i, '')

    return {
      file,
      baseName,
      absolutePath,
      frontmatter: parsed.frontmatter,
      body: parsed.body,
      codexName: toSnakeCase(baseName),
    }
  })
}

function getRuntimeTemplatePath(runtime, type, fileName) {
  return path.join(RUNTIME_TEMPLATE_DIR, runtime, type, fileName)
}

function getRuntimeMarkdownOverride(runtime, type, fileName) {
  const absolutePath = getRuntimeTemplatePath(runtime, type, fileName)

  if (!fs.existsSync(absolutePath)) {
    return null
  }

  return readMarkdownTemplateFile(absolutePath)
}

function replaceRuntimePlaceholders(content, runtimeConfig) {
  return content
    .replace(/\{\{INSTRUCTIONS_FILE\}\}/g, runtimeConfig.instructionsFile)
    .replace(/\bCLAUDE\.md\b/g, runtimeConfig.instructionsFile)
    .replace(/\.claude\/agents/g, runtimeConfig.outputDirectory)
}

function getAgentTemplateForRuntime(agent, runtimeConfig) {
  return getRuntimeMarkdownOverride(runtimeConfig.id, 'agents', agent.file) || agent
}

function getRuntimeSpecificInstructions(agent, runtimeConfig) {
  const template = getAgentTemplateForRuntime(agent, runtimeConfig)
  return replaceRuntimePlaceholders(template.body, runtimeConfig)
}

function getAgentMetadata(agent, runtimeConfig) {
  const template = getAgentTemplateForRuntime(agent, runtimeConfig)

  return {
    name: template.frontmatter.name || agent.frontmatter.name || agent.baseName,
    description: template.frontmatter.description || agent.frontmatter.description || `${agent.baseName} agent`,
  }
}

function renderClaudeAgent(agent, runtimeConfig) {
  const metadata = getAgentMetadata(agent, runtimeConfig)
  const profile = getAgentRuntimeProfile('claude', agent.baseName)
  const instructions = getRuntimeSpecificInstructions(agent, runtimeConfig)

  return [
    '---',
    `name: ${metadata.name}`,
    `description: ${JSON.stringify(metadata.description)}`,
    `tools: ${profile.tools}`,
    `model: ${profile.model}`,
    '---',
    '',
    instructions,
    '',
  ].join('\n')
}

function renderCodexAgent(agent, runtimeConfig) {
  const metadata = getAgentMetadata(agent, runtimeConfig)
  const profile = getAgentRuntimeProfile('codex', agent.baseName)
  const instructions = getRuntimeSpecificInstructions(agent, runtimeConfig)

  return [
    `name = "${toSnakeCase(metadata.name)}"`,
    `description = "${escapeTomlString(metadata.description)}"`,
    `model = "${profile.model}"`,
    `model_reasoning_effort = "${profile.modelReasoningEffort}"`,
    `sandbox_mode = "${profile.sandboxMode}"`,
    'developer_instructions = """',
    `${escapeTomlMultiline(instructions)}`,
    '"""',
    '',
  ].join('\n')
}

function renderGeminiCommand(agent, runtimeConfig) {
  const metadata = getAgentMetadata(agent, runtimeConfig)
  const instructions = getRuntimeSpecificInstructions(agent, runtimeConfig)
  const prompt = [
    `You are running the 01x ${agent.baseName} workflow for this project.`,
    `Follow ${runtimeConfig.instructionsFile} exactly and execute only this role.`,
    '',
    instructions,
  ].join('\n')

  return [
    `description = "${escapeTomlString(metadata.description)}"`,
    'prompt = """',
    `${escapeTomlMultiline(prompt)}`,
    '"""',
    '',
  ].join('\n')
}

function renderGeminiFixPrReview(runtimeConfig, prReviewAgent) {
  if (!prReviewAgent) {
    throw new Error('pr-review-agent template not found; cannot render fix-pr-review.toml')
  }

  const commandTemplatePath = getRuntimeTemplatePath('gemini', 'commands', 'fix-pr-review.md')
  const commandTemplate = fs.readFileSync(commandTemplatePath, 'utf8')
  const prompt = replaceRuntimePlaceholders(
    commandTemplate
      .replace(/\{\{PR_REVIEW_INSTRUCTIONS\}\}/g, prReviewAgent.body),
    runtimeConfig
  )

  return [
    'description = "Run the PR review fix loop for the current branch."',
    'prompt = """',
    `${escapeTomlMultiline(prompt)}`,
    '"""',
    '',
  ].join('\n')
}

function renderCodexConfig() {
  return [
    '[agents]',
    'max_threads = 6',
    'max_depth = 1',
    '',
  ].join('\n')
}

function renderRuntimeMarker({ runtime, targetDirectoryMode }) {
  return `${JSON.stringify({
    version: VERSION,
    runtime,
    targetDirectoryMode,
  }, null, 2)}\n`
}

function renderOperatingManual(projectName, runtime) {
  const runtimeConfig = getRuntimeConfig(runtime)

  return `# ${projectName} — Project Operating Manual

## Runtime
This project was scaffolded for ${runtimeConfig.label}.
Primary operating file: \`${runtimeConfig.instructionsFile}\`
Runtime-specific automation lives in \`${runtimeConfig.outputDirectory}\`.

## Entry Point
${runtimeConfig.invocationHeading}

\`\`\`
${runtimeConfig.invocationCommand}
\`\`\`

## Agent System Overview
This project uses a multi-phase 01x orchestration system.
Never start coding without reading the planning docs first.
Never skip the human gates.

## Phase Order
0. Architect Agent   → scaffolds repo, installs packages, configures infra, scaffolds design tokens
1. Planning Agents   → produce the 5 spec docs from 01x/product-seed.md
2. Review Agent      → validates all 5 docs for alignment
3. Build Loop        → build → test → review → fix → repeat per story
4. UI/UX Gate        → validates the built frontend against design-spec UI Assertions via PinchTab
5. PR Review Loop    → opens PR, fixes review comments, replies and resolves threads

## Documentation References
- Product seed:    @01x/product-seed.md
- System design:   @01x/system-design.md
- Milestones:      @01x/milestones.md
- User stories:    @01x/user-stories.md
- Design spec:     @01x/design-spec.md
- Product brief:   @01x/product-brief.md
- Review notes:    @01x/review-notes.md
- Build log:       @01x/build/build-log.md
- UI review:       @01x/build/ui-review-report.md
- UI failures:     @01x/build/ui-review-failures.md
- Current story:   @01x/build/current-story.md
- Test report:     @01x/build/test-report.md
- Fix notes:       @01x/build/fix-notes.md
- Blocked:         @01x/build/blocked.md
- Scaffold report: @01x/build/scaffold-report.md

## Architecture Decisions — DO NOT OVERRIDE
These are set during planning. Build agents must respect them.
Read 01x/system-design.md in full before writing code.

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

## UI/UX Review Gate
Requires PinchTab running at localhost:9867 and the dev server running.
Start PinchTab before milestone completion: \`pinchtab &\`
Backend-only milestones without UI Assertions in design-spec.md are skipped automatically.

## Post-PR Review Loop
After opening a milestone PR, run the pr-review-agent workflow.
It polls for actionable review comments, fixes them, replies with the fix commit SHA,
resolves the thread, verifies tests pass, then pushes the changes.

## Agent Loop — DO NOT OVERRIDE
Use only the build loop defined in this file.
Do not invent a second orchestration system on top of the 01x workflow.

## Session Management — Cache Rules
- Use the runtime-specific compaction command instead of restarting the workflow.
- Keep state in 01x/build files, not only in chat memory.
- Never change the tool set or model mid-milestone without a concrete reason.

## Branch Rules — NEVER COMMIT TO MAIN
- Always check \`git branch --show-current\` before starting milestone work.
- If the current branch is \`main\`, immediately create \`milestone/X\`.
- All implementation work must happen on a \`milestone/X\` branch.
- Never commit directly to \`main\`.

## Build Loop Rules
- Max 3 fix cycles per story — then escalate via blocked.md
- Never modify test assertions to make tests pass
- Commit after every passing story with the story ID in the commit message
- Human gate required between milestones
`
}

function renderProjectReadme(projectName, runtime) {
  const runtimeConfig = getRuntimeConfig(runtime)

  return `# ${projectName}

> Replace this summary with what your product does, who it is for, and why it matters.

## Overview

This README should describe the product itself.

Suggested sections to keep here:

- what the product does
- who it is for
- how to run or deploy it
- architecture notes that future humans need

## 01x Workflow

This project was scaffolded for ${runtimeConfig.label}.
The operational workflow lives in \`01x/HOWTO.md\`.

## Planning Source of Truth

\`01x/product-seed.md\` is the human-authored source of truth for the initial planning pass.

## Scaffold Metadata

- Runtime: ${runtimeConfig.label}
- Operating manual: \`${runtimeConfig.instructionsFile}\`
- Workflow guide: \`01x/HOWTO.md\`
- Environment preflight: \`doctor.sh\`
`
}

function renderHowto(projectName, runtime) {
  const runtimeConfig = getRuntimeConfig(runtime)

  return `# ${projectName} — 01x Workflow Guide

## Runtime

- Runtime: ${runtimeConfig.label}
- Operating manual: \`${runtimeConfig.instructionsFile}\`
- Runtime automation directory: \`${runtimeConfig.outputDirectory}\`
- Runtime marker: \`${RUNTIME_MARKER_PATH}\`

## Step 1 — Fill in the product seed

Open \`${PRODUCT_SEED_PATH}\` and describe your product.
This is the only file you write manually before the workflow begins.

## Step 2 — Start ${runtimeConfig.label}

${runtimeConfig.invocationHeading}

\`\`\`
${runtimeConfig.invocationCommand}
\`\`\`

## Step 3 — Approve the gates

The workflow creates 5 planning docs, runs a review pass, then stops for human approval:

\`\`\`
✅ PLANNING COMPLETE — GATE 1
→ Read 01x/review-notes.md, then type: proceed with scaffold

✅ SCAFFOLD COMPLETE — GATE 2
→ Check 01x/build/scaffold-report.md, then type: proceed with milestone 1
\`\`\`

## Step 4 — Build

The build loop runs story by story:

\`\`\`
build-agent → test-agent → build-review-agent → fix → repeat
\`\`\`

At the end of each milestone:
- UI/UX review runs if design-spec.md defines UI Assertions
- a milestone PR is opened
- the PR review loop fixes actionable review comments

## Workflow Files

- Product seed: \`${PRODUCT_SEED_PATH}\`
- Build state: \`${BUILD_DIR}/\`
- Review notes: \`01x/review-notes.md\`
- Scaffold report: \`01x/build/scaffold-report.md\`
- Runtime marker: \`${RUNTIME_MARKER_PATH}\`

## The Agents

| Agent | Phase | Role |
|---|---|---|
| orchestrator | — | Master conductor. The only workflow entry point. |
| system-design-agent | 1 | Technical blueprint |
| milestone-agent | 1 | Delivery plan |
| user-stories-agent | 1 | Stories with acceptance criteria and edge cases |
| design-spec-agent | 1 | Design system, tokens, and UI assertions |
| product-brief-agent | 1 | Product positioning and personas |
| review-agent | 2 | Cross-checks all 5 planning docs for alignment |
| architect-agent | 0 | Scaffolds repo, installs packages, sets up infra |
| build-agent | 3 | TDD implementation |
| test-agent | 3 | Test runner and reporter |
| build-review-agent | 3 | Code review gate for each story |
| cache-health-agent | utility | Diagnoses slow or expensive sessions |
| ui-ux-review-agent | 3 gate | Validates UI assertions through PinchTab |
| pr-review-agent | 4 | Fixes actionable PR review comments |

## Session Tips

- Run \`bash doctor.sh\` before starting.
- Use the same session across stories within a milestone.
- Keep progress in \`${BUILD_DIR}/\`.
- If sessions slow down, run the cache-health-agent workflow.
`
}

function renderProductSeed(projectName) {
  return `# Product Seed — ${projectName}

> Fill this in after your ideation session.
> This is the single source of truth for all agents.
> Be specific — vague seeds produce vague plans.

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

## Design Direction
[The visual and interactive personality of this product. Cover: aesthetic mood, palette
direction (dark/light/neutral), typography character, density feel, motion philosophy,
and microcopy tone. Name reference products if you have them ("feels like Linear").
If no strong opinion: "No strong preference — leave to design-spec-agent."]
`
}

function renderGitIgnore() {
  return '.env\n.env.local\n.env.*.local\nnode_modules/\n.next/\ndist/\n*.log\n.DS_Store\n'
}

function buildScaffoldFiles({ projectName, runtime, targetDirectoryMode }) {
  const runtimeConfig = getRuntimeConfig(runtime)
  const files = new Map()
  const doctorTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'doctor.sh'), 'utf8')

  files.set(runtimeConfig.instructionsFile, {
    content: renderOperatingManual(projectName, runtime),
  })
  files.set('README.md', {
    content: renderProjectReadme(projectName, runtime),
  })
  files.set(HOWTO_PATH, {
    content: renderHowto(projectName, runtime),
  })
  files.set('.gitignore', {
    content: renderGitIgnore(),
    skipIfExists: true,
  })
  files.set(PRODUCT_SEED_PATH, {
    content: renderProductSeed(projectName),
  })
  files.set(path.join(BUILD_DIR, '.gitkeep'), {
    content: '',
  })
  files.set(RUNTIME_MARKER_PATH, {
    content: renderRuntimeMarker({ runtime, targetDirectoryMode }),
  })
  files.set('doctor.sh', {
    content: doctorTemplate,
    mode: 0o755,
  })

  const sharedAgents = getSharedAgents()

  if (runtime === 'claude') {
    for (const agent of sharedAgents) {
      files.set(path.join('.claude', 'agents', agent.file), {
        content: renderClaudeAgent(agent, runtimeConfig),
      })
    }

    for (const file of listTemplateFiles(CLAUDE_COMMAND_TEMPLATE_DIR, '.md')) {
      files.set(path.join('.claude', 'commands', file), {
        content: fs.readFileSync(path.join(CLAUDE_COMMAND_TEMPLATE_DIR, file), 'utf8'),
      })
    }

    return files
  }

  if (runtime === 'codex') {
    files.set(path.join('.codex', 'config.toml'), {
      content: renderCodexConfig(),
    })

    for (const agent of sharedAgents) {
      files.set(path.join('.codex', 'agents', `${agent.codexName}.toml`), {
        content: renderCodexAgent(agent, runtimeConfig),
      })
    }

    return files
  }

  const prReviewAgent = sharedAgents.find(agent => agent.baseName === 'pr-review-agent')

  for (const agent of sharedAgents) {
    files.set(path.join('.gemini', 'commands', '01x', `${agent.baseName}.toml`), {
      content: renderGeminiCommand(agent, runtimeConfig),
    })
  }

  files.set(path.join('.gemini', 'commands', '01x', 'fix-pr-review.toml'), {
    content: renderGeminiFixPrReview(runtimeConfig, prReviewAgent),
  })

  return files
}

function getPlannedChanges({ targetDir, projectName, runtime, targetDirectoryMode }) {
  const files = buildScaffoldFiles({ projectName, runtime, targetDirectoryMode })
  const changes = []

  for (const [relativePath, spec] of files.entries()) {
    const absolutePath = path.join(targetDir, relativePath)
    const exists = fs.existsSync(absolutePath)

    if (exists && spec.skipIfExists) {
      continue
    }

    changes.push({
      path: relativePath,
      status: exists ? 'overwrite' : 'create',
    })
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path))
}

function writeScaffold({ targetDir, projectName, runtime, targetDirectoryMode }) {
  const files = buildScaffoldFiles({ projectName, runtime, targetDirectoryMode })
  const writtenPaths = []

  fs.mkdirSync(targetDir, { recursive: true })

  for (const [relativePath, spec] of files.entries()) {
    const absolutePath = path.join(targetDir, relativePath)

    if (spec.skipIfExists && fs.existsSync(absolutePath)) {
      continue
    }

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
    fs.writeFileSync(absolutePath, spec.content)

    if (spec.mode) {
      fs.chmodSync(absolutePath, spec.mode)
    }

    writtenPaths.push(relativePath)
  }

  return writtenPaths
}

function getDirectoryEntries(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return []
  }

  return fs.readdirSync(targetDir).filter(entry => entry !== '.' && entry !== '..')
}

function initialiseGit({ targetDir, preexistingEntries }) {
  const result = {
    initialized: false,
    committed: false,
    note: '',
  }

  try {
    const gitDir = path.join(targetDir, '.git')
    if (!fs.existsSync(gitDir)) {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' })
      result.initialized = true
    }

    if (preexistingEntries.length === 0) {
      execSync('git add .', { cwd: targetDir, stdio: 'ignore' })
      execSync('git commit -m "chore: scaffold 01x agent system"', { cwd: targetDir, stdio: 'ignore' })
      result.committed = true
      return result
    }

    if (result.initialized) {
      result.note = 'Git repository initialised, but the initial commit was skipped because the target directory already contained files.'
    } else {
      result.note = 'Existing git repository detected, so the scaffold was not auto-committed.'
    }
  } catch (error) {
    result.note = `Git setup failed: ${error.message}`
  }

  return result
}

function getPreviewPaths(runtime, projectName) {
  const files = Array.from(
    buildScaffoldFiles({
      projectName,
      runtime,
      targetDirectoryMode: 'current',
    }).keys()
  )

  return files.sort()
}

module.exports = {
  _internal: {
    escapeTomlMultiline,
  },
  VERSION,
  RUNTIMES,
  buildScaffoldFiles,
  getDirectoryEntries,
  getPlannedChanges,
  getPreviewPaths,
  getRuntimeConfig,
  initialiseGit,
  renderHowto,
  renderProjectReadme,
  resolveTargetDirectory,
  slugifyProjectName,
  writeScaffold,
}
