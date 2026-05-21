import { describe, expect, it } from 'vitest'
import {
  chatResourceId,
  matrixAccountResourceId,
  matrixEventResourceId,
  matrixRoomResourceId,
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
    expect(matrixAccountResourceId(undefined, {
      matrixUserId: '@alice:example.com',
    })).toBe('accounts/~40alice~3Aexample.com.ttl#this')
    expect(matrixRoomResourceId(undefined, {
      matrixRoomId: '!room:example.com',
    })).toBe('rooms/~21room~3Aexample.com/index.ttl#this')
    expect(matrixEventResourceId(undefined, {
      matrixRoomId: '!room:example.com',
      matrixEventId: '$event:example.com',
      createdAt: new Date('2026-05-18T01:02:03.000Z'),
    })).toBe('rooms/~21room~3Aexample.com/2026/05/18/events.ttl#~24event~3Aexample.com')
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

  it('keeps explicit resource id helpers exact', () => {
    expect(chatResourceId('default')).toBe('default/index.ttl#this')
  })
})
