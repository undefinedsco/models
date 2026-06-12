import { definePodRepository } from './repository'
import { chatResource, type ChatRow, type ChatInsert, type ChatUpdate } from './chat.schema'
import { extractChatIdFromChatRef } from './chat.utils'

export function buildChatRepositoryTarget(chatIdOrRef: string): { id: string } {
  return {
    id: extractChatIdFromChatRef(chatIdOrRef) ?? chatIdOrRef,
  }
}

export function buildChatRepositoryIri(webIdOrPodUrl: string, chatIdOrRef: string): string {
  return chatResource.buildIri(webIdOrPodUrl, buildChatRepositoryTarget(chatIdOrRef))
}

export function readChatRepositoryId(chatRef: string | null | undefined): string | null {
  return extractChatIdFromChatRef(chatRef)
}

export const chatRepository = definePodRepository<
  typeof chatResource,
  ChatRow,
  ChatInsert,
  ChatUpdate
>({
  namespace: 'chat',
  resource: chatResource,
  searchableFields: ['title', 'description'],
  defaultSort: { field: 'lastActiveAt', direction: 'desc' },
}) as ReturnType<typeof definePodRepository<
  typeof chatResource,
  ChatRow,
  ChatInsert,
  ChatUpdate
>> & {
  target: typeof buildChatRepositoryTarget
  iri: typeof buildChatRepositoryIri
  idFromRef: typeof readChatRepositoryId
}

chatRepository.target = buildChatRepositoryTarget
chatRepository.iri = buildChatRepositoryIri
chatRepository.idFromRef = readChatRepositoryId
