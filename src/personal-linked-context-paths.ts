export interface PersonalLinkedContextPathPolicy {
  root?: string
  project?: string
  slug?: string
  extension?: string
}

export function buildPersonalLinkedContextFilePath(
  folder: string,
  row: Record<string, unknown> | undefined,
  policy: PersonalLinkedContextPathPolicy | undefined,
  options: {
    defaultExtension: string
    titleFields: string[]
  },
): string {
  const root = cleanPathSegment(policy?.root ?? 'projects')
  const project = cleanPathSegment(policy?.project ?? 'general')
  const slug = cleanPathSegment(policy?.slug ?? firstStringField(row, options.titleFields) ?? 'untitled')
  const extension = cleanExtension(policy?.extension ?? options.defaultExtension)
  return `${root}/${project}/${folder}/${slug}.${extension}`
}

function firstStringField(row: Record<string, unknown> | undefined, fields: string[]): string | undefined {
  if (!row) return undefined
  for (const field of fields) {
    const value = row[field]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

function cleanExtension(extension: string): string {
  return extension.replace(/^\.+/u, '').trim() || 'md'
}

function cleanPathSegment(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/['’]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
  return normalized || 'untitled'
}
