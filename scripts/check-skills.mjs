import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const skillsRoot = join(root, 'skills')
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
  const extraKeys = keys.filter((key) => key !== 'name' && key !== 'description')
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
