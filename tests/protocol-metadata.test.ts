import { describe, expect, it } from 'vitest'
import {
  getProtocolMetadata,
  withProtocolMetadata,
  withoutProtocolProjectionKeys,
} from '../src'

describe('protocol metadata helpers', () => {
  it('stores opaque external ids under an API namespace', () => {
    const metadata = withProtocolMetadata(
      { conversationKind: 'group' },
      'matrix',
      {
        roomId: '!room:example.com',
        eventId: '$event:example.com',
        txnId: undefined,
        stateKey: null,
      },
    )

    expect(metadata).toEqual({
      conversationKind: 'group',
      protocols: {
        matrix: {
          roomId: '!room:example.com',
          eventId: '$event:example.com',
          stateKey: null,
        },
      },
    })
    expect(getProtocolMetadata(metadata, 'matrix')).toEqual({
      roomId: '!room:example.com',
      eventId: '$event:example.com',
      stateKey: null,
    })
  })

  it('removes root-level API projection keys before durable persistence', () => {
    expect(withoutProtocolProjectionKeys({
      chat_id: 'team',
      thread_id: 'thread_1',
      surface_id: 'team',
      protocols: {
        chatkit: {
          chat_id: 'team',
          thread_id: 'chat/team/index.ttl#thread_1',
        },
      },
    }, ['chat_id', 'thread_id'])).toEqual({
      surface_id: 'team',
      protocols: {
        chatkit: {
          chat_id: 'team',
          thread_id: 'chat/team/index.ttl#thread_1',
        },
      },
    })
  })
})
