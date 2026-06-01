import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { deliveryResource } from './delivery.schema'
import { evidenceResource } from './evidence.schema'
import { issueResource } from './issue.schema'
import { runResource } from './run.schema'
import { taskResource } from './task.schema'
import { threadResource } from './thread.schema'
import { reportResourceId } from './resource-id-defaults'

export type ReportKindType = 'closure' | 'review' | 'status' | 'handoff' | 'quality'
export type ReportStatusType = 'draft' | 'published' | 'accepted' | 'rejected' | 'superseded'
export type ReportOutcomeType =
  | 'accepted'
  | 'rejected'
  | 'reopened'
  | 'partial_release'
  | 'deferred'
  | 'blocked'
  | 'change_requested'

export const ReportKind = {
  CLOSURE: 'closure',
  REVIEW: 'review',
  STATUS: 'status',
  HANDOFF: 'handoff',
  QUALITY: 'quality',
} as const

export const ReportStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  SUPERSEDED: 'superseded',
} as const

export const ReportOutcome = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  REOPENED: 'reopened',
  PARTIAL_RELEASE: 'partial_release',
  DEFERRED: 'deferred',
  BLOCKED: 'blocked',
  CHANGE_REQUESTED: 'change_requested',
} as const

/**
 * Report resource.
 *
 * Report is the authoritative closure, review, handoff, status, or quality
 * summary for a control object. It summarizes Evidence and metric facts but
 * does not replace the underlying Issue, Task, Delivery, Run, or Evidence.
 */
export const reportResource = podTable(
  'report',
  {
    id: id('id').default(reportResourceId),

    reportKind: string('reportKind').predicate(UDFS.reportKind).notNull(),
    status: string('status').predicate(UDFS.status).notNull().default(ReportStatus.DRAFT),
    outcome: string('outcome').predicate(UDFS.outcome),
    subject: uri('subject').predicate(UDFS.subject).notNull(),

    issue: uri('issue').predicate(UDFS.issue).link(issueResource),
    task: uri('task').predicate(UDFS.task).link(taskResource),
    delivery: uri('delivery').predicate(UDFS.delivery).link(deliveryResource),
    run: uri('run').predicate(UDFS.run).link(runResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    evidence: uri('evidence').predicate(UDFS.evidence).array().link(evidenceResource),

    title: string('title').predicate(DCTerms.title),
    summary: text('summary').predicate(UDFS.summary).notNull(),
    body: text('body').predicate(UDFS.body),
    reviewer: uri('reviewer').predicate(UDFS.reviewer),
    actor: uri('actor').predicate(UDFS.actor),
    source: uri('source').predicate(UDFS.source),
    metricFacts: object('metricFacts').predicate(UDFS.metricFacts),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    publishedAt: timestamp('publishedAt').predicate(UDFS.publishedAt),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.Report,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `reportResource`.
export const reportTable = reportResource

export type ReportRow = typeof reportResource.$inferSelect
export type ReportInsert = typeof reportResource.$inferInsert
export type ReportUpdate = typeof reportResource.$inferUpdate
