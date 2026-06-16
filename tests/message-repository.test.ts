import { describe, expect, it } from 'vitest'
import type { SolidDatabase } from '../src/repository'
import { messageRepository } from '../src/message.repository'
import type { MessageRow } from '../src/message.schema'

class MockSelectBuilder<Row> {
  constructor(private readonly rows: Row[]) {}
  whereArgs: unknown[] = []
  orderArgs: unknown[] = []

  where(arg: unknown) {
    this.whereArgs.push(arg)
    return this
  }

  orderBy(...args: unknown[]) {
    this.orderArgs.push(args)
    return this
  }

  async execute() {
    return this.rows
  }
}

class MockDatabase<Row> {
  lastSelectQuery: MockSelectBuilder<Row> | null = null

  constructor(private readonly rows: Row[]) {}

  select() {
    return {
      from: () => {
        const builder = new MockSelectBuilder<Row>(this.rows)
        this.lastSelectQuery = builder
        return builder
      },
    }
  }
}

const baseMessage = {
  id: 'chat/default/2026/06/16/messages.ttl#msg-1',
  parent: 'https://pod.example/.data/chat/default/index.ttl#this',
  chat: 'https://pod.example/.data/chat/default/index.ttl#this',
  thread: 'https://pod.example/.data/chat/default/index.ttl#thread-1',
  maker: 'https://pod.example/profile/card#me',
  role: 'user',
  content: 'hello',
  richContent: null,
  status: 'sent',
  toolName: null,
  toolCallId: null,
  metadata: null,
  replacedBy: null,
  deletedAt: null,
  senderName: null,
  senderAvatarUrl: null,
  mentions: null,
  replyTo: null,
  routedBy: null,
  routeTargetAgent: null,
  coordinationId: null,
  createdAt: new Date('2026-06-16T00:00:00Z'),
  updatedAt: null,
} as unknown as MessageRow

describe('messageRepository', () => {
  it('applies exact model field filters in list queries', async () => {
    const db = new MockDatabase<MessageRow>([baseMessage])

    await messageRepository.list(db as unknown as SolidDatabase, {
      parent: 'https://pod.example/.data/chat/default/index.ttl#this',
      thread: 'https://pod.example/.data/chat/default/index.ttl#thread-1',
      role: 'user',
    })

    expect(db.lastSelectQuery?.whereArgs.length).toBe(1)
    expect(db.lastSelectQuery?.orderArgs.length).toBe(1)
  })

  it('does not add an empty exact-filter clause for search-only list queries', async () => {
    const db = new MockDatabase<MessageRow>([baseMessage])

    await messageRepository.list(db as unknown as SolidDatabase, {
      search: 'hello',
    })

    expect(db.lastSelectQuery?.whereArgs.length).toBe(1)
    expect(db.lastSelectQuery?.orderArgs.length).toBe(1)
  })
})
