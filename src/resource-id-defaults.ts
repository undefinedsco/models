import { normalizePodDataResourceId } from '@undefineds.co/drizzle-solid'

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

export function workflowOwnerDir(row?: Record<string, unknown>): string | null {
  return taskDir(row)
    ?? runDir(row)
    ?? deliveryDir(row)
    ?? issueDir(row)
    ?? threadDir(row)
    ?? chatDir(row)
    ?? aboutDir(row)
}

export function parentDir(id: string | null | undefined): string | null {
  if (!id) return null
  const hashless = id.split('#')[0] ?? id
  const parts = hashless.split('/').filter(Boolean)
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('/')
}

function chatDir(row?: Record<string, unknown>): string | null {
  const chat = typeof row?.chat === 'string' ? row.chat : undefined
  if (!chat) return null
  const resourceId = normalizePodDataResourceId(chat)
  const match = resourceId.match(/^chat\/(.+)\/index\.ttl#this$/)
  return match?.[1] ? `chat/${match[1]}` : null
}

function threadDir(row?: Record<string, unknown>): string | null {
  const thread = typeof row?.thread === 'string' ? row.thread : undefined
  if (!thread) return null
  const resourceId = normalizePodDataResourceId(thread)
  const match = resourceId.match(/^(chat\/.+)\/index\.ttl#[^#/]+$/)
  return match?.[1] ?? null
}

function taskDir(row?: Record<string, unknown>): string | null {
  const task = typeof row?.task === 'string' ? row.task : undefined
  if (!task) return null
  const resourceId = normalizePodDataResourceId(task)
  if (resourceId === 'task/index.ttl#this') return 'task'
  const legacyIndexMatch = resourceId.match(/^task\/index\.ttl#([^#/]+)$/)
  if (legacyIndexMatch?.[1]) return `task/${legacyIndexMatch[1]}`
  const match = resourceId.match(/^task\/(.+)\.ttl(?:#[^#/]+)?$/)
  return match?.[1] ? `task/${match[1]}` : null
}

function issueDir(row?: Record<string, unknown>): string | null {
  const issue = typeof row?.issue === 'string' ? row.issue : undefined
  if (!issue) return null
  const resourceId = normalizePodDataResourceId(issue)
  const match = resourceId.match(/^issues\/(.+)\.ttl(?:#[^#/]+)?$/)
  return match?.[1] ? `issues/${match[1]}` : null
}

function deliveryDir(row?: Record<string, unknown>): string | null {
  const delivery = typeof row?.delivery === 'string' ? row.delivery : undefined
  if (!delivery) return null
  const resourceId = normalizePodDataResourceId(delivery)
  const match = resourceId.match(/^(.+)\/\d{4}\/\d{2}\/\d{2}\/deliveries\.ttl#[^#/]+$/)
  return match?.[1] ?? null
}

function runDir(row?: Record<string, unknown>): string | null {
  const run = typeof row?.run === 'string' ? row.run : undefined
  if (!run) return null
  const resourceId = normalizePodDataResourceId(run)
  const match = resourceId.match(/^(.+)\/\d{4}\/\d{2}\/\d{2}\/runs\.ttl#[^#/]+$/)
  return match?.[1] ?? null
}

function aboutDir(row?: Record<string, unknown>): string | null {
  const about = typeof row?.about === 'string' ? row.about : undefined
  if (!about) return null
  return runDir({ run: about })
    ?? deliveryDir({ delivery: about })
    ?? taskDir({ task: about })
    ?? issueDir({ issue: about })
    ?? threadDir({ thread: about })
    ?? chatDir({ chat: about })
}
