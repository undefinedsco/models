import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { threadResource } from './thread.schema'
import { taskResourceId } from './resource-id-defaults'

export type TaskStatusType = 'open' | 'ready' | 'active' | 'blocked' | 'completed' | 'failed' | 'cancelled'

export const TaskStatus = {
  OPEN: 'open',
  READY: 'ready',
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

/**
 * Task resource.
 *
 * Task is the durable executable work unit. It says what should be done; it
 * does not own scheduling, runner selection, runtime prompt projection, or one
 * concrete execution attempt.
 */
export const taskResource = podTable(
  'task',
  {
    id: id('id').default(taskResourceId),

    title: string('title').predicate(DCTerms.title),
    instruction: text('instruction').predicate(UDFS.instruction).notNull(),
    prompt: text('prompt').predicate(UDFS.prompt),

    issue: uri('issue').predicate(UDFS.issue).link('issue'),
    message: uri('message').predicate(UDFS.message),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    workspace: uri('workspace').predicate(UDFS.workspace).notNull(),

    status: string('status').predicate(UDFS.status).notNull().default(TaskStatus.OPEN),
    priority: string('priority').predicate(UDFS.priority),
    assignedTo: uri('assignedTo').predicate(UDFS.assignedTo),
    source: uri('source').predicate(UDFS.source),
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
