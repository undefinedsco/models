import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const outRoot = join(root, 'preview')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = pkg.version
const skillName = 'solid-modeling'
const skillSource = join(root, 'skills', skillName)

if (!existsSync(skillSource)) {
  throw new Error(`Missing skill source: ${skillSource}`)
}

mkdirSync(outRoot, { recursive: true })

const skillsArchive = join(outRoot, `undefineds-co-models-skills-${version}.tgz`)
const pluginArchive = join(outRoot, `undefineds-co-models-codex-plugin-${skillName}-${version}.tgz`)
const claudePluginArchive = join(outRoot, `undefineds-co-models-claude-plugin-${skillName}-${version}.tgz`)

packSkillsArchive(skillsArchive)
packCodexPluginArchive(pluginArchive)
packClaudePluginArchive(claudePluginArchive)

console.log(skillsArchive)
console.log(pluginArchive)
console.log(claudePluginArchive)

function packSkillsArchive(outFile) {
  const workRoot = createWorkRoot('skills')
  const skillsDir = join(workRoot, 'skills')
  mkdirSync(skillsDir, { recursive: true })
  cpSync(skillSource, join(skillsDir, skillName), { recursive: true })
  writeFileSync(join(workRoot, 'README.md'), [
    '# @undefineds.co/models Skills',
    '',
    'Shared Solid/RDF modeling skills maintained by @undefineds.co/models.',
    '',
  ].join('\n'))
  tar(outFile, workRoot)
}

function packCodexPluginArchive(outFile) {
  const workRoot = createWorkRoot('codex-plugin')
  mkdirSync(join(workRoot, '.codex-plugin'), { recursive: true })
  mkdirSync(join(workRoot, 'skills'), { recursive: true })
  cpSync(skillSource, join(workRoot, 'skills', skillName), { recursive: true })
  writeFileSync(join(workRoot, '.codex-plugin', 'plugin.json'), `${JSON.stringify({
    name: 'solid-modeling',
    version,
    description: 'Shared Solid/RDF modeling guidance for @undefineds.co/models and Pod-facing products.',
    author: {
      name: 'Undefineds',
      email: 'developer@undefineds.co',
      url: 'https://github.com/undefinedsco',
    },
    homepage: 'https://github.com/undefinedsco/models',
    repository: 'https://github.com/undefinedsco/models',
    license: 'MIT',
    keywords: ['solid', 'rdf', 'pod', 'drizzle-solid', 'models'],
    skills: './skills/',
    interface: {
      displayName: 'Solid Modeling',
      shortDescription: 'Design shared Solid/RDF model schemas',
      longDescription: 'Reusable modeling guidance for Solid Pod resources, RDF links, base-relative ids, drizzle-solid schemas, and shared @undefineds.co/models ownership.',
      developerName: 'Undefineds',
      category: 'Engineering',
      capabilities: ['Knowledge', 'Workflow'],
      websiteURL: 'https://github.com/undefinedsco/models',
      defaultPrompt: [
        'Use $solid-modeling to review this Pod schema.',
        'Check this model for id and URI mistakes.',
        'Align this Xpod schema with shared models.',
      ],
      brandColor: '#2563EB',
    },
  }, null, 2)}\n`)
  tar(outFile, workRoot)
}

function packClaudePluginArchive(outFile) {
  const workRoot = createWorkRoot('claude-plugin')
  mkdirSync(join(workRoot, '.claude-plugin'), { recursive: true })
  mkdirSync(join(workRoot, 'skills'), { recursive: true })
  cpSync(skillSource, join(workRoot, 'skills', skillName), { recursive: true })
  writeFileSync(join(workRoot, '.claude-plugin', 'plugin.json'), `${JSON.stringify({
    name: 'solid-modeling',
    description: 'Shared Solid/RDF modeling guidance for @undefineds.co/models and Pod-facing products.',
    version,
    author: {
      name: 'Undefineds',
    },
    homepage: 'https://github.com/undefinedsco/models',
    repository: 'https://github.com/undefinedsco/models',
    license: 'MIT',
  }, null, 2)}\n`)
  tar(outFile, workRoot)
}

function createWorkRoot(name) {
  const workRoot = join(tmpdir(), `undefineds-models-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  rmSync(workRoot, { recursive: true, force: true })
  mkdirSync(workRoot, { recursive: true })
  return workRoot
}

function tar(outFile, cwd) {
  rmSync(outFile, { force: true })
  const result = spawnSync('tar', ['-czf', outFile, '-C', cwd, '.'], {
    stdio: 'inherit',
  })
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1)
  }
}
