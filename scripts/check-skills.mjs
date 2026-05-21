import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const skillsRoot = join(root, 'skills')
const marketplacePath = join(root, '.agents', 'plugins', 'marketplace.json')
const codexPluginName = 'solid-modeling'
const codexPluginRoot = join(root, 'plugins', codexPluginName)
const codexPluginManifestPath = join(codexPluginRoot, '.codex-plugin', 'plugin.json')
const namePattern = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/

const errors = []

if (!existsSync(skillsRoot)) {
  errors.push('skills/ directory is missing')
} else {
  for (const entry of readdirSync(skillsRoot)) {
    const skillDir = join(skillsRoot, entry)
    if (!statSync(skillDir).isDirectory()) continue
    validateSkill(entry, skillDir)
  }
}

validateCodexMarketplace()

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log('skills ok')

function validateSkill(name, dir) {
  if (!namePattern.test(name)) {
    errors.push(`${name}: folder name must be lowercase kebab-case and <=64 chars`)
  }

  const skillPath = join(dir, 'SKILL.md')
  if (!existsSync(skillPath)) {
    errors.push(`${name}: SKILL.md is missing`)
    return
  }

  const source = readFileSync(skillPath, 'utf8')
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/)
  if (!frontmatter) {
    errors.push(`${name}: SKILL.md must start with YAML frontmatter`)
    return
  }

  const fields = parseFrontmatter(frontmatter[1])
  const keys = Object.keys(fields)
  const extraKeys = keys.filter((key) => key !== 'name' && key !== 'description' && key !== 'metadata')
  if (extraKeys.length > 0) {
    errors.push(`${name}: unsupported frontmatter fields: ${extraKeys.join(', ')}`)
  }
  if (fields.name !== name) {
    errors.push(`${name}: frontmatter name must match folder name`)
  }
  if (!fields.description || fields.description.length < 40) {
    errors.push(`${name}: description must explain when to use the skill`)
  }
  if (source.includes('[TODO') || source.includes('TODO:')) {
    errors.push(`${name}: remove TODO placeholders before publishing`)
  }

  const openaiPath = join(dir, 'agents', 'openai.yaml')
  if (!existsSync(openaiPath)) {
    errors.push(`${name}: agents/openai.yaml is missing`)
  } else {
    const openai = readFileSync(openaiPath, 'utf8')
    for (const required of ['display_name:', 'short_description:', 'default_prompt:', 'allow_implicit_invocation:']) {
      if (!openai.includes(required)) {
        errors.push(`${name}: agents/openai.yaml missing ${required}`)
      }
    }
    if (!openai.includes(`$${name}`)) {
      errors.push(`${name}: agents/openai.yaml default_prompt must mention $${name}`)
    }
  }
}

function validateCodexMarketplace() {
  if (!existsSync(marketplacePath)) {
    errors.push('.agents/plugins/marketplace.json is missing')
    return
  }

  if (!existsSync(codexPluginManifestPath)) {
    errors.push(`${codexPluginName}: .codex-plugin/plugin.json is missing`)
    return
  }

  const marketplace = readJson(marketplacePath, 'marketplace')
  if (marketplace?.name !== 'undefineds-models') {
    errors.push('marketplace name must be undefineds-models')
  }
  if (marketplace?.interface?.displayName !== 'Undefineds Models') {
    errors.push('marketplace interface.displayName must be Undefineds Models')
  }

  const entry = Array.isArray(marketplace?.plugins)
    ? marketplace.plugins.find((plugin) => plugin?.name === codexPluginName)
    : null
  if (!entry) {
    errors.push(`${codexPluginName}: marketplace entry is missing`)
  } else {
    if (entry.source?.source !== 'local') {
      errors.push(`${codexPluginName}: marketplace source.source must be local`)
    }
    if (entry.source?.path !== `./plugins/${codexPluginName}`) {
      errors.push(`${codexPluginName}: marketplace source.path must point to ./plugins/${codexPluginName}`)
    }
    if (entry.policy?.installation !== 'AVAILABLE') {
      errors.push(`${codexPluginName}: marketplace policy.installation must be AVAILABLE`)
    }
    if (entry.policy?.authentication !== 'ON_INSTALL') {
      errors.push(`${codexPluginName}: marketplace policy.authentication must be ON_INSTALL`)
    }
    if (!entry.category) {
      errors.push(`${codexPluginName}: marketplace category is required`)
    }
  }

  const manifest = readJson(codexPluginManifestPath, 'codex plugin manifest')
  if (manifest?.name !== codexPluginName) {
    errors.push(`${codexPluginName}: plugin manifest name must match plugin folder`)
  }
  if (manifest?.version !== pkg.version) {
    errors.push(`${codexPluginName}: plugin manifest version must match package.json version`)
  }
  if (manifest?.skills !== './skills/') {
    errors.push(`${codexPluginName}: plugin manifest skills must be ./skills/`)
  }

  validateSkillMirror('solid-modeling')
}

function validateSkillMirror(skillName) {
  const canonicalSkillDir = join(skillsRoot, skillName)
  const pluginSkillDir = join(codexPluginRoot, 'skills', skillName)
  const canonicalSkill = readFileIfExists(join(canonicalSkillDir, 'SKILL.md'))
  const pluginSkill = readFileIfExists(join(pluginSkillDir, 'SKILL.md'))
  const canonicalOpenAI = readFileIfExists(join(canonicalSkillDir, 'agents', 'openai.yaml'))
  const pluginOpenAI = readFileIfExists(join(pluginSkillDir, 'agents', 'openai.yaml'))

  if (canonicalSkill === null || pluginSkill === null) {
    errors.push(`${codexPluginName}: mirrored ${skillName}/SKILL.md is missing`)
  } else if (canonicalSkill !== pluginSkill) {
    errors.push(`${codexPluginName}: mirrored ${skillName}/SKILL.md differs from canonical skills/${skillName}/SKILL.md`)
  }

  if (canonicalOpenAI === null || pluginOpenAI === null) {
    errors.push(`${codexPluginName}: mirrored ${skillName}/agents/openai.yaml is missing`)
  } else if (canonicalOpenAI !== pluginOpenAI) {
    errors.push(`${codexPluginName}: mirrored ${skillName}/agents/openai.yaml differs from canonical skills/${skillName}/agents/openai.yaml`)
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    errors.push(`failed to parse ${label}: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function readFileIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function parseFrontmatter(source) {
  const fields = {}
  for (const line of source.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue
    fields[match[1]] = unquote(match[2].trim())
  }
  return fields
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}
