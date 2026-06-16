import { describe, expect, it } from 'vitest'
import {
  CaptureCandidateStatus,
  CaptureDecision,
  captureCandidateResource,
  captureEventResource,
  hasCaptureForSource,
  listCaptureEventsBySource,
  DCTerms,
  SCHEMA,
  UDFS,
  type CaptureEventRow,
} from '../src'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
}

function resourceConfigOf(resource: unknown): { namespace?: unknown } {
  return ((resource as any)?._?.config ?? (resource as any)?.config) as { namespace?: unknown }
}

function predicateOf(resource: unknown, field: string): string {
  const column = columnsOf(resource)[field] as { getPredicate?: (namespace?: unknown) => string }
  return column.getPredicate?.(resourceConfigOf(resource).namespace) ?? ''
}

function createEventDb(rows: CaptureEventRow[]) {
  return {
    select() {
      return {
        from(resource: unknown) {
          expect(resource).toBe(captureEventResource)
          return {
            async execute() {
              return rows
            },
          }
        },
      }
    },
  }
}

function captureEvent(overrides: Partial<CaptureEventRow> = {}): CaptureEventRow {
  return {
    id: 'events/2026/06/16.ttl#event_1',
    source: 'https://pod.example/.data/chat/default/2026/06/16/messages.ttl#msg_1',
    captureCandidate: null,
    targetResource: null,
    decision: CaptureDecision.CANDIDATE_CREATED,
    suggestedType: null,
    suggestedTarget: null,
    confidence: 'medium',
    reason: null,
    userCorrection: null,
    approval: null,
    inputRequest: null,
    chat: null,
    thread: null,
    task: null,
    run: null,
    actor: null,
    about: null,
    metadata: null,
    createdAt: new Date('2026-06-16T00:00:00.000Z'),
    ...overrides,
  } as CaptureEventRow
}

describe('capture resources', () => {
  it('models capture candidates as temporary suggestions', () => {
    expect(captureCandidateResource.config.type).toBe(UDFS.CaptureCandidate)
    expect(captureCandidateResource.config.base).toBe('/.data/capture/')
    expect(captureCandidateResource.hasCustomTemplate()).toBe(false)
    expect(predicateOf(captureCandidateResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(captureCandidateResource, 'summary')).toBe(DCTerms.abstract)
    expect(predicateOf(captureCandidateResource, 'suggestedType')).toBe(UDFS.suggestedType)
    expect(predicateOf(captureCandidateResource, 'suggestedTarget')).toBe(UDFS.suggestedTarget)
    expect(predicateOf(captureCandidateResource, 'confidence')).toBe(UDFS.confidence)
    expect(predicateOf(captureCandidateResource, 'status')).toBe(UDFS.status)
    expect(CaptureCandidateStatus.CANDIDATE).toBe('candidate')
  })

  it('models capture events as an append-only decision ledger', () => {
    expect(captureEventResource.config.type).toBe(UDFS.CaptureEvent)
    expect(captureEventResource.config.base).toBe('/.data/capture/')
    expect(captureEventResource.hasCustomTemplate()).toBe(false)
    expect(predicateOf(captureEventResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(captureEventResource, 'targetResource')).toBe(UDFS.targetResource)
    expect(predicateOf(captureEventResource, 'decision')).toBe(UDFS.captureDecision)
    expect(predicateOf(captureEventResource, 'approval')).toBe(UDFS.approval)
    expect(predicateOf(captureEventResource, 'inputRequest')).toBe(UDFS.inputRequest)
    expect(predicateOf(captureEventResource, 'about')).toBe(SCHEMA.about)
    expect(CaptureDecision.OPTIMISTIC_COMMIT).toBe('optimistic_commit')
  })

  it('detects previous captures for the same source without treating ignored events as duplicates', async () => {
    const source = 'https://pod.example/.data/chat/default/2026/06/16/messages.ttl#msg_1'
    const db = createEventDb([
      captureEvent({ id: 'events/2026/06/16.ttl#ignored', source, decision: CaptureDecision.IGNORED }),
      captureEvent({ id: 'events/2026/06/16.ttl#candidate', source, decision: CaptureDecision.CANDIDATE_CREATED }),
      captureEvent({ id: 'events/2026/06/16.ttl#other', source: 'https://pod.example/other#msg', decision: CaptureDecision.DIRECT_COMMIT }),
    ])

    await expect(listCaptureEventsBySource(db, source)).resolves.toHaveLength(2)
    await expect(hasCaptureForSource(db, { source })).resolves.toBe(true)
    await expect(hasCaptureForSource(db, {
      source,
      decisions: [CaptureDecision.DIRECT_COMMIT],
    })).resolves.toBe(false)
  })

  it('can scope duplicate detection to a target resource', async () => {
    const source = 'https://pod.example/.data/chat/default/2026/06/16/messages.ttl#msg_1'
    const targetResource = 'https://pod.example/.data/ideas/2026/06/16.ttl#idea_1'
    const db = createEventDb([
      captureEvent({ source, targetResource, decision: CaptureDecision.DIRECT_COMMIT }),
    ])

    await expect(hasCaptureForSource(db, { source, targetResource })).resolves.toBe(true)
    await expect(hasCaptureForSource(db, {
      source,
      targetResource: 'https://pod.example/.data/ideas/2026/06/16.ttl#idea_2',
    })).resolves.toBe(false)
  })
})
