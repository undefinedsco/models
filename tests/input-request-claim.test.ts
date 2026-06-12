import { describe, expect, it } from 'vitest'
import {
  claimInputRequest,
  inputRequestResource,
  isInputRequestStatusClaimable,
  type InputRequestClaimDatabase,
  type InputRequestRow,
  type InputRequestUpdate,
} from '../src'

function createDb(initial: InputRequestRow | null): InputRequestClaimDatabase & {
  row: InputRequestRow | null
  updates: InputRequestUpdate[]
} {
  const state: { row: InputRequestRow | null; updates: InputRequestUpdate[] } = {
    row: initial,
    updates: [],
  }
  return {
    get row() {
      return state.row
    },
    set row(value) {
      state.row = value
    },
    get updates() {
      return state.updates
    },
    async findByIri(resource, iri) {
      expect(resource).toBe(inputRequestResource)
      expect(iri).toBe('https://pod.example/.data/input-requests/2026/06/12.ttl#input_1')
      return state.row as never
    },
    async updateByIri(resource, iri, data) {
      expect(resource).toBe(inputRequestResource)
      expect(iri).toBe('https://pod.example/.data/input-requests/2026/06/12.ttl#input_1')
      state.updates.push(data)
      state.row = state.row ? { ...state.row, ...data } : null
      return state.row as never
    },
  }
}

function inputRequest(overrides: Partial<InputRequestRow> = {}): InputRequestRow {
  return {
    id: '2026/06/12.ttl#input_1',
    session: 'https://pod.example/.data/sessions/2026/06/12/session_1.ttl',
    requestKind: 'user-input',
    prompt: 'Which branch should the worker use?',
    status: 'pending',
    createdAt: new Date('2026-06-12T00:00:00.000Z'),
    ...overrides,
  } as InputRequestRow
}

describe('input request claim repository', () => {
  it('claims pending input requests with the shared control lease lifecycle', async () => {
    const db = createDb(inputRequest())

    const result = await claimInputRequest(db, {
      inputRequest: 'https://pod.example/.data/input-requests/2026/06/12.ttl#input_1',
      leaseOwner: 'client:desktop',
      leaseDurationMs: 90_000,
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(result.status).toBe('claimed')
    expect(result.leaseOwner).toBe('client:desktop')
    expect(result.leaseExpiresAt).toBe('2026-06-12T00:01:30.000Z')
    expect(db.updates).toEqual([
      {
        status: 'handling',
        leaseOwner: 'client:desktop',
        leaseExpiresAt: new Date('2026-06-12T00:01:30.000Z'),
      },
    ])
  })

  it('does not claim resolved input requests', async () => {
    const db = createDb(inputRequest({ status: 'resolved' }))

    const result = await claimInputRequest(db, {
      inputRequest: 'https://pod.example/.data/input-requests/2026/06/12.ttl#input_1',
      leaseOwner: 'client:desktop',
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(result.status).toBe('not_actionable')
    expect(db.updates).toEqual([])
  })

  it('shares actionable status semantics with approval requests', () => {
    expect(isInputRequestStatusClaimable(undefined)).toBe(true)
    expect(isInputRequestStatusClaimable('pending')).toBe(true)
    expect(isInputRequestStatusClaimable('handling')).toBe(true)
    expect(isInputRequestStatusClaimable('resolved')).toBe(false)
    expect(isInputRequestStatusClaimable('expired')).toBe(false)
  })
})
