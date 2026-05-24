export type DateInput = Date | string | number | null | undefined

export interface DateParts {
  yyyy: string
  MM: string
  dd: string
}

export function dateParts(value?: DateInput): DateParts {
  const date = value instanceof Date
    ? value
    : typeof value === 'string' || typeof value === 'number'
      ? new Date(typeof value === 'number' && Math.abs(value) < 100_000_000_000 ? value * 1000 : value)
      : new Date()
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date()
  return {
    yyyy: String(safeDate.getUTCFullYear()),
    MM: String(safeDate.getUTCMonth() + 1).padStart(2, '0'),
    dd: String(safeDate.getUTCDate()).padStart(2, '0'),
  }
}

export function resourceKey(key: string | undefined, prefix: string): string {
  return key && key.length > 0
    ? key
    : `${prefix}_${Math.random().toString(36).slice(2, 12)}`
}

export function parentDir(id: string | null | undefined): string | null {
  if (!id) return null
  const hashless = id.split('#')[0] ?? id
  const parts = hashless.split('/').filter(Boolean)
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('/')
}

export function chatResourceId(key?: string): string {
  return `${resourceKey(key, 'chat')}/index.ttl#this`
}

export function taskResourceId(key?: string): string {
  return `index.ttl#${resourceKey(key, 'task')}`
}

export function deliveryResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'delivery')
  const ownerDir = taskDir(row)
    ?? chatDir(row)
    ?? threadDir(row)
    ?? 'deliveries'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${ownerDir}/${yyyy}/${MM}/${dd}/deliveries.ttl#${localKey}`
}

export function threadResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'thread')
  return `${chatDir(row) ?? 'chat/default'}/index.ttl#${localKey}`
}

export function messageResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'msg')
  const ownerDir = chatDir(row) ?? threadDir(row) ?? 'chat/default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${ownerDir}/${yyyy}/${MM}/${dd}/messages.ttl#${localKey}`
}

export function runResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'run')
  const ownerDir = taskDir(row) ?? threadDir(row) ?? chatDir(row) ?? 'runs'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${ownerDir}/${yyyy}/${MM}/${dd}/runs.ttl#${localKey}`
}

export function runStepResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'run-step')
  const run = typeof row?.run === 'string' ? row.run : undefined
  if (run && /(?:^|\/)\d{4}\/\d{2}\/\d{2}\/runs\.ttl#[^#/]+$/.test(stripPodDataPrefix(run))) {
    return `${run.slice(0, run.lastIndexOf('#') + 1)}${localKey}`
  }
  const ownerDir = taskDir(row) ?? threadDir(row) ?? chatDir(row) ?? 'runs'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${ownerDir}/${yyyy}/${MM}/${dd}/runs.ttl#${localKey}`
}

function chatDir(row?: Record<string, unknown>): string | null {
  const chat = typeof row?.chat === 'string' ? row.chat : undefined
  if (!chat) return null
  const resourceId = stripPodDataPrefix(chat)
  const match = resourceId.match(/^chat\/(.+)\/index\.ttl#this$/)
  return match?.[1] ? `chat/${match[1]}` : null
}

function threadDir(row?: Record<string, unknown>): string | null {
  const thread = typeof row?.thread === 'string' ? row.thread : undefined
  if (!thread) return null
  const resourceId = stripPodDataPrefix(thread)
  const match = resourceId.match(/^(chat\/.+)\/index\.ttl#[^#/]+$/)
  return match?.[1] ?? null
}

function taskDir(row?: Record<string, unknown>): string | null {
  const task = typeof row?.task === 'string' ? row.task : undefined
  if (!task) return null
  const resourceId = stripPodDataPrefix(task)
  if (resourceId === 'task/index.ttl#this') return 'task'
  const legacyIndexMatch = resourceId.match(/^task\/index\.ttl#([^#/]+)$/)
  if (legacyIndexMatch?.[1]) return `task/${legacyIndexMatch[1]}`
  const match = resourceId.match(/^task\/(.+)\.ttl(?:#[^#/]+)?$/)
  return match?.[1] ? `task/${match[1]}` : null
}

function stripPodDataPrefix(ref: string): string {
  const hashIndex = ref.indexOf('#')
  const [documentRef, fragment = ''] = hashIndex >= 0
    ? [ref.slice(0, hashIndex), ref.slice(hashIndex)]
    : [ref, '']
  const dataIndex = documentRef.indexOf('/.data/')
  const relative = dataIndex >= 0
    ? documentRef.slice(dataIndex + '/.data/'.length)
    : documentRef.replace(/^\/?\.data\//, '').replace(/^\/+/, '')
  return `${relative}${fragment}`
}
