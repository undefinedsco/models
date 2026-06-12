import { describe, expect, it } from 'vitest'
import {
  approvalResource,
  claimApprovalRequest,
  isApprovalStatusClaimable,
  type ApprovalClaimDatabase,
  type ApprovalRow,
  type ApprovalUpdate,
} from '../src'

function createDb(initial: ApprovalRow | null): ApprovalClaimDatabase & { row: ApprovalRow | null; updates: ApprovalUpdate[] } {
  const state: { row: ApprovalRow | null; updates: ApprovalUpdate[] } = {
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
      expect(resource).toBe(approvalResource)
      expect(iri).toBe('https://pod.example/.data/approvals/2026/06/12.ttl#approval_1')
      return state.row as never
    },
    async updateByIri(resource, iri, data) {
      expect(resource).toBe(approvalResource)
      expect(iri).toBe('https://pod.example/.data/approvals/2026/06/12.ttl#approval_1')
      state.updates.push(data)
      state.row = state.row ? { ...state.row, ...data } : null
      return state.row as never
    },
  }
}

function approval(overrides: Partial<ApprovalRow> = {}): ApprovalRow {
  return {
    id: '2026/06/12.ttl#approval_1',
    session: 'https://pod.example/.data/sessions/2026/06/12/session_1.ttl',
    toolCallId: 'tool_1',
    toolName: 'shell',
    target: 'https://pod.example/.data/chat/default/index.ttl#this',
    action: 'https://undefineds.co/ns#execute',
    risk: 'medium',
    status: 'pending',
    createdAt: new Date('2026-06-12T00:00:00.000Z'),
    ...overrides,
  } as ApprovalRow
}

describe('approval claim repository', () => {
  it('claims pending approval requests with durable lease fields', async () => {
    const db = createDb(approval())

    const result = await claimApprovalRequest(db, {
      approval: 'https://pod.example/.data/approvals/2026/06/12.ttl#approval_1',
      leaseOwner: 'client:cli',
      leaseDurationMs: 120_000,
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(result.status).toBe('claimed')
    expect(result.leaseOwner).toBe('client:cli')
    expect(result.leaseExpiresAt).toBe('2026-06-12T00:02:00.000Z')
    expect(db.updates).toEqual([
      {
        status: 'handling',
        leaseOwner: 'client:cli',
        leaseExpiresAt: new Date('2026-06-12T00:02:00.000Z'),
      },
    ])
    expect(db.row).toMatchObject({
      status: 'handling',
      leaseOwner: 'client:cli',
      leaseExpiresAt: new Date('2026-06-12T00:02:00.000Z'),
    })
  })

  it('does not steal an active foreign lease', async () => {
    const db = createDb(approval({
      status: 'handling',
      leaseOwner: 'client:web',
      leaseExpiresAt: new Date('2026-06-12T00:05:00.000Z'),
    }))

    const result = await claimApprovalRequest(db, {
      approval: 'https://pod.example/.data/approvals/2026/06/12.ttl#approval_1',
      leaseOwner: 'client:cli',
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(result.status).toBe('lost')
    expect(db.updates).toEqual([])
  })

  it('renews an expired or same-owner lease', async () => {
    const db = createDb(approval({
      status: 'handling',
      leaseOwner: 'client:web',
      leaseExpiresAt: new Date('2026-06-11T23:59:00.000Z'),
    }))

    const result = await claimApprovalRequest(db, {
      approval: 'https://pod.example/.data/approvals/2026/06/12.ttl#approval_1',
      leaseOwner: 'client:cli',
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(result.status).toBe('claimed')
    expect(db.updates[0]).toMatchObject({
      status: 'handling',
      leaseOwner: 'client:cli',
    })
  })

  it('keeps resolved approvals display-only for claim purposes', async () => {
    const db = createDb(approval({ status: 'approved' }))

    const result = await claimApprovalRequest(db, {
      approval: 'https://pod.example/.data/approvals/2026/06/12.ttl#approval_1',
      leaseOwner: 'client:cli',
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(result.status).toBe('not_actionable')
    expect(db.updates).toEqual([])
  })

  it('treats only pending and handling as actionable statuses', () => {
    expect(isApprovalStatusClaimable(undefined)).toBe(true)
    expect(isApprovalStatusClaimable('pending')).toBe(true)
    expect(isApprovalStatusClaimable('handling')).toBe(true)
    expect(isApprovalStatusClaimable('approved')).toBe(false)
    expect(isApprovalStatusClaimable('rejected')).toBe(false)
  })
})
