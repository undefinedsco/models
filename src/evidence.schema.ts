import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, SCHEMA, UDFS } from './namespaces'
import { deliveryResource } from './delivery.schema'
import { issueResource } from './issue.schema'
import {
  buildPersonalLinkedContextFilePath,
  type PersonalLinkedContextPathPolicy,
} from './personal-linked-context-paths'
import { runResource } from './run.schema'
import { taskResource } from './task.schema'
import { threadResource } from './thread.schema'

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
 * Evidence is append-only proof or finding metadata. Long evidence bodies
 * such as logs, patches, screenshots, transcripts, and reports are Pod files;
 * this TTL record stores the queryable meta and `source` points to the
 * evidence file when one exists. `about` points to the work/control object it
 * supports. Evidence is not a status owner by itself.
 */
export const evidenceResource = Object.assign(podTable(
  'evidence',
  {
    id: id('id').default('evidence/{yyyy}/{MM}/{dd}.ttl#{key}'),

    evidenceKind: string('evidenceKind').predicate(UDFS.evidenceKind).notNull(),
    about: uri('about').predicate(SCHEMA.about).notNull(),

    issue: uri('issue').predicate(UDFS.issue).link(issueResource),
    task: uri('task').predicate(UDFS.task).link(taskResource),
    delivery: uri('delivery').predicate(UDFS.delivery).link(deliveryResource),
    run: uri('run').predicate(UDFS.run).link(runResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),

    summary: text('summary').predicate(DCTerms.abstract),
    source: uri('source').predicate(DCTerms.source),
    actor: uri('actor').predicate(DCTerms.creator),
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
), {
  defaultSourcePath(
    row?: Record<string, unknown>,
    policy?: PersonalLinkedContextPathPolicy,
  ): string {
    return buildPersonalLinkedContextFilePath('evidence', row, policy, {
      defaultExtension: 'txt',
      titleFields: ['summary', 'evidenceKind', 'id'],
    })
  },
})

export type EvidenceRow = typeof evidenceResource.$inferSelect
export type EvidenceInsert = typeof evidenceResource.$inferInsert
export type EvidenceUpdate = typeof evidenceResource.$inferUpdate
