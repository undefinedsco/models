import { eq } from '@undefineds.co/drizzle-solid'
import { definePodRepository, type SolidDatabase } from './repository'
import {
  chatProjectContextResource,
  chatProjectContextResourceId,
  chatProjectMemoryResource,
  chatProjectMemoryResourceId,
  type ChatProjectContextInsert,
  type ChatProjectContextRow,
  type ChatProjectContextUpdate,
  type ChatProjectMemoryInsert,
  type ChatProjectMemoryRow,
  type ChatProjectMemoryUpdate,
} from './chat-project.schema'

export interface ChatProjectMemoryEntry {
  id: string
  text: string
  sourceMessage?: string
  createdAt: string
}

export interface ChatProjectContextSnapshot {
  workspace: string
  instructions: string
  memoryEnabled: boolean
  memories: ChatProjectMemoryEntry[]
  updatedAt: string
}

export interface ChatProjectWhere extends Record<string, unknown> {
  workspace?: string
}

export const chatProjectContextRepository = definePodRepository<
  typeof chatProjectContextResource,
  ChatProjectContextRow,
  ChatProjectContextInsert,
  ChatProjectContextUpdate,
  ChatProjectWhere
>({
  namespace: 'chat-project-context',
  resource: chatProjectContextResource,
  defaultSort: { field: 'updatedAt', direction: 'desc' },
  filter: ({ filters }) => filters?.workspace
    ? eq(chatProjectContextResource.workspace, filters.workspace)
    : undefined,
})

export const chatProjectMemoryRepository = definePodRepository<
  typeof chatProjectMemoryResource,
  ChatProjectMemoryRow,
  ChatProjectMemoryInsert,
  ChatProjectMemoryUpdate,
  ChatProjectWhere
>({
  namespace: 'chat-project-memory',
  resource: chatProjectMemoryResource,
  searchableFields: ['text'],
  defaultSort: { field: 'createdAt', direction: 'asc' },
  filter: ({ filters }) => filters?.workspace
    ? eq(chatProjectMemoryResource.workspace, filters.workspace)
    : undefined,
})

function isoDate(value: Date | string | number | null | undefined): string {
  if (value instanceof Date) return value.toISOString()
  const date = new Date(value ?? 0)
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString()
}

export function emptyChatProjectContext(workspace: string): ChatProjectContextSnapshot {
  return {
    workspace,
    instructions: '',
    memoryEnabled: true,
    memories: [],
    updatedAt: new Date(0).toISOString(),
  }
}

export async function readChatProjectContext(
  db: SolidDatabase,
  workspace: string,
): Promise<ChatProjectContextSnapshot> {
  const [contexts, memories] = await Promise.all([
    chatProjectContextRepository.list(db, { workspace }),
    chatProjectMemoryRepository.list(db, { workspace }),
  ])
  const context = contexts[0]
  return {
    workspace,
    instructions: context?.instructions ?? '',
    memoryEnabled: context?.memoryEnabled !== false,
    memories: memories.map((memory) => ({
      id: memory.id,
      text: memory.text,
      ...(memory.sourceMessage ? { sourceMessage: memory.sourceMessage } : {}),
      createdAt: isoDate(memory.createdAt),
    })),
    updatedAt: isoDate(context?.updatedAt),
  }
}

export async function writeChatProjectContext(
  db: SolidDatabase,
  snapshot: ChatProjectContextSnapshot,
): Promise<ChatProjectContextSnapshot> {
  const now = new Date()
  const contextId = chatProjectContextResourceId(snapshot.workspace)
  const existingContext = await chatProjectContextRepository.detail(db, contextId)
  if (existingContext) {
    await chatProjectContextRepository.update?.(db, contextId, {
      instructions: snapshot.instructions,
      memoryEnabled: snapshot.memoryEnabled,
      updatedAt: now,
    })
  } else {
    await chatProjectContextRepository.create?.(db, {
      id: contextId,
      workspace: snapshot.workspace,
      instructions: snapshot.instructions,
      memoryEnabled: snapshot.memoryEnabled,
      createdAt: now,
      updatedAt: now,
    })
  }

  const existingMemories = await chatProjectMemoryRepository.list(db, { workspace: snapshot.workspace })
  const existingById = new Map(existingMemories.map((memory) => [memory.id, memory]))
  const retainedIds = new Set<string>()
  for (const memory of snapshot.memories) {
    const id = chatProjectMemoryResourceId(memory.id)
    retainedIds.add(id)
    if (existingById.has(id)) {
      await chatProjectMemoryRepository.update?.(db, id, {
        text: memory.text,
        sourceMessage: memory.sourceMessage,
        updatedAt: now,
      })
    } else {
      await chatProjectMemoryRepository.create?.(db, {
        id,
        workspace: snapshot.workspace,
        text: memory.text,
        sourceMessage: memory.sourceMessage,
        createdAt: memory.createdAt ? new Date(memory.createdAt) : now,
        updatedAt: now,
      })
    }
  }
  await Promise.all(existingMemories
    .filter((memory) => !retainedIds.has(memory.id))
    .map((memory) => chatProjectMemoryRepository.remove?.(db, memory.id)))

  return readChatProjectContext(db, snapshot.workspace)
}
