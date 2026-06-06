import { uri, boolean, object, podTable, string, timestamp, id, renderDefaultIdTemplate } from '@undefineds.co/drizzle-solid'
import { UDFS, DCTerms, SIOC } from './namespaces'
import { chatResource } from './chat.schema'
import { taskResource } from './task.schema'
import { resourceKey } from './resource-id-defaults'

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
 * - Thread is the implicit concrete timeline/place under exactly one surface:
 *   Chat for conversation timelines, or Task for task execution timelines.
 * - AI product runtime sessions map to Thread when they represent a concrete
 *   conversation timeline/place/run.
 * - Thread carries workspace/place relations and runtime metadata. Chat only
 *   identifies the counterpart/conversation object.
 * - Product/runtime-specific ids should stay in metadata as `runtimeSessionId`,
 *   `runtime`, etc. Do not name the generic thread id `piSessionId`.
 *
 * Storage structure (aligned with xpod):
 * - Chat thread location: /.data/chat/{chat|id}/index.ttl#{id}
 * - Task thread location: /.data/task/{task|id}/index.ttl#{id}
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
    id: id('id').default((key: string | undefined, row?: Record<string, unknown>) => (
      renderDefaultIdTemplate(
        row?.task
          ? 'task/{task.key}/index.ttl#{key}'
          : 'chat/{chat.key}/index.ttl#{key}',
        {
          key: resourceKey(key, 'thread'),
          row,
          links: {
            chat: chatResource,
            task: taskResource,
          },
        },
      )
    )),

    // Owner surface for conversation timelines. Do not set together with `task`.
    chat: uri('chat').predicate(SIOC.has_parent).link(chatResource),

    // Owner surface for task execution timelines. Do not set together with `chat`.
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
