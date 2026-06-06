import { uri, boolean, object, podTable, string, timestamp, id } from '@undefineds.co/drizzle-solid'
import { UDFS, DCTerms, SIOC } from './namespaces'
import { chatResource } from './chat.schema'
import { taskResource } from './task.schema'

export type ThreadStatusType = 'active' | 'locked' | 'closed'

export const ThreadStatus = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  CLOSED: 'closed',
} as const

/**
 * Thread resource.
 *
 * Product semantics:
 * - Thread is the concrete conversation or execution timeline/place under a
 *   Chat or Task.
 * - AI product runtime sessions map to Thread when they represent a concrete
 *   conversation timeline/place/run.
 * - Thread carries workspace/place relations and runtime metadata. Chat only
 *   identifies the counterpart/conversation object.
 * - Product/runtime-specific ids should stay in metadata as `runtimeSessionId`,
 *   `runtime`, etc. Do not name the generic thread id `piSessionId`.
 *
 * Storage structure (aligned with xpod):
 * - Thread stored as fragment in Chat's index.ttl
 * - Location: /.data/chat/{chat|id}/index.ttl#{id}
 *
 * NOTE:
 * - `thread.workspace` is a storage-layer reference (URI) to a container/resource in CSS/Pod.
 * - It is NOT the same thing as the runtime create API payload `workspace: { path, copy }`.
 * - Runtime path/copy is an execution-time interface shape; persistence should keep the
 *   container URI here and store portable metadata with that container/resource.
 */
export const threadResource = podTable(
  'thread',
  {
    id: id('id').default('chat/{chat.id[0]}/index.ttl#{key}'),

    // Belongs to chat/counterpart. Stored as an RDF URI; short ids are resolved via chatResource's URI template by the ORM.
    chat: uri('chat').predicate(SIOC.has_parent).link(chatResource),

    // Optional work item this timeline is executing or discussing.
    task: uri('task').predicate(UDFS.task).link(taskResource),

    // Display / state
    title: string('title').predicate(DCTerms.title),
    status: string('status').predicate(UDFS.status).notNull().default(ThreadStatus.ACTIVE),
    starred: boolean('starred').predicate(UDFS.favorite).default(false),

    // Storage-layer execution context reference: container/resource URI
    workspace: uri('workspace').predicate(UDFS.workspace),

    // Opaque protocol/local/UI metadata only. Shared relations must be explicit URI fields.
    metadata: object('metadata').predicate(UDFS.metadata),


    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: SIOC.Thread,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `threadResource`.
export const threadTable = threadResource

export type ThreadRow = typeof threadResource.$inferSelect
export type ThreadInsert = typeof threadResource.$inferInsert
export type ThreadUpdate = typeof threadResource.$inferUpdate
