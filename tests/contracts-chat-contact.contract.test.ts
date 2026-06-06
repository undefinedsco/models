import { describe, expect, expectTypeOf, it } from 'vitest'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  UDFS,
  WF,
  ChatBaseVocab,
  MessageVocab,
  ContactVocab,
  DeliveryVocab,
  AutomationRuleVocab,
  ScheduleVocab,
  SessionVocab,
  RunStepVocab,
  RunVocab,
  TaskVocab,
  ThreadVocab,
} from '../src/index'

import type { ChatRow } from '../src/chat.schema'
import type { ThreadRow } from '../src/thread.schema'
import type { MessageRow } from '../src/message.schema'
import type { DeliveryRow } from '../src/delivery.schema'
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
    expect(UDFS.parentThread).toBe('https://undefineds.co/ns#parentThread')

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

    const workflowTtl = readFileSync(resolve(__dirname, '../src/vocab/linx-workflow.ttl'), 'utf-8')
    expect(workflowTtl).toContain('udfs:Task a rdfs:Class')
    expect(workflowTtl).toContain('udfs:Schedule a rdfs:Class')
    expect(workflowTtl).toContain('udfs:AutomationRule a rdfs:Class')
    expect(workflowTtl).toContain('udfs:Delivery a rdfs:Class')
    expect(workflowTtl).toContain('udfs:Run a rdfs:Class')
    expect(workflowTtl).toContain('udfs:RunStep a rdfs:Class')
    expect(workflowTtl).toContain('udfs:message a rdf:Property')
    expect(workflowTtl).not.toContain('udfs:messageResource')
    expect(workflowTtl).toContain('udfs:externalRunId')
    expect(workflowTtl).toContain('must not hide shared RDF relations')
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
    expect(MessageVocab.routeTargetAgent).toBe(UDFS.routeTargetAgent)
    expect(MessageVocab.coordinationId).toBe(UDFS.coordinationId)
  })

  it('ContactVocab remains stable for core fields', () => {
    expect(ContactVocab.contactType).toBeDefined()
    expect(ContactVocab.name).toBeDefined()
  })

  it('Workflow vocab exposes semantic relation fields without storage partition or *Id/*Uri names', () => {
    expect((DeliveryVocab as Record<string, unknown>).commandKind).toBeUndefined()
    expect((DeliveryVocab as Record<string, unknown>).surface).toBeUndefined()
    expect(TaskVocab.issue).toBe(UDFS.issue)
    expect(TaskVocab.message).toBe(UDFS.message)
    expect(TaskVocab.thread).toBe(UDFS.inThread)
    expect(ScheduleVocab.task).toBe(UDFS.task)
    expect(ScheduleVocab.scheduleKind).toBe(UDFS.scheduleKind)
    expect(AutomationRuleVocab.task).toBe(UDFS.task)
    expect(AutomationRuleVocab.schedule).toBe(UDFS.schedule)
    expect(AutomationRuleVocab.condition).toBe(UDFS.condition)
    expect(DeliveryVocab.task).toBe(UDFS.task)
    expect(DeliveryVocab.projection).toBe(UDFS.projection)
    expect((RunVocab as Record<string, unknown>).commandKind).toBeUndefined()
    expect((RunVocab as Record<string, unknown>).surface).toBeUndefined()
    expect(RunVocab.delivery).toBe(UDFS.delivery)
    expect(RunVocab.trigger).toBe(UDFS.trigger)
    expect(RunStepVocab.run).toBe(UDFS.run)
    expect((RunStepVocab as Record<string, unknown>).commandKind).toBeUndefined()
    expect((RunStepVocab as Record<string, unknown>).surface).toBeUndefined()
    expect(RunStepVocab.stepType).toBe(UDFS.stepType)
    expect(RunStepVocab.payload).toBe(UDFS.payload)
    expect((RunStepVocab as Record<string, unknown>).data).toBeUndefined()
    expect((TaskVocab as Record<string, unknown>).surfaceId).toBeUndefined()
    expect((DeliveryVocab as Record<string, unknown>).surfaceId).toBeUndefined()
    expect((RunVocab as Record<string, unknown>).surfaceId).toBeUndefined()
    expect((RunStepVocab as Record<string, unknown>).surfaceId).toBeUndefined()
  })

  it('Session vocab exposes semantic relation fields without ownerWebId/messageResources names', () => {
    expect(SessionVocab.owner).toBe(UDFS.actor)
    expect(SessionVocab.messages).toBe(UDFS.message)
    expect(SessionVocab.thread).toBe(UDFS.inThread)
    expect(SessionVocab.metadata).toBe(UDFS.metadata)
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
    expectTypeOf<ThreadRow>().not.toHaveProperty('surface')
    expectTypeOf<ThreadRow>().not.toHaveProperty('commandKind')
    expectTypeOf<ThreadRow>().not.toHaveProperty('policyRef')
    expectTypeOf<ThreadRow>().not.toHaveProperty('policyVersion')
    expectTypeOf<ThreadRow>().not.toHaveProperty('parentThread')
    expectTypeOf<ThreadRow>().not.toHaveProperty('surfaceId')
    expectTypeOf<ThreadRow>().not.toHaveProperty('sessionStatus')
  })

  it('DeliveryRow includes semantic relations without command-surface partition fields', () => {
    expectTypeOf<DeliveryRow>().not.toHaveProperty('commandKind')
    expectTypeOf<DeliveryRow>().not.toHaveProperty('surface')
    expectTypeOf<DeliveryRow>().toHaveProperty('task')
    expectTypeOf<DeliveryRow>().toHaveProperty('thread')
    expectTypeOf<DeliveryRow>().toHaveProperty('targetThread')
    expectTypeOf<DeliveryRow>().toHaveProperty('targetSession')
    expectTypeOf<DeliveryRow>().not.toHaveProperty('surfaceId')
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
