# create-01x-project

> Scaffold the 01x multi-agent build system into any project for Claude Code, Codex CLI, or Gemini CLI.

## What It Does

`create-01x-project` installs the 01x workflow into a project:

- 14 specialist agents or commands
- a shared `01x/` planning and build-state system
- a human-gated workflow for planning, scaffold, build, UI review, and PR review
- runtime-specific entry files for Claude Code, Codex CLI, or Gemini CLI

```bash
npx create-01x-project
```

## CLI Flow

The generator now asks:

1. `Which AI coding agent do you use?`
2. `Project name?`
3. Whether to scaffold into the current folder or a new folder
4. `Initialise a git repo?`

If the chosen target directory already contains files, the generator shows an explicit create/overwrite preview and asks for confirmation before it writes anything.

## Runtime Support

| Runtime | Root instructions file | Runtime automation output |
|---|---|---|
| Claude Code | `CLAUDE.md` | `.claude/agents/*.md`, `.claude/commands/*` |
| Codex CLI | `AGENTS.md` | `.codex/agents/*.toml`, `.codex/config.toml` |
| Gemini CLI | `GEMINI.md` | `.gemini/commands/01x/*.toml` |

All three runtimes share the same 01x workflow and `01x/` state files.

## Example: Scaffold in the Current Folder

```bash
mkdir my-app && cd my-app
npx create-01x-project
```

Example prompt flow:

```text
Which AI coding agent do you use? › Codex CLI
Project name? › My App
Scaffold project files in this folder (my-app)? › Yes
Initialise a git repo? › Yes
```

## Example: Scaffold into a New Folder

```bash
mkdir scratch && cd scratch
npx create-01x-project
```

Example prompt flow:

```text
Which AI coding agent do you use? › Gemini CLI
Project name? › PerishNote
Scaffold project files in the current folder (scratch)? › No
Folder name? › perishnote
Initialise a git repo? › Yes
```

This creates `./perishnote/` and scaffolds the 01x system there.

## What Gets Created

Shared files:

```text
your-project/
├── README.md
├── doctor.sh
├── .gitignore
└── 01x/
    ├── HOWTO.md
    ├── runtime.json
    ├── product-seed.md
    └── build/
        └── .gitkeep
```

Runtime-specific additions:

### Claude Code

```text
CLAUDE.md
.claude/
├── agents/
│   ├── orchestrator.md
│   ├── architect-agent.md
│   ├── build-agent.md
│   ├── build-review-agent.md
│   ├── cache-health-agent.md
│   ├── design-spec-agent.md
│   ├── milestone-agent.md
│   ├── pr-review-agent.md
│   ├── product-brief-agent.md
│   ├── review-agent.md
│   ├── system-design-agent.md
│   ├── test-agent.md
│   ├── ui-ux-review-agent.md
│   └── user-stories-agent.md
└── commands/
    └── fix-pr-review.md
```

### Codex CLI

```text
AGENTS.md
.codex/
├── config.toml
└── agents/
    ├── orchestrator.toml
    ├── architect_agent.toml
    ├── build_agent.toml
    ├── build_review_agent.toml
    ├── cache_health_agent.toml
    ├── design_spec_agent.toml
    ├── milestone_agent.toml
    ├── pr_review_agent.toml
    ├── product_brief_agent.toml
    ├── review_agent.toml
    ├── system_design_agent.toml
    ├── test_agent.toml
    ├── ui_ux_review_agent.toml
    └── user_stories_agent.toml
```

### Gemini CLI

```text
GEMINI.md
.gemini/
└── commands/
    └── 01x/
        ├── orchestrator.toml
        ├── architect-agent.toml
        ├── build-agent.toml
        ├── build-review-agent.toml
        ├── cache-health-agent.toml
        ├── design-spec-agent.toml
        ├── fix-pr-review.toml
        ├── milestone-agent.toml
        ├── pr-review-agent.toml
        ├── product-brief-agent.toml
        ├── review-agent.toml
        ├── system-design-agent.toml
        ├── test-agent.toml
        ├── ui-ux-review-agent.toml
        └── user-stories-agent.toml
```

## Workflow After Scaffolding

### 1. Fill the seed

Write `01x/product-seed.md`. This is the only file you author manually before the workflow starts.

### 2. Use the workflow guide

The generated root `README.md` starts as a stub and is then rewritten by `readme-agent`
from the approved planning docs so it describes the product.
The operational instructions live in `01x/HOWTO.md`.
For long sessions and bulky reads/logs in Claude Code, the generated workflow also includes
optional `context-mode` guidance: [mksglu/context-mode](https://github.com/mksglu/context-mode).

### 3. Run the orchestrator

- Claude Code: `Run the orchestrator agent.`
- Codex CLI: `Spawn the orchestrator agent and let it coordinate the workflow.`
- Gemini CLI: `/01x:orchestrator`

### 4. Approve the human gates

The workflow stops twice before code generation:

```text
✅ PLANNING COMPLETE — GATE 1
All 5 docs approved. Ready to scaffold.
Type: proceed with scaffold

✅ SCAFFOLD COMPLETE — GATE 2
Project is set up and ready to build.
Type: proceed with milestone 1
```

### 5. Build

The runtime then uses the same 01x build loop:

```text
build-agent → test-agent → build-review-agent → fix → repeat
```

At milestone completion:

- UI/UX review runs if `design-spec.md` defines UI Assertions
- a milestone PR is opened
- the PR review loop handles actionable review comments

## Runtime Notes

### Claude Code

- Uses native Claude agent markdown files in `.claude/agents/`
- Keeps the original `/fix-pr-review` command wrapper

### Codex CLI

- Uses `AGENTS.md` plus project-scoped custom subagents in `.codex/agents/`
- Adds `.codex/config.toml` to set the project agent fan-out defaults

### Gemini CLI

- Uses `GEMINI.md` plus project-scoped commands in `.gemini/commands/01x/`
- Keeps the same workflow, but the orchestrator command is written for sequential fallback rather than native subagents

## Preflight

Run:

```bash
bash doctor.sh
```

The script checks:

- core tools like Node.js, git, and `gh`
- runtime-specific files from `01x/runtime.json`
- the relevant runtime binary (`codex` or `gemini` where applicable)
- PinchTab and browser prerequisites for the UI review gate

## Development Notes

This repository now generates runtime-specific output from one shared prompt corpus:

- Shared prompt bodies live in `templates/agents-shared/`
- Claude markdown agents are rendered from those templates with Claude runtime profiles
- Codex `.toml` agents are rendered from those templates with Codex runtime profiles
- Gemini `.toml` commands are rendered from those templates with Gemini-specific wrappers

## Testing

```bash
npm test
```
