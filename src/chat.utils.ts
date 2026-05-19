import { parsePodResourceRef } from '@undefineds.co/drizzle-solid'
import {
  commandKindFromResourceId,
  surfaceIdFromCommandResourceId,
} from './resource-id-defaults'

export const toTimestamp = (value: unknown, fallback = 0): number => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const ms = new Date(value).getTime()
    return Number.isNaN(ms) ? fallback : ms
  }
  if (typeof value === 'number') return value
  return fallback
}

export interface ChatThreadRef {
  chatId: string | null
  threadId: string | null
}

export function extractChatIdFromChatRef(chatRef: string | null | undefined): string | null {
  if (!chatRef) return null
  const parsed = parsePodResourceRef({ config: { base: '/.data/chat/' } } as any, chatRef)
  const resourceId = parsed?.resourceId ?? chatRef
  const direct = resourceId.match(/^([^/]+)\/index\.ttl#this$/)
  if (direct) return decodeURIComponent(direct[1])
  return surfaceIdFromCommandResourceId(resourceId)
}

export function extractThreadIdFromThreadRef(threadRef: string | null | undefined): string | null {
  if (!threadRef) return null
  const parsed = parsePodResourceRef({ config: { base: '/.data/' } } as any, threadRef)
  const resourceId = parsed?.resourceId ?? threadRef
  const hashIndex = resourceId.lastIndexOf('#')
  return hashIndex >= 0 && hashIndex < resourceId.length - 1
    ? resourceId.slice(hashIndex + 1)
    : resourceId
}

export function extractChatThreadRef(uri: string | null | undefined): ChatThreadRef {
  if (!uri) return { chatId: null, threadId: null }
  const parsed = parsePodResourceRef({ config: { base: '/.data/' } } as any, uri)
  const resourceId = parsed?.resourceId ?? uri
  return {
    chatId: commandKindFromResourceId(resourceId) === 'chat'
      ? surfaceIdFromCommandResourceId(resourceId)
      : null,
    threadId: extractThreadIdFromThreadRef(resourceId),
  }
}

export function resolveThreadChatId(
  thread: Pick<Record<string, unknown>, 'chat'> | null | undefined,
): string | null {
  return extractChatIdFromChatRef(typeof thread?.chat === 'string' ? thread.chat : null)
}
