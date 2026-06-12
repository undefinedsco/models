import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { chatResource } from './chat.schema'
import { runResource } from './run.schema'
import { taskResource } from './task.schema'
import { threadResource } from './thread.schema'

export type InputRequestStatusType = 'pending' | 'handling' | 'resolved' | 'expired' | 'cancelled'

export const InputRequestStatus = {
  PENDING: 'pending',
  HANDLING: 'handling',
  RESOLVED: 'resolved',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export function extractInputRequestIdFromInputRequestRef(inputRequestRef: string | null | undefined): string | null {
  if (!inputRequestRef) {
    return null
  }
  if (!/[/:#]/.test(inputRequestRef)) {
    return inputRequestRef
  }
  const hash = inputRequestRef.split('#').pop()
  if (hash) {
    return hash
  }
  return inputRequestRef.split('/').filter(Boolean).pop() ?? null
}

/**
 * Input request resource.
 *
 * InputRequest is an information gate: a runtime or worker is waiting for
 * additional input, a choice, or disambiguation. ApprovalRequest remains the
 * authority gate for allow/deny decisions.
 */
export const inputRequestResource = podTable(
  'input_request',
  {
    id: id('id').default('{yyyy}/{MM}/{dd}.ttl#{key}'),

    // Relations
    session: uri('session').predicate(UDFS.session).notNull(),
    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    run: uri('run').predicate(UDFS.run).link(runResource),
    task: uri('task').predicate(UDFS.task).link(taskResource),
    requester: uri('requester').predicate(UDFS.requester),

    // Request details
    requestKind: string('requestKind').predicate(UDFS.requestKind).notNull().default('user-input'),
    prompt: text('prompt').predicate(UDFS.prompt).notNull(),
    context: text('context').predicate(UDFS.context),
    inputOptions: text('inputOptions').predicate(UDFS.inputOptions),

    // Lifecycle / claim lease
    status: string('status').predicate(UDFS.status).notNull().default(InputRequestStatus.PENDING),
    leaseOwner: string('leaseOwner').predicate(UDFS.leaseOwner),
    leaseExpiresAt: timestamp('leaseExpiresAt').predicate(UDFS.leaseExpiresAt),
    assignedTo: uri('assignedTo').predicate(UDFS.assignedTo),

    // Resolution
    response: text('response').predicate(UDFS.response),
    answeredBy: uri('answeredBy').predicate(UDFS.answeredBy),
    onBehalfOf: uri('onBehalfOf').predicate(UDFS.onBehalfOf),
    reason: text('reason').predicate(UDFS.reason),
    metadata: object('metadata').predicate(UDFS.metadata),

    // Timestamps
    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    expiresAt: timestamp('expiresAt').predicate(UDFS.expiresAt),
    resolvedAt: timestamp('resolvedAt').predicate(UDFS.resolvedAt),
  },
  {
    base: '/.data/input-requests/',
    sparqlEndpoint: '/.data/input-requests/-/sparql',
    type: UDFS.InputRequest,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `inputRequestResource`.
export const inputRequestTable = inputRequestResource

export type InputRequestRow = typeof inputRequestResource.$inferSelect
export type InputRequestInsert = typeof inputRequestResource.$inferInsert
export type InputRequestUpdate = typeof inputRequestResource.$inferUpdate
