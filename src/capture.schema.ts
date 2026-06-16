import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, SCHEMA, UDFS } from './namespaces'
import { approvalResource } from './approval.schema'
import { chatResource } from './chat.schema'
import { inputRequestResource } from './input-request.schema'
import { runResource } from './run.schema'
import { taskResource } from './task.schema'
import { threadResource } from './thread.schema'

export type CaptureConfidenceType = 'high' | 'medium' | 'low'

export type CaptureCandidateStatusType =
  | 'candidate'
  | 'promoted'
  | 'rejected'
  | 'duplicate'
  | 'ignored'
  | 'superseded'

export const CaptureCandidateStatus = {
  CANDIDATE: 'candidate',
  PROMOTED: 'promoted',
  REJECTED: 'rejected',
  DUPLICATE: 'duplicate',
  IGNORED: 'ignored',
  SUPERSEDED: 'superseded',
} as const

export type CaptureDecisionType =
  | 'direct_commit'
  | 'optimistic_commit'
  | 'candidate_created'
  | 'promoted'
  | 'rejected'
  | 'corrected'
  | 'rollback'
  | 'duplicate'
  | 'ignored'

export const CaptureDecision = {
  DIRECT_COMMIT: 'direct_commit',
  OPTIMISTIC_COMMIT: 'optimistic_commit',
  CANDIDATE_CREATED: 'candidate_created',
  PROMOTED: 'promoted',
  REJECTED: 'rejected',
  CORRECTED: 'corrected',
  ROLLBACK: 'rollback',
  DUPLICATE: 'duplicate',
  IGNORED: 'ignored',
} as const

/**
 * CaptureCandidate is a temporary, reviewable suggestion. It is not formal
 * memory. Long source bodies stay in their original Pod file/resource; this
 * record stores queryable classification metadata.
 */
export const captureCandidateResource = podTable(
  'capture_candidate',
  {
    id: id('id').default('candidates/{yyyy}/{MM}/{dd}.ttl#{key}'),

    source: uri('source').predicate(DCTerms.source).notNull(),
    summary: text('summary').predicate(DCTerms.abstract).notNull(),
    suggestedType: uri('suggestedType').predicate(UDFS.suggestedType),
    suggestedTarget: uri('suggestedTarget').predicate(UDFS.suggestedTarget),
    confidence: string('confidence').predicate(UDFS.confidence).notNull().default('medium'),
    reason: text('reason').predicate(UDFS.reason),
    status: string('status').predicate(UDFS.status).notNull().default(CaptureCandidateStatus.CANDIDATE),
    sourceHash: string('sourceHash').predicate(UDFS.sourceHash),

    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    task: uri('task').predicate(UDFS.task).link(taskResource),
    run: uri('run').predicate(UDFS.run).link(runResource),
    actor: uri('actor').predicate(DCTerms.creator),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/capture/',
    sparqlEndpoint: '/.data/capture/-/sparql',
    type: UDFS.CaptureCandidate,
    namespace: UDFS,
  },
)

/**
 * CaptureEvent is an append-only ledger of capture decisions, corrections, and
 * rollbacks. ApprovalRequest/InputRequest own authority and missing-information
 * state; this record explains what capture did and why.
 */
export const captureEventResource = podTable(
  'capture_event',
  {
    id: id('id').default('events/{yyyy}/{MM}/{dd}.ttl#{key}'),

    source: uri('source').predicate(DCTerms.source).notNull(),
    captureCandidate: uri('captureCandidate').predicate(UDFS.captureCandidate).link(captureCandidateResource),
    targetResource: uri('targetResource').predicate(UDFS.targetResource),
    decision: string('decision').predicate(UDFS.captureDecision).notNull(),
    suggestedType: uri('suggestedType').predicate(UDFS.suggestedType),
    suggestedTarget: uri('suggestedTarget').predicate(UDFS.suggestedTarget),
    confidence: string('confidence').predicate(UDFS.confidence),
    reason: text('reason').predicate(UDFS.reason),
    userCorrection: text('userCorrection').predicate(UDFS.userCorrection),

    approval: uri('approval').predicate(UDFS.approval).link(approvalResource),
    inputRequest: uri('inputRequest').predicate(UDFS.inputRequest).link(inputRequestResource),
    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    task: uri('task').predicate(UDFS.task).link(taskResource),
    run: uri('run').predicate(UDFS.run).link(runResource),
    actor: uri('actor').predicate(DCTerms.creator),
    about: uri('about').predicate(SCHEMA.about),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  },
  {
    base: '/.data/capture/',
    sparqlEndpoint: '/.data/capture/-/sparql',
    type: UDFS.CaptureEvent,
    namespace: UDFS,
  },
)

export type CaptureCandidateRow = typeof captureCandidateResource.$inferSelect
export type CaptureCandidateInsert = typeof captureCandidateResource.$inferInsert
export type CaptureCandidateUpdate = typeof captureCandidateResource.$inferUpdate

export type CaptureEventRow = typeof captureEventResource.$inferSelect
export type CaptureEventInsert = typeof captureEventResource.$inferInsert
export type CaptureEventUpdate = typeof captureEventResource.$inferUpdate
