import { describe, expect, it } from 'vitest'
import {
  chatResource,
  chatResourceId,
  messageResourceId,
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
      commandKind: 'task',
      surfaceId: 'secretary',
    })).toBe('task/secretary/index.ttl#thread_1')
    expect(messageResourceId('msg_1', {
      commandKind: 'chat',
      surfaceId: 'default',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('chat/default/2026/05/18/messages.ttl#msg_1')
    expect(runResourceId('run_1', {
      commandKind: 'task',
      surfaceId: 'secretary',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('task/secretary/2026/05/18/runs.ttl#run_1')
    expect(runStepResourceId('step_1', {
      runId: 'task/secretary/2026/05/18/runs.ttl#run_1',
    })).toBe('task/secretary/2026/05/18/runs.ttl#step_1')
  })

  it('accepts seconds and milliseconds numeric timestamps', () => {
    expect(runResourceId('run_seconds', {
      commandKind: 'task',
      surfaceId: 'secretary',
      createdAt: Date.UTC(2026, 4, 18, 1, 2, 3) / 1000,
    })).toBe('task/secretary/2026/05/18/runs.ttl#run_seconds')

    expect(runResourceId('run_millis', {
      commandKind: 'task',
      surfaceId: 'secretary',
      createdAt: Date.UTC(2026, 4, 18, 1, 2, 3),
    })).toBe('task/secretary/2026/05/18/runs.ttl#run_millis')
  })

  it('keeps explicit ids exact and leaves schema subjectTemplate empty', () => {
    expect(chatResource.resolveUri('default/index.ttl#this'))
      .toBe('/.data/chat/default/index.ttl#this')
    expect(chatResource.getSubjectTemplate()).toBeUndefined()
  })
})
