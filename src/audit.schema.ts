import { extractPodResourceTemplateValue, podTable, renderDefaultIdTemplate, uri, string, timestamp, id } from '@undefineds.co/drizzle-solid'
import { UDFS, DCTerms } from './namespaces'
import { chatResource } from './chat.schema'
import { threadResource } from './thread.schema'
import { asPodResourceTemplateTarget } from './repository'

export function buildAuditResourceId(auditId: string, createdAt: Date | string | number = new Date()): string {
  return renderDefaultIdTemplate('{yyyy}/{MM}/{dd}.ttl#{key}', {
    key: encodeURIComponent(auditId),
    row: { createdAt },
  })
}

export function buildAuditPodResourcePath(auditId: string, createdAt: Date | string | number = new Date()): string {
  return `/.data/audits/${buildAuditResourceId(auditId, createdAt)}`
}

/** @deprecated Use buildAuditPodResourcePath for Pod-root paths or buildAuditResourceId for resource-base ids. */
export const buildAuditSubjectPath = buildAuditPodResourcePath

// Append-only audit entry resource (separate from Solid inbox notifications).
// Audit entries are independent events; session/chat/thread are optional relations,
// not storage ownership boundaries.
export const auditResource = podTable(
  'audit',
  {
    id: id('id'),

    // Audit action
    action: string('action').predicate(UDFS.action).notNull(),

    // Actor identity (WebID semantics)
    actor: uri('actor').predicate(UDFS.actor).notNull(),
    actorRole: string('actorRole').predicate(UDFS.actorRole).notNull(),
    onBehalfOf: uri('onBehalfOf').predicate(UDFS.onBehalfOf),

    // Relations
    session: uri('session').predicate(UDFS.session),
    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    entry: uri('entry').predicate(UDFS.entry),
    toolCallId: string('toolCallId').predicate(UDFS.toolCallId),
    toolName: string('toolName').predicate(UDFS.toolName),
    approval: uri('approval').predicate(UDFS.approval),

    // Policy metadata
    policy: uri('policy').predicate(UDFS.policy),
    policyVersion: string('policyVersion').predicate(UDFS.policyVersion),

    // Timestamps
    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  },
  {
    base: '/.data/audits/',
    sparqlEndpoint: '/.data/audits/-/sparql',
    type: UDFS.AuditEntry,
    namespace: UDFS,
    subjectTemplate: '{yyyy}/{MM}/{dd}.ttl#{id}',
  },
)

export function extractAuditIdFromAuditRef(auditRef: string | null | undefined): string | null {
  if (auditRef && !/[/:#]/.test(auditRef)) {
    return auditRef
  }
  return extractPodResourceTemplateValue(asPodResourceTemplateTarget(auditResource), auditRef)
}

// Compatibility alias. New model code should prefer `auditResource`.
export const auditTable = auditResource

export type AuditRow = typeof auditResource.$inferSelect
export type AuditInsert = typeof auditResource.$inferInsert
export type AuditUpdate = typeof auditResource.$inferUpdate
