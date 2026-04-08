'use strict'

const RUNTIMES = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    instructionsFile: 'CLAUDE.md',
    outputDirectory: '.claude/agents',
    invocationHeading: 'Open Claude Code and type:',
    invocationCommand: 'Run the orchestrator agent.',
    commandPath: '.claude/commands/fix-pr-review.md',
  },
  codex: {
    id: 'codex',
    label: 'Codex CLI',
    instructionsFile: 'AGENTS.md',
    outputDirectory: '.codex/agents',
    invocationHeading: 'Open Codex CLI in this folder and type:',
    invocationCommand: 'Spawn the orchestrator agent and let it coordinate the workflow.',
    commandPath: null,
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini CLI',
    instructionsFile: 'GEMINI.md',
    outputDirectory: '.gemini/commands/01x',
    invocationHeading: 'Open Gemini CLI in this folder and run:',
    invocationCommand: '/01x:orchestrator',
    commandPath: '.gemini/commands/01x/fix-pr-review.toml',
  },
}

function getRuntimeConfig(runtime) {
  const config = RUNTIMES[runtime]
  if (!config) {
    throw new Error(`Unsupported runtime: ${runtime}`)
  }

  return config
}

module.exports = {
  RUNTIMES,
  getRuntimeConfig,
}
