import { asBaseRelativeResourceId, type BaseRelativeResourceId } from './resource-identity'

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

export function chatResourceId(key?: string): BaseRelativeResourceId {
  return asBaseRelativeResourceId(`${resourceKey(key, 'chat')}/index.ttl#this`, 'Chat resource id')
}

export function agentResourceId(key?: string): BaseRelativeResourceId {
  const localKey = resourceKey(key, 'agent')
  if (localKey.endsWith('/index.ttl#this')) {
    return asBaseRelativeResourceId(localKey, 'Agent resource id')
  }
  if (localKey.includes('/') || localKey.includes('#') || /\.(ttl|jsonld|json)(?:#|$)/i.test(localKey)) {
    throw new Error('Agent resource key must be a directory key, not an explicit resource path.')
  }
  return asBaseRelativeResourceId(`${localKey}/index.ttl#this`, 'Agent resource id')
}

export function agentHomeDirFromResourceId(id: string): string {
  const resourceId = asBaseRelativeResourceId(id, 'Agent resource id')
  const match = resourceId.match(/^(.+\/)index\.ttl#this$/)
  if (!match?.[1]) {
    throw new Error('Agent resource id must point to an Agent index resource (.../index.ttl#this).')
  }
  return match[1]
}

export function agentHomePathFromResourceId(id: string): string {
  return `/.data/agents/${agentHomeDirFromResourceId(id)}`
}

export function taskResourceId(key?: string): BaseRelativeResourceId {
  return asBaseRelativeResourceId(`index.ttl#${resourceKey(key, 'task')}`, 'Task resource id')
}

export function threadResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const localKey = resourceKey(key, 'thread')
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : surfaceIdFromCommandResourceId(typeof row?.id === 'string' ? row.id : undefined) ?? 'default'
  return asBaseRelativeResourceId(`${commandKind}/${surfaceId}/index.ttl#${localKey}`, 'Thread resource id')
}

export function messageResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const localKey = resourceKey(key, 'msg')
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : surfaceIdFromCommandResourceId(typeof row?.thread === 'string' ? row.thread : undefined) ?? 'default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return asBaseRelativeResourceId(`${commandKind}/${surfaceId}/${yyyy}/${MM}/${dd}/messages.ttl#${localKey}`, 'Message resource id')
}

export function runResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const localKey = resourceKey(key, 'run')
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : surfaceIdFromCommandResourceId(typeof row?.thread === 'string' ? row.thread : undefined) ?? 'default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return asBaseRelativeResourceId(`${commandKind}/${surfaceId}/${yyyy}/${MM}/${dd}/runs.ttl#${localKey}`, 'Run resource id')
}

export function runStepResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const localKey = resourceKey(key, 'run-step')
  const runId = typeof row?.runId === 'string' ? row.runId : undefined
  if (runId && /^(chat|task)\/[^/]+\/\d{4}\/\d{2}\/\d{2}\/runs\.ttl#[^#/]+$/.test(runId)) {
    return asBaseRelativeResourceId(`${runId.slice(0, runId.lastIndexOf('#') + 1)}${localKey}`, 'Run step resource id')
  }
  const commandKind = row?.commandKind === 'task' ? 'task' : 'chat'
  const surfaceId = typeof row?.surfaceId === 'string' && row.surfaceId.length > 0
    ? row.surfaceId
    : 'default'
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput)
  return asBaseRelativeResourceId(`${commandKind}/${surfaceId}/${yyyy}/${MM}/${dd}/runs.ttl#${localKey}`, 'Run step resource id')
}

function sanitizePathSlot(value: string | undefined, fallback: string): string {
  const raw = value && value.length > 0 ? value : resourceKey(undefined, fallback)
  return encodeURIComponent(raw)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%/g, '~')
}

export function matrixAccountResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const matrixUserId = typeof row?.matrixUserId === 'string' ? row.matrixUserId : undefined
  const localKey = sanitizePathSlot(key ?? matrixUserId, 'matrix-user')
  return asBaseRelativeResourceId(`accounts/${localKey}.ttl#this`, 'Matrix account resource id')
}

export function matrixRoomResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const matrixRoomId = typeof row?.matrixRoomId === 'string' ? row.matrixRoomId : undefined
  const localKey = sanitizePathSlot(key ?? matrixRoomId, 'matrix-room')
  return asBaseRelativeResourceId(`rooms/${localKey}/index.ttl#this`, 'Matrix room resource id')
}

export function matrixEventResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): BaseRelativeResourceId {
  const matrixEventId = typeof row?.matrixEventId === 'string' ? row.matrixEventId : undefined
  const matrixRoomId = typeof row?.matrixRoomId === 'string' ? row.matrixRoomId : undefined
  const localKey = sanitizePathSlot(key ?? matrixEventId, 'matrix-event')
  const roomSlot = sanitizePathSlot(matrixRoomId, 'matrix-room')
  const { yyyy, MM, dd } = dateParts(row?.createdAt as DateInput ?? row?.originServerTs as DateInput)
  return asBaseRelativeResourceId(`rooms/${roomSlot}/${yyyy}/${MM}/${dd}/events.ttl#${localKey}`, 'Matrix event resource id')
}
