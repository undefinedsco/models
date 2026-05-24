import { id, integer, object, podTable, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { taskResource } from './task.schema'

export type ScheduleStatusType = 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type ScheduleKindType = 'once' | 'interval' | 'cron'

export const ScheduleStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export const ScheduleKind = {
  ONCE: 'once',
  INTERVAL: 'interval',
  CRON: 'cron',
} as const

/**
 * Schedule resource.
 *
 * Schedule owns time-based triggering for a Task. It intentionally does not
 * select a runner or record a concrete execution attempt; those belong to Run.
 *
 * The id template is intentionally left unset. Callers must provide an exact
 * base-relative id until the durable storage path is designed.
 */
export const scheduleResource = podTable(
  'schedule',
  {
    id: id('id'),

    task: uri('task').predicate(UDFS.task).notNull().link(taskResource),
    status: string('status').predicate(UDFS.status).notNull().default(ScheduleStatus.ACTIVE),
    scheduleKind: string('scheduleKind').predicate(UDFS.scheduleKind).notNull().default(ScheduleKind.ONCE),

    cron: string('cron').predicate(UDFS.cron),
    intervalSeconds: integer('intervalSeconds').predicate(UDFS.intervalSeconds),
    timezone: string('timezone').predicate(UDFS.timezone),
    startsAt: timestamp('startsAt').predicate(UDFS.startsAt),
    nextRunAt: timestamp('nextRunAt').predicate(UDFS.nextRunAt),
    lastRunAt: timestamp('lastRunAt').predicate(UDFS.lastRunAt),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.Schedule,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `scheduleResource`.
export const scheduleTable = scheduleResource

export type ScheduleRow = typeof scheduleResource.$inferSelect
export type ScheduleInsert = typeof scheduleResource.$inferInsert
export type ScheduleUpdate = typeof scheduleResource.$inferUpdate
