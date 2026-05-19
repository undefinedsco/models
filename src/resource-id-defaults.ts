export type CommandKind = 'chat' | 'task'

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

export function surfaceIdFromCommandResourceId(id: string | null | undefined): string | null {
  if (!id) return null
  const match = id.match(/^(chat|task)\/([^/]+)\//)
  return match ? decodeURIComponent(match[2]) : null
}

export function commandKindFromResourceId(id: string | null | undefined): CommandKind | null {
  if (!id) return null
  const match = id.match(/^(chat|task)\//)
  return match?.[1] === 'task' ? 'task' : match?.[1] === 'chat' ? 'chat' : null
}

export function chatResourceId(key?: string): string {
  return `${resourceKey(key, 'chat')}/index.ttl#this`
}

export function taskResourceId(key?: string): string {
  return `index.ttl#${resourceKey(key, 'task')}`
}

export function threadResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'thread')
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : surfaceIdFromCommandResourceId(typeof row?.id === 'string' ? row.id : undefined) ?? 'default'
  return `${commandKind}/${surfaceId}/index.ttl#${localKey}`
}

export function messageResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'msg')
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : surfaceIdFromCommandResourceId(typeof row?.thread === 'string' ? row.thread : undefined) ?? 'default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${commandKind}/${surfaceId}/${yyyy}/${MM}/${dd}/messages.ttl#${localKey}`
}

export function runResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'run')
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : surfaceIdFromCommandResourceId(typeof row?.thread === 'string' ? row.thread : undefined) ?? 'default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${commandKind}/${surfaceId}/${yyyy}/${MM}/${dd}/runs.ttl#${localKey}`
}

export function runStepResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const localKey = resourceKey(key, 'run-step')
  const runId = typeof row?.runId === 'string' ? row.runId : undefined
  if (runId && /^(chat|task)\/[^/]+\/\d{4}\/\d{2}\/\d{2}\/runs\.ttl#[^#/]+$/.test(runId)) {
    return `${runId.slice(0, runId.lastIndexOf('#') + 1)}${localKey}`
  }
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : 'default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return `${commandKind}/${surfaceId}/${yyyy}/${MM}/${dd}/runs.ttl#${localKey}`
}
