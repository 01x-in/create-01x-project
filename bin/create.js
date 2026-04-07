#!/usr/bin/env node

'use strict'

const path = require('path')
const prompts = require('prompts')
const kleur = require('kleur')
const ora = require('ora')

const {
  VERSION,
  getDirectoryEntries,
  getPlannedChanges,
  getPreviewPaths,
  getRuntimeConfig,
  initialiseGit,
  resolveTargetDirectory,
  slugifyProjectName,
  writeScaffold,
} = require('../lib/scaffold')

function printBanner() {
  console.log('')
  console.log(kleur.cyan().bold('  ╔══════════════════════════════════════════╗'))
  console.log(kleur.cyan().bold(`  ║   create-01x-project  v${VERSION.padEnd(5)}           ║`))
  console.log(kleur.cyan().bold('  ║   AI coding agent system scaffolder     ║'))
  console.log(kleur.cyan().bold('  ╚══════════════════════════════════════════╝'))
  console.log('')
}

function createPromptOptions() {
  return {
    onCancel: () => {
      console.log(kleur.red('\n  Cancelled.'))
      process.exit(1)
    },
  }
}

function printPreview({ projectName, runtime, rootLabel }) {
  const runtimeConfig = getRuntimeConfig(runtime)
  const previewPaths = getPreviewPaths(runtime, projectName)

  console.log('')
  console.log('  ' + kleur.bold('The following files will be scaffolded:'))
  console.log('')
  console.log(`  ${kleur.white(rootLabel)}/`)
  for (const relativePath of previewPaths) {
    console.log(`  ${kleur.dim('•')} ${kleur.white(relativePath)}`)
  }
  console.log('')
  console.log(`  Runtime: ${kleur.cyan(runtimeConfig.label)}`)
  console.log('')
}

function printNonEmptyDirectoryWarning(changes) {
  console.log(kleur.yellow('  Target directory already contains files.'))
  console.log('  ' + kleur.bold('The following scaffold paths will be created or overwritten:'))
  console.log('')

  for (const change of changes) {
    const label = change.status === 'overwrite'
      ? kleur.yellow('overwrite')
      : kleur.green('create')
    console.log(`  ${label.padEnd(18)} ${change.path}`)
  }

  console.log('')
}

async function run() {
  printBanner()

  const promptOptions = createPromptOptions()

  const { runtime } = await prompts(
    {
      type: 'select',
      name: 'runtime',
      message: 'Which AI coding agent do you use?',
      choices: [
        { title: 'Claude Code', value: 'claude' },
        { title: 'Codex CLI', value: 'codex' },
        { title: 'Gemini CLI', value: 'gemini' },
      ],
      initial: 0,
    },
    promptOptions
  )

  const { projectName } = await prompts(
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name?',
      initial: path.basename(process.cwd()),
      validate: value => value.trim().length > 0 || 'Project name is required',
    },
    promptOptions
  )

  const cwd = process.cwd()
  const currentFolderName = path.basename(cwd)
  const suggestedFolderName = slugifyProjectName(projectName)
  const currentFolderMatchesProject = currentFolderName === suggestedFolderName

  const { useCurrentDirectory } = await prompts(
    {
      type: 'confirm',
      name: 'useCurrentDirectory',
      message: currentFolderMatchesProject
        ? `Scaffold project files in this folder (${currentFolderName})?`
        : `Scaffold project files in the current folder (${currentFolderName})?`,
      initial: currentFolderMatchesProject,
    },
    promptOptions
  )

  let folderName = suggestedFolderName
  if (!useCurrentDirectory) {
    const folderPrompt = await prompts(
      {
        type: 'text',
        name: 'folderName',
        message: 'Folder name?',
        initial: suggestedFolderName,
        validate: value => value.trim().length > 0 || 'Folder name is required',
      },
      promptOptions
    )

    folderName = folderPrompt.folderName
  }

  const target = resolveTargetDirectory({
    cwd,
    projectName,
    useCurrentDirectory,
    folderName,
  })

  printPreview({
    projectName,
    runtime,
    rootLabel: target.targetLabel,
  })

  const { initGit } = await prompts(
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialise a git repo?',
      initial: true,
    },
    promptOptions
  )

  const preexistingEntries = getDirectoryEntries(target.targetDir)
  if (preexistingEntries.length > 0) {
    const changes = getPlannedChanges({
      targetDir: target.targetDir,
      projectName,
      runtime,
      targetDirectoryMode: target.targetDirectoryMode,
    })

    printNonEmptyDirectoryWarning(changes)

    const { continueWithNonEmptyDirectory } = await prompts(
      {
        type: 'confirm',
        name: 'continueWithNonEmptyDirectory',
        message: 'Continue scaffolding into this non-empty directory?',
        initial: false,
      },
      promptOptions
    )

    if (!continueWithNonEmptyDirectory) {
      console.log(kleur.red('\n  Cancelled.'))
      process.exit(1)
    }
  }

  console.log('')
  const spinner = ora('Scaffolding...').start()

  writeScaffold({
    targetDir: target.targetDir,
    projectName,
    runtime,
    targetDirectoryMode: target.targetDirectoryMode,
  })

  let gitResult = null
  if (initGit) {
    gitResult = initialiseGit({
      targetDir: target.targetDir,
      preexistingEntries,
    })
  }

  spinner.succeed('Done!')

  const runtimeConfig = getRuntimeConfig(runtime)

  console.log('')
  console.log(kleur.bold('  Next steps:'))
  console.log('')
  console.log(kleur.dim('  1.') + '  Fill in ' + kleur.green(path.join(target.targetLabel, '01x/product-seed.md')))
  console.log(kleur.dim('  2.') + '  Review ' + kleur.green(path.join(target.targetLabel, '01x/HOWTO.md')))
  console.log(kleur.dim('  3.') + `  Open ${kleur.white(target.targetLabel)} in ${runtimeConfig.label}`)
  console.log(kleur.dim('  4.') + `  ${runtimeConfig.invocationHeading}`)
  console.log('')
  console.log(kleur.cyan().bold(`       ${runtimeConfig.invocationCommand}`))
  console.log('')

  if (gitResult && gitResult.note) {
    console.log('  ' + kleur.yellow(gitResult.note))
    console.log('')
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(kleur.red(`\n  Error: ${error.message}`))
    process.exit(1)
  })
}

module.exports = {
  run,
}
