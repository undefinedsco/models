import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SolidDatabase } from '../src/repository'
import {
  chatProjectContextRepository,
  chatProjectContextResourceId,
  chatProjectMemoryRepository,
  chatProjectMemoryResourceId,
  conversationShareRepository,
  conversationShareResource,
  removeConversationShare,
  readChatProjectContext,
  writeChatProjectContext,
} from '../src'

const db = {} as SolidDatabase

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
