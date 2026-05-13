import { describe, expect, expectTypeOf, it } from 'vitest'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  UDFS,
  WF,
  ChatBaseVocab,
  MessageVocab,
  ContactVocab,
  ThreadVocab,
} from '../src/index'

import type { ChatRow } from '../src/chat.schema'
import type { ThreadRow } from '../src/thread.schema'
import type { MessageRow } from '../src/message.schema'
import type { ContactTypeValue } from '../src/contact.schema'

import {
  fixtureChatDirectAI,
  fixtureThreadDirectAI,
  fixtureMessageTooling,
  fixtureToolApprovalBlock,
  fixtureToolCallBlock,
  fixtureTaskProgressBlock,
} from '../src/fixtures/contracts-chat-contact'

describe('Wave A CP0 contracts: namespaces', () => {
  it('exposes UDFS with expected base URI and terms', () => {
    // Company-level namespace (udfs:) is used for all Wave A terms.
    expect(UDFS.NAMESPACE).toBe('https://undefineds.co/ns#')

    expect(UDFS.workspace).toBe('https://undefineds.co/ns#workspace')
    expect(UDFS.policyRef).toBe('https://undefineds.co/ns#policyRef')
    expect(UDFS.policyVersion).toBe('https://undefineds.co/ns#policyVersion')
    expect(UDFS.parentThreadId).toBe('https://undefineds.co/ns#parentThreadId')

    expect(UDFS.coordinationId).toBe('https://undefineds.co/ns#coordinationId')
  })
})

describe('Wave A CP0 contracts: vocab ttl files', () => {
  it('includes TTL vocab definitions for subclassing and predicates', () => {
    const chatTtl = readFileSync(resolve(__dirname, '../src/vocab/linx-chat.ttl'), 'utf-8')
    expect(chatTtl).toContain('udfs:workspace')
    expect(chatTtl).toContain('wf:participant')

    const msgTtl = readFileSync(resolve(__dirname, '../src/vocab/linx-message.ttl'), 'utf-8')
    expect(msgTtl).toContain('udfs:coordinationId')
  })
})

describe('Wave A CP0 contracts: centralized vocabs', () => {
  it('ChatBaseVocab uses flow/wf participant predicate', () => {
    expect(ChatBaseVocab.participants).toBe(WF.participant)
  })

  it('ThreadVocab exposes workspace context', () => {
    expect(ThreadVocab.workspace).toBe(UDFS.workspace)
  })

  it('MessageVocab exposes routing predicates', () => {
    expect(MessageVocab.routedBy).toBe(UDFS.routedBy)
    expect(MessageVocab.routeTargetAgentId).toBe(UDFS.routeTargetAgentId)
    expect(MessageVocab.coordinationId).toBe(UDFS.coordinationId)
  })

  it('ContactVocab remains stable for core fields', () => {
    expect(ContactVocab.contactType).toBeDefined()
    expect(ContactVocab.name).toBeDefined()
  })
})

describe('Wave A CP0 contracts: schema types', () => {
  it('ChatRow is a thin channel container', () => {
    expectTypeOf<ChatRow>().toHaveProperty('participants')
    expectTypeOf<ChatRow>().not.toHaveProperty('chatType')
    expectTypeOf<ChatRow>().not.toHaveProperty('contact')
  })

  it('ThreadRow contains workspace context only', () => {
    expectTypeOf<ThreadRow>().toHaveProperty('workspace')
    expectTypeOf<ThreadRow>().not.toHaveProperty('policyRef')
    expectTypeOf<ThreadRow>().not.toHaveProperty('policyVersion')
    expectTypeOf<ThreadRow>().not.toHaveProperty('parentThreadId')
    expectTypeOf<ThreadRow>().not.toHaveProperty('sessionStatus')
  })

  it('MessageRow contains group/routing extensions', () => {
    expectTypeOf<MessageRow>().toHaveProperty('senderName')
    expectTypeOf<MessageRow>().toHaveProperty('mentions')
    expectTypeOf<MessageRow>().toHaveProperty('coordinationId')
  })

  it('ContactTypeValue includes group', () => {
    const v: ContactTypeValue = 'group'
    expect(v).toBe('group')
  })
})

describe('Wave A CP0 fixtures compile and are stable', () => {
  it('exports minimal fixtures for downstream consumption', () => {
    expect(fixtureChatDirectAI.participants?.length).toBeGreaterThanOrEqual(2)

    expect(fixtureThreadDirectAI.workspace).toContain('/.data/agent-workspaces/')

    expect(fixtureMessageTooling.richContent).toContain('tool_approval')

    expect(fixtureToolCallBlock.type).toBe('tool')
    expect(fixtureToolApprovalBlock.type).toBe('tool_approval')
    expect(fixtureTaskProgressBlock.type).toBe('task_progress')
  })
})
