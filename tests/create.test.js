const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  _internal,
  getPlannedChanges,
  getPreviewPaths,
  renderHowto,
  renderProjectReadme,
  resolveTargetDirectory,
  slugifyProjectName,
  writeScaffold,
} = require('../lib/scaffold');

function makeTempDir(prefix = 'create-01x-project-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('slugifyProjectName normalizes product names into folder names', () => {
  assert.equal(slugifyProjectName('Perish Note'), 'perish-note');
  assert.equal(slugifyProjectName('  Codex + Gemini  '), 'codex-gemini');
  assert.equal(slugifyProjectName('***'), 'project');
  assert.equal(slugifyProjectName(null), 'project');
  assert.equal(slugifyProjectName(undefined), 'project');
});

test('resolveTargetDirectory keeps scaffolding in the current folder when selected', () => {
  const cwd = '/tmp/existing-app';
  const resolved = resolveTargetDirectory({
    cwd,
    projectName: 'Perish Note',
    useCurrentDirectory: true,
    folderName: 'ignored',
  });

  assert.equal(resolved.targetDir, cwd);
  assert.equal(resolved.targetDirectoryMode, 'current');
  assert.equal(resolved.suggestedFolderName, 'perish-note');
});

test('resolveTargetDirectory creates a new folder when the user declines the current directory', () => {
  const cwd = '/tmp/scratch';
  const resolved = resolveTargetDirectory({
    cwd,
    projectName: 'Perish Note',
    useCurrentDirectory: false,
    folderName: 'perishnote',
  });

  assert.equal(resolved.targetDir, path.join(cwd, 'perishnote'));
  assert.equal(resolved.targetDirectoryMode, 'custom');
  assert.equal(resolved.targetLabel, 'perishnote');
});

test('getPlannedChanges shows create and overwrite paths for non-empty targets', () => {
  const targetDir = makeTempDir();
  fs.writeFileSync(path.join(targetDir, 'README.md'), 'existing\n');
  fs.writeFileSync(path.join(targetDir, '.gitignore'), 'keep-me\n');

  const changes = getPlannedChanges({
    targetDir,
    projectName: 'Perish Note',
    runtime: 'claude',
    targetDirectoryMode: 'current',
  });

  assert.ok(changes.some(change => change.path === 'README.md' && change.status === 'overwrite'));
  assert.ok(changes.some(change => change.path === 'CLAUDE.md' && change.status === 'create'));
  assert.ok(!changes.some(change => change.path === '.gitignore'));
});

test('preview paths include HOWTO and runtime marker in 01x', () => {
  const previewPaths = getPreviewPaths('codex', 'Perish Note');

  assert.ok(previewPaths.includes('01x/HOWTO.md'));
  assert.ok(previewPaths.includes('01x/runtime.json'));
});

