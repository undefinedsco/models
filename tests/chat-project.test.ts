import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SolidDatabase } from '../src/repository'
import {
  chatProjectContextRepository,
  chatProjectContextResource,
  chatProjectContextResourceId,
  chatProjectMemoryRepository,
  chatProjectMemoryResource,
  chatProjectMemoryResourceId,
  conversationShareRepository,
  conversationShareResource,
  removeConversationShare,
  readChatProjectContext,
  writeChatProjectContext,
  reconcileChatProjectContext,
  markConversationShareRevoked,
  emptyChatProjectContext,
} from '../src'

const db = {} as SolidDatabase

// Regression: published models lacked the APIs consumed by LinX Chat.
describe('published Chat editor contracts', () => {
  afterEach(() => vi.restoreAllMocks())

  const workspace = 'https://pod.example/workspaces/linx/'
  const snapshot = () => emptyChatProjectContext(workspace)
  const memory = (id = 'memory') => ({ id, text: 'Remember this', createdAt: '2026-09-01T00:00:00Z' })
  function setup(existingContext = true) {
    vi.spyOn(chatProjectContextRepository, 'list').mockResolvedValue(existingContext
      ? [{ id: 'context.ttl', workspace }] as never : [])
    vi.spyOn(chatProjectMemoryRepository, 'list').mockResolvedValue([])
    return {
      findById: vi.fn(async (): Promise<unknown> => null),
      updateById: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    }
  }

  it('creates first settings and new memories using stable normalized ids', async () => {
    const exactDb = setup(false)
    const createContext = vi.spyOn(chatProjectContextRepository, 'create').mockResolvedValue({} as never)
    const createMemory = vi.spyOn(chatProjectMemoryRepository, 'create').mockResolvedValue({} as never)
    const next = { ...snapshot(), instructions: 'Concise', memoryEnabled: false, memories: [memory('memory/1'), { ...memory('now'), createdAt: '' }] }
    await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, { previous: snapshot(), next })
    expect(createContext).toHaveBeenCalledWith(exactDb, expect.objectContaining({
      id: chatProjectContextResourceId(workspace), workspace, instructions: 'Concise', memoryEnabled: false,
    }))
    expect(createMemory).toHaveBeenCalledWith(exactDb, expect.objectContaining({ id: 'memory%2F1.ttl', createdAt: new Date(memory().createdAt) }))
    expect(createMemory).toHaveBeenCalledWith(exactDb, expect.objectContaining({ id: 'now.ttl', createdAt: expect.any(Date) }))
  })

  it('updates a retained memory without deleting its normalized id', async () => {
    const exactDb = setup()
    exactDb.findById.mockResolvedValue({ workspace })
    const next = { ...snapshot(), memories: [{ ...memory('memory.ttl'), text: 'Updated', sourceMessage: 'https://pod.example/message' }] }
    await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
      previous: { ...snapshot(), memories: [memory()] }, next,
    })
    expect(exactDb.updateById).toHaveBeenCalledWith(chatProjectMemoryResource, 'memory.ttl', expect.objectContaining({ text: 'Updated', sourceMessage: 'https://pod.example/message' }))
    expect(exactDb.deleteById).not.toHaveBeenCalled()
  })

  it('does not overwrite a memory from a different workspace', async () => {
    const exactDb = setup()
    exactDb.findById.mockResolvedValue({ workspace: 'https://pod.example/other/' })
    await expect(reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
      previous: snapshot(), next: { ...snapshot(), memories: [memory()] },
    })).rejects.toThrow('different workspace')
    expect(exactDb.updateById).not.toHaveBeenCalled()
    expect(exactDb.deleteById).not.toHaveBeenCalled()
  })

  it('tolerates a baseline memory already removed by another client', async () => {
    const exactDb = setup()
    await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
      previous: { ...snapshot(), memories: [memory()] }, next: snapshot(),
    })
    expect(exactDb.findById).toHaveBeenCalledWith(chatProjectMemoryResource, 'memory.ttl')
    expect(exactDb.deleteById).not.toHaveBeenCalled()
  })

  it.each(['same workspace', 'different workspace', 'missing'] as const)('handles a failed first settings write with %s winner', async (winner) => {
    const exactDb = setup(false)
    const original = new Error('Conditional write failed')
    vi.spyOn(chatProjectContextRepository, 'create').mockRejectedValue(original)
    exactDb.findById.mockResolvedValue(winner === 'missing' ? null : { workspace: winner === 'same workspace' ? workspace : 'https://pod.example/other/' })
    const pending = reconcileChatProjectContext(exactDb as unknown as SolidDatabase, { previous: snapshot(), next: { ...snapshot(), instructions: 'Changed' } })
    if (winner === 'same workspace') {
      await pending
      expect(exactDb.updateById).toHaveBeenCalledWith(chatProjectContextResource, chatProjectContextResourceId(workspace), expect.objectContaining({ instructions: 'Changed' }))
      expect(exactDb.updateById.mock.calls[0][2]).not.toHaveProperty('memoryEnabled')
    } else {
      await expect(pending).rejects.toThrow(winner === 'missing' ? original : 'different workspace')
      expect(exactDb.updateById).not.toHaveBeenCalled()
    }
  })

  it.each(['settings', 'memory'] as const)('reports unsupported %s creation explicitly', async (target) => {
    const exactDb = setup(target !== 'settings')
    const repository = target === 'settings' ? chatProjectContextRepository : chatProjectMemoryRepository
    const original = repository.create
    repository.create = undefined
    try {
      await expect(reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
        previous: snapshot(), next: { ...snapshot(), instructions: 'Changed', memories: target === 'memory' ? [memory()] : [] },
      })).rejects.toThrow('does not support create')
    } finally {
      repository.create = original as never
    }
  })

  it('propagates failed memory creation without deleting baseline memories', async () => {
    const exactDb = setup()
    vi.spyOn(chatProjectMemoryRepository, 'create').mockRejectedValue(new Error('Pod unavailable'))
    await expect(reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
      previous: { ...snapshot(), memories: [memory('old')] }, next: { ...snapshot(), memories: [memory('new')] },
    })).rejects.toThrow('Pod unavailable')
    expect(exactDb.deleteById).not.toHaveBeenCalled()
  })

  it('supplies the current revocation timestamp when omitted', async () => {
    const updateById = vi.fn()
    const before = Date.now()
    const result = await markConversationShareRevoked({ updateById } as unknown as SolidDatabase, 'share.ttl')
    expect(result.revokedAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.revokedAt.getTime()).toBeLessThanOrEqual(Date.now())
    expect(updateById).toHaveBeenCalledWith(conversationShareResource, 'share.ttl', { revokedAt: result.revokedAt })
  })

  it.each(['list', 'settings update', 'memory lookup', 'memory update', 'memory delete'] as const)('propagates %s failures', async (stage) => {
    const exactDb = setup()
    const error = new Error(`Failed ${stage}`)
    if (stage === 'list') vi.mocked(chatProjectContextRepository.list).mockRejectedValue(error)
    if (stage === 'settings update') exactDb.updateById.mockRejectedValue(error)
    if (stage === 'memory lookup') exactDb.findById.mockRejectedValue(error)
    if (stage === 'memory update') {
      exactDb.findById.mockResolvedValue({ workspace })
      exactDb.updateById.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error)
    }
    if (stage === 'memory delete') {
      exactDb.findById.mockResolvedValue({ workspace })
      exactDb.deleteById.mockRejectedValue(error)
    }
    await expect(reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
      previous: { ...snapshot(), memories: [memory('old')] },
      next: { ...snapshot(), instructions: 'Changed', memories: stage === 'memory delete' ? [] : [memory()] },
    })).rejects.toThrow(error)
  })

  it('rejects failed revocation persistence rather than reporting success', async () => {
    const updateById = vi.fn().mockRejectedValue(new Error('Forbidden'))
    await expect(markConversationShareRevoked({ updateById } as unknown as SolidDatabase, 'share.ttl')).rejects.toThrow('Forbidden')
  })

  it.each(['updated', 'deleted'] as const)('does not overwrite or resurrect an unchanged baseline memory remotely %s', async (remoteState) => {
    const exactDb = setup()
    const createMemory = vi.spyOn(chatProjectMemoryRepository, 'create').mockResolvedValue({} as never)
    const remoteMemory = { ...memory('memory.ttl'), workspace, text: 'Updated by another client', createdAt: new Date(memory().createdAt) }
    exactDb.findById.mockResolvedValue(remoteState === 'updated' ? remoteMemory : null)
    vi.mocked(chatProjectMemoryRepository.list).mockResolvedValue(remoteState === 'updated' ? [remoteMemory] as never : [])
    const previous = { ...snapshot(), memories: [memory()] }
    const next = { ...previous, instructions: 'Changed', memories: [{ ...memory(), id: 'memory.ttl' }] }
    const result = await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, { previous, next })
    expect(createMemory).not.toHaveBeenCalled()
    expect(exactDb.findById).not.toHaveBeenCalled()
    expect(exactDb.deleteById).not.toHaveBeenCalled()
    expect(exactDb.updateById).toHaveBeenCalledTimes(1)
    expect(exactDb.updateById).toHaveBeenCalledWith(chatProjectContextResource, 'context.ttl', expect.objectContaining({ instructions: 'Changed' }))
    expect(result.memories.map(entry => entry.text)).toEqual(remoteState === 'updated' ? ['Updated by another client'] : [])
  })

  it.each(['instructions', 'memoryEnabled'] as const)('writes only the changed settings field: %s', async (field) => {
    const exactDb = setup()
    const next = { ...snapshot(), [field]: field === 'instructions' ? 'Changed' : false }
    await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, { previous: snapshot(), next })
    expect(exactDb.updateById).toHaveBeenCalledTimes(1)
    expect(exactDb.updateById).toHaveBeenCalledWith(chatProjectContextResource, 'context.ttl', expect.objectContaining({ [field]: next[field] }))
    expect(exactDb.updateById.mock.calls[0][2]).not.toHaveProperty(field === 'instructions' ? 'memoryEnabled' : 'instructions')
  })

  it('does not perform any write for identical snapshots', async () => {
    const exactDb = setup()
    const createContext = vi.spyOn(chatProjectContextRepository, 'create').mockResolvedValue({} as never)
    const createMemory = vi.spyOn(chatProjectMemoryRepository, 'create').mockResolvedValue({} as never)
    const previous = { ...snapshot(), memories: [memory()] }
    await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, { previous, next: { ...previous, memories: previous.memories.map(entry => ({ ...entry })) } })
    expect(exactDb.updateById).not.toHaveBeenCalled()
    expect(exactDb.deleteById).not.toHaveBeenCalled()
    expect(exactDb.findById).not.toHaveBeenCalled()
    expect(createContext).not.toHaveBeenCalled()
    expect(createMemory).not.toHaveBeenCalled()
  })

  it('removes only memories present in the editor baseline', async () => {
    const workspace = 'https://pod.example/workspaces/linx/'
    const previous = { ...emptyChatProjectContext(workspace), memories: [
      { id: 'removed.ttl', text: 'Old', createdAt: new Date(0).toISOString() },
    ] }
    const next = { ...previous, memories: [] }
    vi.spyOn(chatProjectContextRepository, 'list').mockResolvedValue([{ id: 'context.ttl', workspace }] as never)
    vi.spyOn(chatProjectMemoryRepository, 'list').mockResolvedValue([
      { id: 'concurrent.ttl', workspace, text: 'Other client', createdAt: new Date(0) },
    ] as never)
    const exactDb = {
      findById: vi.fn(async () => ({ id: 'removed.ttl', workspace })),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    }
    const result = await reconcileChatProjectContext(exactDb as unknown as SolidDatabase, { previous, next })
    expect(exactDb.deleteById.mock.calls.map(call => call[1])).toEqual(['removed.ttl'])
    expect(result.memories.map(memory => memory.id)).toEqual(['concurrent.ttl'])
  })

  it('rejects a workspace change before writing', async () => {
    const updateById = vi.fn()
    await expect(reconcileChatProjectContext({ updateById } as unknown as SolidDatabase, {
      previous: emptyChatProjectContext('https://pod.example/a/'),
      next: emptyChatProjectContext('https://pod.example/b/'),
    })).rejects.toThrow('workspace cannot change')
    expect(updateById).not.toHaveBeenCalled()
  })

  it('rejects deleting a memory owned by another workspace', async () => {
    const workspace = 'https://pod.example/a/'
    const previous = { ...emptyChatProjectContext(workspace), memories: [
      { id: 'foreign.ttl', text: 'Other', createdAt: new Date(0).toISOString() },
    ] }
    vi.spyOn(chatProjectContextRepository, 'list').mockResolvedValue([{ id: 'context.ttl', workspace }] as never)
    const exactDb = {
      findById: vi.fn(async () => ({ workspace: 'https://pod.example/b/' })),
      updateById: vi.fn(), deleteById: vi.fn(),
    }
    await expect(reconcileChatProjectContext(exactDb as unknown as SolidDatabase, {
      previous, next: { ...previous, memories: [] },
    })).rejects.toThrow('different workspace')
    expect(exactDb.deleteById).not.toHaveBeenCalled()
  })

  it('marks revocation by exact id without deleting metadata', async () => {
    const updateById = vi.fn()
    const deleteById = vi.fn()
    const revokedAt = new Date('2026-09-07T00:00:00Z')
    await expect(markConversationShareRevoked({ updateById, deleteById } as unknown as SolidDatabase,
      'share-1.ttl', revokedAt)).resolves.toEqual({ id: 'share-1.ttl', revokedAt })
    expect(updateById).toHaveBeenCalledWith(conversationShareResource, 'share-1.ttl', { revokedAt })
    expect(deleteById).not.toHaveBeenCalled()
  })
})

