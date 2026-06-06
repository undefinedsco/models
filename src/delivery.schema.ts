import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { AS, DCTerms, UDFS } from './namespaces'
import { chatResource } from './chat.schema'
import { threadResource } from './thread.schema'
import { taskResource } from './task.schema'

export type DeliveryStatusType = 'pending' | 'dispatched' | 'consumed' | 'completed' | 'failed' | 'cancelled'
export type DeliveryKindType =
  | 'task_dispatch'
  | 'runtime_intent'
  | 'runtime_followup'
  | 'steer'
  | 'approval_request'
  | 'input_request'
  | 'delegated_response'
  | 'report'
  | 'mention_dispatch'

export const DeliveryStatus = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  CONSUMED: 'consumed',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export const DeliveryKind = {
  TASK_DISPATCH: 'task_dispatch',
  RUNTIME_INTENT: 'runtime_intent',
  RUNTIME_FOLLOWUP: 'runtime_followup',
  STEER: 'steer',
  APPROVAL_REQUEST: 'approval_request',
  INPUT_REQUEST: 'input_request',
  DELEGATED_RESPONSE: 'delegated_response',
  REPORT: 'report',
  MENTION_DISPATCH: 'mention_dispatch',
} as const

/**
 * Delivery resource.
 *
 * Delivery is an internal handoff envelope between Threads, Sessions, Agents,
 * and runtimes. It is not an Inbox item; user-visible attention can be
 * projected from a Delivery into Inbox/Approval only when needed.
 */
export const deliveryResource = podTable(
  'delivery',
  {
    id: id('id').default('{thread.dir}/{yyyy}/{MM}/{dd}/deliveries.ttl#{key}'),

    kind: string('kind').predicate(UDFS.deliveryKind).notNull().default(DeliveryKind.TASK_DISPATCH),
    status: string('status').predicate(UDFS.status).notNull().default(DeliveryStatus.PENDING),

    task: uri('task').predicate(UDFS.task).link(taskResource),
    source: uri('source').predicate(DCTerms.source),
    target: uri('target').predicate(AS.target),
    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).notNull().link(threadResource),
    targetThread: uri('targetThread').predicate(UDFS.targetThread).link(threadResource),
    targetSession: uri('targetSession').predicate(UDFS.targetSession),

    actor: uri('actor').predicate(AS.actor),
    object: uri('object').predicate(AS.object),

    objective: text('objective').predicate(UDFS.objective),
    payload: object('payload').predicate(UDFS.payload),
    projection: object('projection').predicate(UDFS.projection),
    projectedRole: string('projectedRole').predicate(UDFS.projectedRole),
    // Opaque protocol/local/UI metadata only. Shared relations must be explicit URI fields.
    metadata: object('metadata').predicate(UDFS.metadata),
    error: text('error').predicate(UDFS.error),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    dispatchedAt: timestamp('dispatchedAt').predicate(UDFS.startedAt),
    consumedAt: timestamp('consumedAt').predicate(UDFS.consumedAt),
    completedAt: timestamp('completedAt').predicate(UDFS.completedAt),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.Delivery,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `deliveryResource`.
export const deliveryTable = deliveryResource

export type DeliveryRow = typeof deliveryResource.$inferSelect
export type DeliveryInsert = typeof deliveryResource.$inferInsert
export type DeliveryUpdate = typeof deliveryResource.$inferUpdate