test('writeScaffold writes Claude-only runtime files', () => {
  const targetDir = makeTempDir();

  writeScaffold({
    targetDir,
    projectName: 'Perish Note',
    runtime: 'claude',
    targetDirectoryMode: 'current',
  });

  const orchestratorTemplate = readFile(path.join(targetDir, '.claude', 'agents', 'orchestrator.md'));

  assert.ok(fs.existsSync(path.join(targetDir, 'CLAUDE.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'agents', 'orchestrator.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.claude', 'commands', 'fix-pr-review.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '01x', 'runtime.json')));
  assert.ok(fs.existsSync(path.join(targetDir, '01x', 'HOWTO.md')));
  assert.match(orchestratorTemplate, /^model: claude-opus-4-6$/m);
  assert.match(orchestratorTemplate, /^tools: Task, Read, Write, Bash$/m);
  assert.ok(!fs.existsSync(path.join(targetDir, 'AGENTS.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, 'GEMINI.md')));
});

test('writeScaffold writes Codex-only runtime files with TOML agents', () => {
  const targetDir = makeTempDir();

  writeScaffold({
    targetDir,
    projectName: 'Perish Note',
    runtime: 'codex',
    targetDirectoryMode: 'current',
  });

  const orchestratorToml = readFile(path.join(targetDir, '.codex', 'agents', 'orchestrator.toml'));
  const reviewToml = readFile(path.join(targetDir, '.codex', 'agents', 'review_agent.toml'));

  assert.ok(fs.existsSync(path.join(targetDir, 'AGENTS.md')));
  assert.ok(fs.existsSync(path.join(targetDir, '.codex', 'config.toml')));
  assert.match(orchestratorToml, /model = "gpt-5.4"/);
  assert.match(orchestratorToml, /developer_instructions = """/);
  assert.match(orchestratorToml, /All 5 docs approved/);
  assert.doesNotMatch(orchestratorToml, /claude-(opus|sonnet|haiku)/);
  assert.match(reviewToml, /reads all 5 planning docs/i);
  assert.ok(!fs.existsSync(path.join(targetDir, 'CLAUDE.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, 'GEMINI.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, '.claude')));
});

test('writeScaffold writes Gemini-only runtime files with command TOML', () => {
  const targetDir = makeTempDir();

  writeScaffold({
    targetDir,
    projectName: 'Perish Note',
    runtime: 'gemini',
    targetDirectoryMode: 'custom',
  });

  const orchestratorToml = readFile(path.join(targetDir, '.gemini', 'commands', '01x', 'orchestrator.toml'));
  const fixPrReviewToml = readFile(path.join(targetDir, '.gemini', 'commands', '01x', 'fix-pr-review.toml'));
  const runtimeMarker = JSON.parse(readFile(path.join(targetDir, '01x', 'runtime.json')));

  assert.ok(fs.existsSync(path.join(targetDir, 'GEMINI.md')));
  assert.match(orchestratorToml, /prompt = """/);
  assert.match(orchestratorToml, /All 5 docs approved/);
  assert.match(fixPrReviewToml, /PR review loop/);
  assert.equal(runtimeMarker.runtime, 'gemini');
  assert.equal(runtimeMarker.targetDirectoryMode, 'custom');
  assert.ok(!fs.existsSync(path.join(targetDir, 'CLAUDE.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, 'AGENTS.md')));
  assert.ok(!fs.existsSync(path.join(targetDir, '.codex')));
});

test('generated README stays project-facing and points workflow docs to HOWTO', () => {
  const codexReadme = renderProjectReadme('Perish Note', 'codex');

  assert.match(codexReadme, /This README should describe the product itself\./);
  assert.match(codexReadme, /The operational workflow lives in `01x\/HOWTO\.md`\./);
  assert.match(codexReadme, /Planning Source of Truth/);
});

test('generated HOWTO includes runtime-specific next steps', () => {
  const codexHowto = renderHowto('Perish Note', 'codex');
  const geminiHowto = renderHowto('Perish Note', 'gemini');

  assert.match(codexHowto, /Open Codex CLI in this folder and type:/);
  assert.match(codexHowto, /Spawn the orchestrator agent and let it coordinate the workflow\./);
  assert.match(geminiHowto, /Open Gemini CLI in this folder and run:/);
  assert.match(geminiHowto, /\/01x:orchestrator/);
});

test('shared agent templates are runtime-neutral prompt sources', () => {
  const sharedOrchestrator = readFile(path.join(__dirname, '..', 'templates', 'agents-shared', 'orchestrator.md'));

  assert.doesNotMatch(sharedOrchestrator, /^model:/m);
  assert.doesNotMatch(sharedOrchestrator, /^tools:/m);
});

test('codex agent TOML preserves literal backslash sequences', () => {
  const escaped = _internal.escapeTomlMultiline('literal \\n path');

  assert.equal(escaped, 'literal \\\\n path');
});

test('runtime-aware doctor template checks codex and gemini outputs', () => {
  const doctorTemplate = readFile(path.join(__dirname, '..', 'templates', 'doctor.sh'));

  assert.match(doctorTemplate, /01x\/runtime\.json/);
  assert.match(doctorTemplate, /\.codex\/agents/);
  assert.match(doctorTemplate, /\.gemini\/commands\/01x/);
  assert.match(doctorTemplate, /codex CLI: installed/);
  assert.match(doctorTemplate, /gemini CLI: installed/);
});
