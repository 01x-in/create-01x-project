#!/usr/bin/env bash
# doctor.sh — preflight check for the 01x multi-agent build system
# Run this before starting a build session to catch missing dependencies early.
# Usage: bash doctor.sh

set -euo pipefail

PREFLIGHT_FAILED=0
RUNTIME="unknown"

if [ -f "01x/runtime.json" ]; then
  DETECTED_RUNTIME=$(sed -n 's/.*"runtime"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' 01x/runtime.json | head -1)
  if [ -n "${DETECTED_RUNTIME}" ]; then
    RUNTIME="${DETECTED_RUNTIME}"
  fi
fi

echo ""
echo "  01x Agent System — Environment Check"
echo "  ───────────────────────────────────"
echo ""
echo "Runtime: ${RUNTIME}"
echo ""

echo "Core:"

if command -v node >/dev/null 2>&1; then
  echo "  ✓ Node.js: $(node --version)"
else
  echo "  ✗ Node.js not found — install from https://nodejs.org"
  PREFLIGHT_FAILED=1
fi

if command -v git >/dev/null 2>&1; then
  echo "  ✓ git: $(git --version | head -1)"
else
  echo "  ✗ git not found"
  PREFLIGHT_FAILED=1
fi

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    echo "  ✓ gh CLI: authenticated"
  else
    echo "  ⚠ gh CLI: installed but not authenticated — run: gh auth login"
    echo "    PR review automation will fail without authentication"
  fi
else
  echo "  ⚠ gh CLI not found — PR review automation will not function"
  echo "    Install: https://cli.github.com"
fi

echo ""
echo "Project:"

if [ -f "01x/runtime.json" ]; then
  echo "  ✓ 01x/runtime.json"
else
  echo "  ✗ 01x/runtime.json not found — rerun create-01x-project"
  PREFLIGHT_FAILED=1
fi

if [ -f "01x/product-seed.md" ]; then
  echo "  ✓ 01x/product-seed.md"
else
  echo "  ✗ 01x/product-seed.md not found — fill this in before running the workflow"
  PREFLIGHT_FAILED=1
fi

case "${RUNTIME}" in
  claude)
    if [ -f "CLAUDE.md" ]; then
      echo "  ✓ CLAUDE.md"
    else
      echo "  ✗ CLAUDE.md not found"
      PREFLIGHT_FAILED=1
    fi

    if [ -d ".claude/agents" ]; then
      AGENT_COUNT=$(find .claude/agents -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')
      echo "  ✓ .claude/agents/ (${AGENT_COUNT} agents)"
    else
      echo "  ✗ .claude/agents/ not found"
      PREFLIGHT_FAILED=1
    fi
    ;;
  codex)
    if [ -f "AGENTS.md" ]; then
      echo "  ✓ AGENTS.md"
    else
      echo "  ✗ AGENTS.md not found"
      PREFLIGHT_FAILED=1
    fi

    if [ -d ".codex/agents" ]; then
      AGENT_COUNT=$(find .codex/agents -maxdepth 1 -name '*.toml' | wc -l | tr -d ' ')
      echo "  ✓ .codex/agents/ (${AGENT_COUNT} agents)"
    else
      echo "  ✗ .codex/agents/ not found"
      PREFLIGHT_FAILED=1
    fi

    if command -v codex >/dev/null 2>&1; then
      echo "  ✓ codex CLI: installed"
    else
      echo "  ✗ codex CLI not found"
      echo "    Install: https://developers.openai.com/codex/"
      PREFLIGHT_FAILED=1
    fi
    ;;
  gemini)
    if [ -f "GEMINI.md" ]; then
      echo "  ✓ GEMINI.md"
    else
      echo "  ✗ GEMINI.md not found"
      PREFLIGHT_FAILED=1
    fi

    if [ -d ".gemini/commands/01x" ]; then
      COMMAND_COUNT=$(find .gemini/commands/01x -maxdepth 1 -name '*.toml' | wc -l | tr -d ' ')
      echo "  ✓ .gemini/commands/01x/ (${COMMAND_COUNT} commands)"
    else
      echo "  ✗ .gemini/commands/01x/ not found"
      PREFLIGHT_FAILED=1
    fi

    if command -v gemini >/dev/null 2>&1; then
      echo "  ✓ gemini CLI: installed"
    else
      echo "  ✗ gemini CLI not found"
      echo "    Install: https://google-gemini.github.io/gemini-cli/"
      PREFLIGHT_FAILED=1
    fi
    ;;
  *)
    echo "  ⚠ Unknown runtime — expected claude, codex, or gemini"
    ;;
esac

echo ""
echo "UI/UX Review (required for frontend milestones):"

if command -v google-chrome-stable >/dev/null 2>&1; then
  echo "  ✓ Chrome: $(google-chrome-stable --version)"
elif command -v google-chrome >/dev/null 2>&1; then
  echo "  ✓ Chrome: $(google-chrome --version)"
elif command -v chromium-browser >/dev/null 2>&1; then
  echo "  ✓ Chromium: $(chromium-browser --version)"
elif command -v chromium >/dev/null 2>&1; then
  echo "  ✓ Chromium: $(chromium --version)"
else
  echo "  ✗ Chrome/Chromium not found"
  echo "    Install: https://www.google.com/chrome"
  echo "    (required by PinchTab for browser automation)"
  PREFLIGHT_FAILED=1
fi

if command -v pinchtab >/dev/null 2>&1; then
  PINCHTAB_VERSION=$(pinchtab --version 2>/dev/null || echo "installed")
  echo "  ✓ PinchTab binary: ${PINCHTAB_VERSION}"
else
  echo "  ✗ PinchTab not found"
  echo "    Install (Go):   go install github.com/pinchtab/pinchtab@latest"
  echo "    Install (Docker): docker run -p 9867:9867 pinchtab/pinchtab"
  PREFLIGHT_FAILED=1
fi

if curl -s http://localhost:9867/health >/dev/null 2>&1; then
  echo "  ✓ PinchTab server: running at localhost:9867"
else
  echo "  ⚠ PinchTab server: not running"
  echo "    Start before milestone completion: pinchtab &"
  echo "    (only required when the UI/UX review gate runs)"
fi

echo ""

if [ "${PREFLIGHT_FAILED}" -eq 0 ]; then
  echo "  ✅ All checks passed. Ready to build."
  echo ""
  case "${RUNTIME}" in
    claude)
      echo "  Open Claude Code and type:"
      echo ""
      echo "    Run the orchestrator agent."
      ;;
    codex)
      echo "  Open Codex CLI in this folder and type:"
      echo ""
      echo "    Spawn the orchestrator agent and let it coordinate the workflow."
      ;;
    gemini)
      echo "  Open Gemini CLI in this folder and run:"
      echo ""
      echo "    /01x:orchestrator"
      ;;
  esac
  echo ""
else
  echo "  ❌ Preflight failed. Fix the issues above before starting."
  echo ""
  exit 1
fi
