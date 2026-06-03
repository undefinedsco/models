import { describe, expect, it } from 'vitest'
import {
  buildChatTargetRef,
  buildModelResourceIriForDatabase,
  chatResource,
  extractChatTargetRef,
  extractChatThreadRef,
  resolveModelResourceIriForDatabase,
  threadResource,
} from '../src'
import { extractApprovalIdFromApprovalRef } from '../src/approval.schema'

describe('resource reference helpers', () => {
  it('extracts approval ids only from approval resources', () => {
    expect(extractApprovalIdFromApprovalRef('approval-1')).toBe('approval-1')
    expect(extractApprovalIdFromApprovalRef('https://alice.example/.data/approvals/2026/05/12.ttl#approval-1')).toBe('approval-1')

    expect(extractApprovalIdFromApprovalRef('https://alice.example/.data/workspaces/ws-1/output/report.md')).toBeNull()
    expect(extractApprovalIdFromApprovalRef('https://alice.example/.data/audits/2026/05/12.ttl#audit-1')).toBeNull()
  })

  it('extracts chat and thread ids from thread resource refs', () => {
    expect(extractChatThreadRef('https://alice.example/.data/chat/chat-2/index.ttl#thread-2')).toEqual({
      chatId: 'chat-2',
      threadId: 'thread-2',
    })
  })

  it('builds chat target refs from chat ids and refs', () => {
    expect(buildChatTargetRef('chat-1')).toBe('/.data/chat/chat-1/index.ttl#this')
    expect(buildChatTargetRef('https://alice.example/.data/chat/chat-1/index.ttl#this')).toBe('/.data/chat/chat-1/index.ttl#this')
  })

  it('resolves model resource IRIs from database runtime context', () => {
    const database = {
      getSession: () => ({
        info: { webId: 'https://alice.example/profile/card#me' },
      }),
    }

    expect(buildModelResourceIriForDatabase(database, chatResource, { id: 'chat-1' }))
      .toBe('https://alice.example/.data/chat/chat-1/index.ttl#this')
    expect(resolveModelResourceIriForDatabase(database, threadResource, {
      id: 'thread-1',
      chat: buildChatTargetRef('chat-1'),
    })).toBe('https://alice.example/.data/chat/chat-1/index.ttl#thread-1')
    expect(resolveModelResourceIriForDatabase({}, chatResource, { id: 'chat-2' }))
      .toBeNull()
  })

  it('extracts chat target refs for chat, thread, and message targets', () => {
    expect(extractChatTargetRef('https://alice.example/.data/chat/chat-1/index.ttl#this')).toEqual({
      chatId: 'chat-1',
      threadId: null,
      messageId: null,
    })
    expect(extractChatTargetRef('https://alice.example/.data/chat/chat-1/index.ttl#thread-1')).toEqual({
      chatId: 'chat-1',
      threadId: 'thread-1',
      messageId: null,
    })
    expect(extractChatTargetRef('https://alice.example/.data/chat/chat-1/2026/06/03/messages.ttl#msg-1')).toEqual({
      chatId: 'chat-1',
      threadId: null,
      messageId: 'msg-1',
    })
  })

})
