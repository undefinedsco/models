import { describe, expect, it } from 'vitest'
import * as Models from '../src'
import {
  chatResource,
  chatResourceId,
  messageResourceId,
  deliveryResourceId,
  evidenceResourceId,
  reportResourceId,
  runResourceId,
  runStepResourceId,
  taskResourceId,
  threadResourceId,
} from '../src'

describe('command resource id defaults', () => {
  it('generates complete base-relative ids from local keys', () => {
    expect(chatResourceId('default')).toBe('default/index.ttl#this')
    expect(taskResourceId('task_1')).toBe('index.ttl#task_1')
    expect(threadResourceId('thread_1', {
      chat: 'https://pod.example/.data/chat/secretary/index.ttl#this',
    })).toBe('chat/secretary/index.ttl#thread_1')
    expect(messageResourceId('msg_1', {
      chat: 'https://pod.example/.data/chat/default/index.ttl#this',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/messages.ttl#msg_1')
    expect(runResourceId('run_1', {
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/runs.ttl#run_1')
    expect(deliveryResourceId('delivery_1', {
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/deliveries.ttl#delivery_1')
    expect(evidenceResourceId('evidence_1', {
      run: 'https://pod.example/.data/task/task_1/2026/05/18/runs.ttl#run_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/evidence.ttl#evidence_1')
    expect(reportResourceId('report_1', {
      delivery: 'https://pod.example/.data/task/task_1/2026/05/18/deliveries.ttl#delivery_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/task_1/2026/05/18/reports.ttl#report_1')
    expect(runStepResourceId('step_1', {
      run: 'task/task_1/2026/05/18/runs.ttl#run_1',
    })).toBe('task/task_1/2026/05/18/runs.ttl#step_1')
  })

  it('accepts seconds and milliseconds numeric timestamps', () => {
    expect(runResourceId('run_seconds', {
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      createdAt: Date.UTC(2026, 4, 18, 1, 2, 3) / 1000,
    })).toBe('task/task_1/2026/05/18/runs.ttl#run_seconds')

    expect(runResourceId('run_millis', {
      task: 'https://pod.example/.data/task/index.ttl#task_1',
      createdAt: Date.UTC(2026, 4, 18, 1, 2, 3),
    })).toBe('task/task_1/2026/05/18/runs.ttl#run_millis')
  })

  it('derives message storage from thread when chat is not provided', () => {
    expect(messageResourceId('msg_thread', {
      thread: 'https://pod.example/.data/chat/secretary/index.ttl#thread_1',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/secretary/2026/05/18/messages.ttl#msg_thread')
  })

  it('does not export command-surface path helpers', () => {
    expect((Models as Record<string, unknown>).commandKindFromResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).surfaceFromCommandResourceId).toBeUndefined()
    expect((Models as Record<string, unknown>).surfaceIdFromCommandResourceId).toBeUndefined()
  })

  it('keeps explicit ids exact and leaves schema subjectTemplate empty', () => {
    expect(chatResource.resolveUri('default/index.ttl#this'))
      .toBe('/.data/chat/default/index.ttl#this')
    expect(chatResource.getSubjectTemplate()).toBeUndefined()
  })
})
