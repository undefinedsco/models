import { definePodRepository } from './repository'
import { threadResource, type ThreadRow, type ThreadInsert, type ThreadUpdate } from './thread.schema'
import {
  buildChatTargetRef,
  extractChatIdFromChatRef,
  extractChatThreadRef,
  extractThreadIdFromThreadRef,
} from './chat.utils'

export interface ChatThreadTarget extends Record<string, unknown> {
  parent: string
  id?: string
}

export function buildChatThreadTarget(chatIdOrRef: string, threadIdOrRef?: string): ChatThreadTarget {
  const parsedThread = extractChatThreadRef(threadIdOrRef)
  const chatRef = parsedThread.chatId ?? chatIdOrRef
  const threadId = parsedThread.threadId ?? extractThreadIdFromThreadRef(threadIdOrRef) ?? threadIdOrRef

  return {
    ...(threadId ? { id: threadId } : {}),
    parent: buildChatTargetRef(chatRef),
  }
}

export function extractChatIdFromThread(row: Pick<ThreadRow, 'parent'> | null | undefined): string | null {
  return extractChatIdFromChatRef(row?.parent)
}

export function readThreadRepositoryChatId(threadRef: string | null | undefined): string | null {
  return extractChatThreadRef(threadRef).chatId
}

export function readThreadRepositoryId(threadRef: string | null | undefined): string | null {
  return extractThreadIdFromThreadRef(threadRef)
}

export function buildChatThreadIri(webIdOrPodUrl: string, chatIdOrRef: string, threadId: string): string {
  return threadResource.buildIri(webIdOrPodUrl, buildChatThreadTarget(chatIdOrRef, threadId))
}

export function buildChatThreadResourceId(chatIdOrRef: string, threadIdOrRef: string): string {
  return threadResource.buildId(buildChatThreadTarget(chatIdOrRef, threadIdOrRef))
}

export const threadRepository = definePodRepository<
  typeof threadResource,
  ThreadRow,
  ThreadInsert,
  ThreadUpdate
>({
  namespace: 'thread',
  resource: threadResource,
  searchableFields: ['title'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
}) as ReturnType<typeof definePodRepository<
  typeof threadResource,
  ThreadRow,
  ThreadInsert,
  ThreadUpdate
>> & {
  targetForChat: typeof buildChatThreadTarget
  iriForChat: typeof buildChatThreadIri
  idForChat: typeof buildChatThreadResourceId
  chatId: typeof extractChatIdFromThread
  chatIdFromRef: typeof readThreadRepositoryChatId
  idFromRef: typeof readThreadRepositoryId
}

threadRepository.targetForChat = buildChatThreadTarget
threadRepository.iriForChat = buildChatThreadIri
threadRepository.idForChat = buildChatThreadResourceId
threadRepository.chatId = extractChatIdFromThread
threadRepository.chatIdFromRef = readThreadRepositoryChatId
threadRepository.idFromRef = readThreadRepositoryId