describe('chat project shared Pod model', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses deterministic resource ids and repository filters', () => {
    expect(chatProjectContextResourceId('https://pod.example/workspaces/linx/')).toBe(
      chatProjectContextResourceId('https://pod.example/workspaces/linx/'),
    )
    expect(chatProjectContextResourceId('https://pod.example/workspaces/other/')).not.toBe(
      chatProjectContextResourceId('https://pod.example/workspaces/linx/'),
    )
    expect(chatProjectMemoryResourceId('memory/1')).toBe('memory%2F1.ttl')
    expect(chatProjectContextRepository.namespace).toBe('chat-project-context')
    expect(chatProjectMemoryRepository.namespace).toBe('chat-project-memory')
    expect(conversationShareRepository.namespace).toBe('conversation-share')
  })

  it('assembles transparent instructions and memories from typed resources', async () => {
    vi.spyOn(chatProjectContextRepository, 'list').mockResolvedValue([{
      id: 'context.ttl',
      workspace: 'https://pod.example/workspaces/linx/',
      instructions: 'Prefer concise answers.',
      memoryEnabled: true,
      createdAt: new Date('2026-08-11T00:00:00Z'),
      updatedAt: new Date('2026-08-11T01:00:00Z'),
    }])
    vi.spyOn(chatProjectMemoryRepository, 'list').mockResolvedValue([{
      id: 'release.ttl',
      workspace: 'https://pod.example/workspaces/linx/',
      text: 'Release is Friday.',
      createdAt: new Date('2026-08-11T00:00:00Z'),
      updatedAt: new Date('2026-08-11T00:00:00Z'),
    }])

    await expect(readChatProjectContext(db, 'https://pod.example/workspaces/linx/')).resolves.toEqual({
      workspace: 'https://pod.example/workspaces/linx/',
      instructions: 'Prefer concise answers.',
      memoryEnabled: true,
      memories: [{ id: 'release.ttl', text: 'Release is Friday.', createdAt: '2026-08-11T00:00:00.000Z' }],
      updatedAt: '2026-08-11T01:00:00.000Z',
    })
  })

  it('reconciles edited and removed memories through repositories', async () => {
    const findById = vi.fn(async () => null)
    const updateById = vi.fn()
    const deleteById = vi.fn(async () => true)
    const exactDb = { findById, updateById, deleteById } as unknown as SolidDatabase
    const createContext = vi.spyOn(chatProjectContextRepository, 'create').mockResolvedValue({} as never)
    vi.spyOn(chatProjectContextRepository, 'list').mockResolvedValue([])
    vi.spyOn(chatProjectMemoryRepository, 'list')
      .mockResolvedValueOnce([{
        id: 'old.ttl',
        workspace: 'https://pod.example/workspaces/linx/',
        text: 'Old',
        createdAt: new Date(0),
        updatedAt: new Date(0),
      }])
      .mockResolvedValueOnce([])
    const createMemory = vi.spyOn(chatProjectMemoryRepository, 'create').mockResolvedValue({} as never)

    await writeChatProjectContext(exactDb, {
      workspace: 'https://pod.example/workspaces/linx/',
      instructions: 'Use project files.',
      memoryEnabled: true,
      memories: [{ id: 'new', text: 'New memory', createdAt: '2026-08-11T00:00:00Z' }],
      updatedAt: new Date(0).toISOString(),
    })

    expect(findById).toHaveBeenCalledWith(expect.any(Object), chatProjectContextResourceId('https://pod.example/workspaces/linx/'))
    expect(createContext).toHaveBeenCalledWith(exactDb, expect.objectContaining({
      id: chatProjectContextResourceId('https://pod.example/workspaces/linx/'),
      workspace: 'https://pod.example/workspaces/linx/',
    }))
    expect(createMemory).toHaveBeenCalledWith(exactDb, expect.objectContaining({ id: 'new.ttl', text: 'New memory' }))
    expect(deleteById).toHaveBeenCalledWith(expect.any(Object), 'old.ttl')
    expect(updateById).not.toHaveBeenCalled()
  })

  it('removes share metadata through an exact base-relative id operation', async () => {
    const deleteById = vi.fn(async () => true)
    const exactDb = { deleteById } as unknown as SolidDatabase

    await expect(removeConversationShare(exactDb, 'share-1.ttl')).resolves.toEqual({ id: 'share-1.ttl' })
    expect(deleteById).toHaveBeenCalledWith(conversationShareResource, 'share-1.ttl')
  })
})
