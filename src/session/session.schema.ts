import { extractPodResourceTemplateValue, object, podTable, string, timestamp, uri, id, integer } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from '../namespaces'
import { chatResource } from '../chat.schema'
import { threadResource } from '../thread.schema'
import { asPodResourceTemplateTarget } from '../repository'

export type SessionStatus = 'active' | 'paused' | 'completed' | 'error' | 'archived'

export function buildRuntimeSessionIri(sessionId: string): string {
  return `urn:linx:runtime-session:${sessionId}`
}

export function extractRuntimeSessionId(sessionRef: string | null | undefined): string | null {
  if (!sessionRef) return null
  const runtimeMatch = sessionRef.match(/^urn:linx:runtime-session:(.+)$/)
  if (runtimeMatch?.[1]) return runtimeMatch[1]
  return extractSessionIdFromSessionRef(sessionRef)
}

export function extractSessionIdFromSessionRef(sessionRef: string | null | undefined): string | null {
  if (!sessionRef) return null

  const templateId = extractPodResourceTemplateValue(asPodResourceTemplateTarget(sessionResource), sessionRef, 'key')
  if (templateId) return templateId

  const legacyFragmentMatch = sessionRef.match(/\.ttl#([^/?#]+)$/)
  if (legacyFragmentMatch?.[1]) {
    return decodeURIComponent(legacyFragmentMatch[1])
  }

  const documentMatch = sessionRef.match(/\/([^/?#]+)\.ttl(?:$|[?#])/)
  if (documentMatch?.[1]) {
    return decodeURIComponent(documentMatch[1])
  }

  return null
}

/**
 * Runtime / collaboration session resource.
 *
 * This preserves generic AI product runtime/session lifecycle state.
 * It is intentionally separate from:
 * - UI-only local state (focus, draft text, scroll position, expand/collapse)
 * - transient transport/session-manager internals
 * - the durable conversation timeline, which is Thread
 *
 * Storage structure:
 * - Location: /.data/sessions/{yyyy}/{MM}/{dd}/{id}.ttl
 * - Primary use: runtime lifecycle projection for a concrete Thread
 *
 * Contract notes:
 * - Chat identifies the counterpart/conversation object.
 * - Thread identifies the concrete conversation timeline/place/run. AI product
 *   runtime sessions map to Thread; this Session resource records lifecycle state
 *   and points to that Thread.
 * - Conversation topology such as direct/group is not a Session field. It is
 *   derived from the Chat/Thread surface, participants, or product policy. Legacy
 *   `udfs:conversationType` data should be treated as deprecated compatibility
 *   metadata, not written by new code.
 * - `archived` is a persistence-layer/session-lifecycle status; interactive runtime
 *   surfaces may continue to use the narrower active/paused/completed/error subset
 *   until they explicitly adopt archival semantics.
 * - `tool` is intentionally open-string in this baseline so the durable resource does not
 *   prematurely overfit to today's sidecar enum before all writers are aligned.
 */
export const sessionResource = podTable(
  'session',
  {
    id: id('id').default('{yyyy}/{MM}/{dd}/{key}.ttl'),

    owner: uri('owner').predicate(UDFS.actor).notNull(),
    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),

    status: string('status').predicate(UDFS.sessionStatus).notNull().default('active'),
    tool: string('tool').predicate(UDFS.sessionTool),
    tokenUsage: integer('tokenUsage').predicate(UDFS.tokenUsage).default(0),
    messages: uri('messages').predicate(UDFS.message).array(),

    policy: uri('policy').predicate(UDFS.policy),
    policyVersion: string('policyVersion').predicate(UDFS.policyVersion),

    // Opaque protocol/local/UI metadata only. Shared relations must be explicit URI fields.
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
    archivedAt: timestamp('archivedAt').predicate(UDFS.archivedAt),
  },
  {
    base: '/.data/sessions/',
    sparqlEndpoint: '/.data/sessions/-/sparql',
    type: UDFS.term('Session'),
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `sessionResource`.
export const sessionTable = sessionResource

export type SessionRow = typeof sessionResource.$inferSelect
export type SessionInsert = typeof sessionResource.$inferInsert
export type SessionUpdate = typeof sessionResource.$inferUpdate
