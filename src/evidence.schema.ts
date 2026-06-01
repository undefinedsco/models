import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { deliveryResource } from './delivery.schema'
import { issueResource } from './issue.schema'
import { runResource } from './run.schema'
import { taskResource } from './task.schema'
import { threadResource } from './thread.schema'
import { evidenceResourceId } from './resource-id-defaults'

export type EvidenceKindType =
  | 'test'
  | 'runtime_log'
  | 'diff'
  | 'artifact'
  | 'pod_projection'
  | 'user_validation'
  | 'review_finding'
  | 'migration_note'
  | 'manual_observation'

export const EvidenceKind = {
  TEST: 'test',
  RUNTIME_LOG: 'runtime_log',
  DIFF: 'diff',
  ARTIFACT: 'artifact',
  POD_PROJECTION: 'pod_projection',
  USER_VALIDATION: 'user_validation',
  REVIEW_FINDING: 'review_finding',
  MIGRATION_NOTE: 'migration_note',
  MANUAL_OBSERVATION: 'manual_observation',
} as const

/**
 * Evidence resource.
 *
 * Evidence is append-only proof or finding. It points to the work/control object
 * it supports and to concrete artifacts such as tests, logs, diffs, reports, or
 * Pod projections. It is not a status owner by itself.
 */
export const evidenceResource = podTable(
  'evidence',
  {
    id: id('id').default(evidenceResourceId),

    evidenceKind: string('evidenceKind').predicate(UDFS.evidenceKind).notNull(),
    subject: uri('subject').predicate(UDFS.subject).notNull(),

    issue: uri('issue').predicate(UDFS.issue).link(issueResource),
    task: uri('task').predicate(UDFS.task).link(taskResource),
    delivery: uri('delivery').predicate(UDFS.delivery).link(deliveryResource),
    run: uri('run').predicate(UDFS.run).link(runResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),

    title: string('title').predicate(DCTerms.title),
    summary: text('summary').predicate(UDFS.summary),
    body: text('body').predicate(UDFS.body),
    artifact: uri('artifact').predicate(UDFS.artifact),
    source: uri('source').predicate(UDFS.source),
    actor: uri('actor').predicate(UDFS.actor),
    outcome: string('outcome').predicate(UDFS.outcome),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.Evidence,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `evidenceResource`.
export const evidenceTable = evidenceResource

export type EvidenceRow = typeof evidenceResource.$inferSelect
export type EvidenceInsert = typeof evidenceResource.$inferInsert
export type EvidenceUpdate = typeof evidenceResource.$inferUpdate
