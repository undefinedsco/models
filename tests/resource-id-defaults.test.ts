import { describe, expect, it } from 'vitest'
import * as Models from '../src'
import {
  agentResource,
  aiModelResource,
  aiProviderResource,
  approvalResource,
  auditResource,
  captureCandidateResource,
  captureEventResource,
  chatResource,
  chatProjectContextResource,
  chatProjectContextResourceId,
  chatProjectMemoryResource,
  conversationShareResource,
  contactResource,
  credentialResource,
  deliveryResource,
  evidenceResource,
  grantResource,
  inboxNotificationResource,
  inputRequestResource,
  issueResource,
  messageResource,
  reportResource,
  runResource,
  runStepResource,
  sessionResource,
  settingsResource,
  skillResource,
  taskResource,
  threadResource,
} from '../src'

describe('command resource id defaults', () => {
  it('generates complete base-relative ids from local keys', () => {
    expect(chatResource.buildId({ id: 'default' })).toBe('default/index.ttl#this')
    expect(taskResource.buildId({ id: 'task_1' })).toBe('index.ttl#task_1')
    expect(threadResource.buildId({
      id: 'thread_1',
      parent: 'https://pod.example/.data/chat/secretary/index.ttl#this',
    })).toBe('chat/secretary/index.ttl#thread_1')
    expect(threadResource.buildId({
      id: 'thread_parent_chat',
      parent: 'https://pod.example/.data/chat/secretary/index.ttl#this',
    })).toBe('chat/secretary/index.ttl#thread_parent_chat')
    expect(threadResource.buildId({
      id: 'worker_thread_1',
      parent: 'https://pod.example/.data/task/index.ttl#task_1',
    })).toBe('task/task_1/index.ttl#worker_thread_1')
    expect(threadResource.buildId({
      id: 'worker_thread_parent',
      parent: 'https://pod.example/.data/task/index.ttl#task_1',
    })).toBe('task/task_1/index.ttl#worker_thread_parent')
    expect(messageResource.buildId({
      id: 'msg_1',
      parent: 'https://pod.example/.data/chat/default/index.ttl#this',
      chat: 'https://pod.example/.data/chat/default/index.ttl#this',
      thread: 'https://pod.example/.data/chat/default/index.ttl#thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/messages.ttl#msg_1')
    expect(messageResource.buildId({
      id: 'task_msg_1',
      parent: 'https://pod.example/.data/task/index.ttl#task_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/messages.ttl#task_msg_1')
    expect(runResource.buildId({
      id: 'run_1',
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      thread: 'https://pod.example/.data/chat/default/index.ttl#thread_1',
      workspace: 'https://pod.example/workspaces/default/',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/runs.ttl#run_1')
    expect(deliveryResource.buildId({
      id: 'delivery_1',
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      thread: 'https://pod.example/.data/chat/default/index.ttl#thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/deliveries.ttl#delivery_1')
    expect(runResource.buildId({
      id: 'worker_run_1',
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      thread: 'https://pod.example/.data/task/task_1/index.ttl#worker_thread_1',
      workspace: 'https://pod.example/workspaces/default/',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/runs.ttl#worker_run_1')
    expect(deliveryResource.buildId({
      id: 'worker_delivery_1',
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      thread: 'https://pod.example/.data/task/task_1/index.ttl#worker_thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/deliveries.ttl#worker_delivery_1')
    expect(evidenceResource.buildId({
      id: 'evidence_1',
      run: 'https://pod.example/.data/chat/default/2026/05/18/runs.ttl#run_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('evidence/2026/05/18.ttl#evidence_1')
    expect(evidenceResource.buildId({
      id: 'worker_evidence_1',
      thread: 'https://pod.example/.data/task/task_1/index.ttl#worker_thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('evidence/2026/05/18.ttl#worker_evidence_1')
    expect(reportResource.buildId({
      id: 'report_1',
      delivery: 'https://pod.example/.data/chat/default/2026/05/18/deliveries.ttl#delivery_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/reports.ttl#report_1')
    expect(runStepResource.buildId({
      id: 'step_1',
      run: 'chat/default/2026/05/18/runs.ttl#run_1',
      stepType: 'run.started',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/runs.ttl#step_1')
    expect(runStepResource.buildId({
      id: 'step_2',
      run: 'https://pod.example/.data/chat/default/2026/05/18/runs.ttl#run_1',
      stepType: 'run.started',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/runs.ttl#step_2')
    expect(aiModelResource.buildId({
      id: 'gpt-5.5',
      isProvidedBy: '/settings/providers/openai.ttl',
    })).toBe('openai.ttl#gpt-5.5')
    expect(aiModelResource.buildId({
      id: 'openai/gpt-4o-mini',
      isProvidedBy: 'https://pod.example/settings/providers/openrouter.ttl',
    })).toBe('openrouter.ttl#openai/gpt-4o-mini')
    expect(agentResource.buildId({
      id: '__secretary__',
    })).toBe('__secretary__/')
    expect(skillResource.buildId({
      id: 'symphony',
      agent: 'https://pod.example/agents/__secretary__/',
    })).toBe('__secretary__/skills/symphony/')
    expect(skillResource.buildId({
      id: 'symphony',
      agent: '__secretary__',
    })).toBe('__secretary__/skills/symphony/')
    expect(aiProviderResource.buildId({ id: 'openai' })).toBe('openai.ttl')
    expect(credentialResource.buildId({ id: 'cred_abc123' })).toBe('credentials.ttl#cred_abc123')
    expect(approvalResource.buildId({
      id: 'approval_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('2026/05/18.ttl#approval_1')
    expect(auditResource.buildId({
      id: 'audit_1',
      action: 'approval.created',
      actor: 'https://pod.example/profile/card#me',
      actorRole: 'user',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('2026/05/18.ttl#audit_1')
    expect(contactResource.buildId({ id: 'person_1' })).toBe('person_1.ttl')
    expect(grantResource.buildId({ id: 'grant_1' })).toBe('grant_1.ttl')
    expect(inboxNotificationResource.buildId({ id: 'notification_1' })).toBe('notification_1.ttl')
    expect(inputRequestResource.buildId({
      id: 'input_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('2026/05/18.ttl#input_1')
    expect(captureCandidateResource.buildId({
      id: 'candidate_1',
      source: 'https://pod.example/.data/chat/default/2026/05/18/messages.ttl#msg_1',
      summary: 'Potential project memory',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('candidates/2026/05/18.ttl#candidate_1')
    expect(captureEventResource.buildId({
      id: 'event_1',
      source: 'https://pod.example/.data/chat/default/2026/05/18/messages.ttl#msg_1',
      decision: 'candidate_created',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('events/2026/05/18.ttl#event_1')
    expect(issueResource.buildId({ id: 'issue_1' })).toBe('issue_1.ttl')
    expect(sessionResource.buildId({
      id: 'session_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('2026/05/18/session_1.ttl')
    expect(settingsResource.buildId({ id: 'ui.theme' })).toBe('ui.theme.ttl')
    expect(chatProjectContextResource.buildId({
      id: chatProjectContextResourceId('https://pod.example/workspaces/linx/'),
      workspace: 'https://pod.example/workspaces/linx/',
    })).toMatch(/\.ttl$/u)
    expect(chatProjectMemoryResource.buildId({ id: 'memory/1' })).toBe('memory%2F1.ttl')
    expect(conversationShareResource.buildId({ id: 'share/1' })).toBe('share%2F1.ttl')
  })

  it('accepts seconds and milliseconds numeric timestamps', () => {
    expect(runResource.buildId({
      id: 'run_seconds',
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      thread: 'https://pod.example/.data/chat/default/index.ttl#thread_1',
      workspace: 'https://pod.example/workspaces/default/',
      createdAt: Date.UTC(2026, 4, 18, 1, 2, 3) / 1000,
    })).toBe('chat/default/2026/05/18/runs.ttl#run_seconds')

    expect(runResource.buildId({
      id: 'run_millis',
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      thread: 'https://pod.example/.data/chat/default/index.ttl#thread_1',
      workspace: 'https://pod.example/workspaces/default/',
      createdAt: Date.UTC(2026, 4, 18, 1, 2, 3),
    })).toBe('chat/default/2026/05/18/runs.ttl#run_millis')
  })

  it('derives message storage only from parent while retaining chat/thread as semantic relations', () => {
    expect(messageResource.buildId({
      id: 'msg_parent_chat',
      parent: 'https://pod.example/.data/chat/default/index.ttl#this',
      chat: 'https://pod.example/.data/chat/default/index.ttl#this',
      thread: 'https://pod.example/.data/chat/secretary/index.ttl#thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/messages.ttl#msg_parent_chat')

    expect(messageResource.buildId({
      id: 'msg_parent_task',
      parent: 'https://pod.example/.data/task/index.ttl#task_1',
      chat: 'https://pod.example/.data/chat/default/index.ttl#this',
      thread: 'https://pod.example/.data/task/task_1/index.ttl#worker_thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/messages.ttl#msg_parent_task')
  })

  it('does not export command-surface path helpers', () => {
    expect((Models as Record<string, unknown>).commandKindFromResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).surfaceFromCommandResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).surfaceIdFromCommandResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).buildPodResourceIri).toBeUndefined()
    expect((Models as Record<string, unknown>).buildPodResourceIriForResource).toBeUndefined()
    expect((Models as Record<string, unknown>).normalizePodDataResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).resolvePodBaseUrl).toBeUndefined()
    expect((Models as Record<string, unknown>).resolvePodResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).resolvePodResourceTemplateValue).toBeUndefined()
    expect((Models as Record<string, unknown>).aiModelResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).chatResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).messageResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).runResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).buildApprovalResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).buildSessionResourceId).toBeUndefined()
  })

  it('keeps explicit ids exact and leaves legacy templates empty', () => {
    expect(chatResource.resolveUri('default/index.ttl#this'))
      .toBe('/.data/chat/default/index.ttl#this')
    expect(chatResource.getSubjectTemplate()).toBeUndefined()
    expect(aiModelResource.resolveUri('openai.ttl#gpt-5.5'))
      .toBe('/settings/providers/openai.ttl#gpt-5.5')
    expect(aiModelResource.getSubjectTemplate()).toBeUndefined()
    expect(agentResource.resolveUri('__secretary__/'))
      .toBe('/agents/__secretary__/')
    expect(agentResource.getSubjectTemplate()).toBeUndefined()
    expect(skillResource.resolveUri('__secretary__/skills/symphony/'))
      .toBe('/agents/__secretary__/skills/symphony/')
    expect(skillResource.getSubjectTemplate()).toBeUndefined()
  })
})
