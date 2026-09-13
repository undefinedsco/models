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
  // Repository list rows expose base-relative ids. Use the database's exact-id
  // APIs for reconciliation; IRI-only operations intentionally reject these
  // values when no absolute base IRI was supplied.
  const existingContext = await db.findById(chatProjectContextResource, contextId)
  if (existingContext) {
    await db.updateById(chatProjectContextResource, contextId, {
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
      await db.updateById(chatProjectMemoryResource, id, {
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
    .map((memory) => db.deleteById(chatProjectMemoryResource, memory.id)))

  return readChatProjectContext(db, snapshot.workspace)
}

interface ChatProjectSettingsInput {
  workspace: string
  instructions?: string
  memoryEnabled?: boolean
}

interface ChatProjectMemoryInput {
  workspace: string
  memory: ChatProjectMemoryEntry
}

export interface ReconcileChatProjectContextInput {
  previous: ChatProjectContextSnapshot
  next: ChatProjectContextSnapshot
}

async function writeChatProjectSettings(
  db: SolidDatabase,
  input: ChatProjectSettingsInput,
): Promise<void> {
  const [existingContext] = await chatProjectContextRepository.list(db, { workspace: input.workspace })
  const now = new Date()
  const changes = {
    ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
    ...(input.memoryEnabled !== undefined ? { memoryEnabled: input.memoryEnabled } : {}),
    updatedAt: now,
  }
  if (existingContext) {
    await db.updateById(chatProjectContextResource, existingContext.id, changes)
    return
  }
  if (!chatProjectContextRepository.create) {
    throw new Error('Chat project context repository does not support create')
  }
  const id = chatProjectContextResourceId(input.workspace)
  const insert = {
    // A stable ID makes concurrent first writes converge on the same resource.
    id,
    workspace: input.workspace,
    instructions: input.instructions ?? '',
    memoryEnabled: input.memoryEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  }
  try {
    await chatProjectContextRepository.create(db, insert)
  } catch (error) {
    // A simultaneous first writer may win the conditional Pod write. Resolve
    // that race as an update, while rejecting the unlikely stable-ID collision.
    const racedContext = await db.findById(chatProjectContextResource, id)
    if (!racedContext) throw error
    if (racedContext.workspace !== input.workspace) {
      throw new Error('Project context resource belongs to a different workspace')
    }
    await db.updateById(chatProjectContextResource, id, changes)
  }
}

async function upsertChatProjectMemory(
  db: SolidDatabase,
  input: ChatProjectMemoryInput,
): Promise<void> {
  const id = chatProjectMemoryResourceId(input.memory.id)
  const existing = await db.findById(chatProjectMemoryResource, id)
  const now = new Date()
  if (existing) {
    if (existing.workspace !== input.workspace) {
      throw new Error('Project memory belongs to a different workspace')
    }
    await db.updateById(chatProjectMemoryResource, id, {
      text: input.memory.text,
      sourceMessage: input.memory.sourceMessage,
      updatedAt: now,
    })
    return
  }
  if (!chatProjectMemoryRepository.create) {
    throw new Error('Chat project memory repository does not support create')
  }
  await chatProjectMemoryRepository.create(db, {
    id,
    workspace: input.workspace,
    text: input.memory.text,
    sourceMessage: input.memory.sourceMessage,
    createdAt: input.memory.createdAt ? new Date(input.memory.createdAt) : now,
    updatedAt: now,
  })
}

async function deleteChatProjectMemory(
  db: SolidDatabase,
  input: { workspace: string; id: string },
): Promise<void> {
  const id = chatProjectMemoryResourceId(input.id)
  const existing = await db.findById(chatProjectMemoryResource, id)
  if (!existing) return
  if (existing.workspace !== input.workspace) {
    throw new Error('Project memory belongs to a different workspace')
  }
  await db.deleteById(chatProjectMemoryResource, id)
}

/**
 * Applies an explicit editor diff. Memories created by another client after
 * `previous` was read, and fields not changed in this editor, are left untouched.
 */
export async function reconcileChatProjectContext(
  db: SolidDatabase,
  input: ReconcileChatProjectContextInput,
): Promise<ChatProjectContextSnapshot> {
  if (input.previous.workspace !== input.next.workspace) {
    throw new Error('Project context workspace cannot change during reconciliation')
  }
  const instructionsChanged = input.previous.instructions !== input.next.instructions
  const memoryEnabledChanged = input.previous.memoryEnabled !== input.next.memoryEnabled
  if (instructionsChanged || memoryEnabledChanged) {
    await writeChatProjectSettings(db, {
      workspace: input.next.workspace,
      ...(instructionsChanged ? { instructions: input.next.instructions } : {}),
      ...(memoryEnabledChanged ? { memoryEnabled: input.next.memoryEnabled } : {}),
    })
  }
  const previousMemories = new Map(input.previous.memories.map((memory) => [chatProjectMemoryResourceId(memory.id), memory]))
  const changedMemories = input.next.memories.filter((memory) => {
    const previous = previousMemories.get(chatProjectMemoryResourceId(memory.id))
    return !previous || previous.text !== memory.text || previous.sourceMessage !== memory.sourceMessage
  })
  await Promise.all(changedMemories.map((memory) => upsertChatProjectMemory(db, {
    workspace: input.next.workspace,
    memory,
  })))
  const retainedIds = new Set(input.next.memories.map((memory) => chatProjectMemoryResourceId(memory.id)))
  await Promise.all(input.previous.memories
    .filter((memory) => !retainedIds.has(chatProjectMemoryResourceId(memory.id)))
    .map((memory) => deleteChatProjectMemory(db, {
      workspace: input.next.workspace,
      id: memory.id,
    })))
  return readChatProjectContext(db, input.next.workspace)
}
