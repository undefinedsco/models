import { normalizePodDataResourceId, parsePodResourceRef } from '@undefineds.co/drizzle-solid'
import { chatResource } from './chat.schema'

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

export interface ChatTargetRef {
  chatId: string | null
  threadId: string | null
  messageId: string | null
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

export function buildChatTargetRef(chatIdOrRef: string): string {
  return `/.data/chat/${chatResource.buildId({ id: extractChatIdFromChatRef(chatIdOrRef) ?? chatIdOrRef })}`
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

export function extractChatTargetRef(uri: string | null | undefined): ChatTargetRef {
  if (!uri) return { chatId: null, threadId: null, messageId: null }
  const parsed = parsePodResourceRef({ config: { base: '/.data/' } } as any, uri)
  const resourceId = parsed?.resourceId ?? uri
  const normalized = normalizePodDataResourceId(resourceId)
  const chatThread = normalized.match(/^chat\/(.+)\/index\.ttl#([^#/]+)$/)
  if (chatThread?.[1]) {
    const fragment = chatThread[2]
    return {
      chatId: decodeURIComponent(chatThread[1]),
      threadId: fragment === 'this' ? null : decodeURIComponent(fragment),
      messageId: null,
    }
  }

  const message = normalized.match(/^chat\/(.+)\/\d{4}\/\d{2}\/\d{2}\/messages\.ttl#([^#/]+)$/)
  if (message?.[1]) {
    return {
      chatId: decodeURIComponent(message[1]),
      threadId: null,
      messageId: message[2] ? decodeURIComponent(message[2]) : null,
    }
  }

  return { chatId: null, threadId: null, messageId: null }
}
