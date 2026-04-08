'use strict'

const MODEL_TIERS = {
  claude: {
    flagship: { model: 'claude-opus-4-6' },
    balanced: { model: 'claude-sonnet-4-6' },
    utility: { model: 'claude-haiku-4-5-20251001' },
  },
  codex: {
    flagship: {
      model: 'gpt-5.4',
      modelReasoningEffort: 'high',
    },
    balanced: {
      model: 'gpt-5.4-mini',
      modelReasoningEffort: 'medium',
    },
  },
  gemini: {
    default: {},
  },
}

const AGENT_RUNTIME_PROFILES = {
  claude: {
    default: { tier: 'balanced', tools: 'Read, Write' },
    orchestrator: { tier: 'flagship', tools: 'Task, Read, Write, Bash' },
    'architect-agent': { tier: 'flagship', tools: 'Read, Write, Bash, Glob' },
    'build-agent': { tier: 'balanced', tools: 'Read, Write, Edit, Bash, Glob, Grep' },
    'build-review-agent': { tier: 'flagship', tools: 'Read, Write, Glob, Grep' },
    'cache-health-agent': { tier: 'utility', tools: 'Read, Bash' },
    'design-spec-agent': { tier: 'flagship', tools: 'Read, Write' },
    'pr-review-agent': { tier: 'balanced', tools: 'Read, Write, Edit, Bash, Glob, Grep' },
    'review-agent': { tier: 'flagship', tools: 'Read, Write' },
    'test-agent': { tier: 'balanced', tools: 'Read, Write, Bash' },
    'ui-ux-review-agent': { tier: 'balanced', tools: 'Read, Write, Bash' },
  },
  codex: {
    default: { tier: 'balanced', sandboxMode: 'workspace-write' },
    orchestrator: { tier: 'flagship', sandboxMode: 'workspace-write' },
    'architect-agent': { tier: 'flagship', sandboxMode: 'workspace-write' },
    'build-agent': { tier: 'flagship', sandboxMode: 'workspace-write' },
    'build-review-agent': { tier: 'flagship', sandboxMode: 'workspace-write' },
    'cache-health-agent': { tier: 'balanced', sandboxMode: 'read-only' },
    'pr-review-agent': { tier: 'flagship', sandboxMode: 'workspace-write' },
    'review-agent': { tier: 'flagship', sandboxMode: 'workspace-write' },
    'ui-ux-review-agent': { tier: 'flagship', sandboxMode: 'workspace-write' },
  },
  gemini: {
    default: { tier: 'default' },
  },
}

function getAgentRuntimeProfile(runtime, agentBaseName) {
  const runtimeProfiles = AGENT_RUNTIME_PROFILES[runtime]

  if (!runtimeProfiles) {
    throw new Error(`Unsupported runtime for agent profile: ${runtime}`)
  }

  const tierModels = MODEL_TIERS[runtime] || {}
  const baseProfile = runtimeProfiles.default || {}
  const agentProfile = runtimeProfiles[agentBaseName] || {}
  const resolvedProfile = {
    ...baseProfile,
    ...agentProfile,
  }

  if (resolvedProfile.tier && tierModels[resolvedProfile.tier]) {
    Object.assign(resolvedProfile, tierModels[resolvedProfile.tier])
  }

  delete resolvedProfile.tier
  return resolvedProfile
}

module.exports = {
  AGENT_RUNTIME_PROFILES,
  MODEL_TIERS,
  getAgentRuntimeProfile,
}
