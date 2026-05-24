import { parsePodResourceRef } from '@undefineds.co/drizzle-solid'

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
  const chatPath = normalizePodDataResourceId(resourceId).match(/^chat\/(.+)\/index\.ttl#this$/)
  return chatPath?.[1] ? decodeURIComponent(chatPath[1]) : null
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
  const normalized = normalizePodDataResourceId(resourceId)
  const chatThread = normalized.match(/^chat\/(.+)\/index\.ttl#([^#/]+)$/)
  return {
    chatId: chatThread?.[1] ? decodeURIComponent(chatThread[1]) : null,
    threadId: extractThreadIdFromThreadRef(resourceId),
  }
}

export function resolveThreadChatId(
  thread: Pick<Record<string, unknown>, 'chat'> | null | undefined,
): string | null {
  return extractChatIdFromChatRef(typeof thread?.chat === 'string' ? thread.chat : null)
}

function normalizePodDataResourceId(ref: string): string {
  const dataIndex = ref.indexOf('/.data/')
  return dataIndex >= 0
    ? ref.slice(dataIndex + '/.data/'.length)
    : ref.replace(/^\/?\.data\//, '').replace(/^\/+/, '')
}
