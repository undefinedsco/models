import { id, integer, object, podTable, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { threadResource } from './thread.schema'
import { taskResourceId } from './resource-id-defaults'

export type TaskStatusType = 'active' | 'paused' | 'completed' | 'failed'
export type TaskTriggerKindType = 'once' | 'interval' | 'cron' | 'event'

export const TaskStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const TaskTriggerKind = {
  ONCE: 'once',
  INTERVAL: 'interval',
  CRON: 'cron',
  EVENT: 'event',
} as const

/**
 * Task resource.
 *
 * Task is a durable task-style command, parallel to Chat as a command surface.
 * It is intentionally generic: protocol-specific request, response, and event
 * shapes stay in adapter code.
 */
export const taskResource = podTable(
  'task',
  {
    id: id('id').default(taskResourceId),
    surfaceId: string('surfaceId').predicate(UDFS.surfaceId).notNull().default('default'),

    title: string('title').predicate(DCTerms.title),
    prompt: string('prompt').predicate(UDFS.prompt).notNull(),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    workspace: uri('workspace').predicate(UDFS.workspace).notNull(),
    runner: string('runner').predicate(UDFS.runner).notNull(),

    status: string('status').predicate(UDFS.status).notNull().default(TaskStatus.ACTIVE),
    triggerKind: string('triggerKind').predicate(UDFS.triggerKind).notNull().default(TaskTriggerKind.ONCE),
    cron: string('cron').predicate(UDFS.cron),
    intervalSeconds: integer('intervalSeconds').predicate(UDFS.intervalSeconds),
    eventName: string('eventName').predicate(UDFS.eventName),
    nextRunAt: timestamp('nextRunAt').predicate(UDFS.nextRunAt),
    lastRunAt: timestamp('lastRunAt').predicate(UDFS.lastRunAt),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/task/',
    sparqlEndpoint: '/.data/task/-/sparql',
    type: UDFS.Task,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `taskResource`.
export const taskTable = taskResource

export type TaskRow = typeof taskResource.$inferSelect
export type TaskInsert = typeof taskResource.$inferInsert
export type TaskUpdate = typeof taskResource.$inferUpdate
