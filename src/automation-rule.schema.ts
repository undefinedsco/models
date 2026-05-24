import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { scheduleResource } from './schedule.schema'
import { taskResource } from './task.schema'

export type AutomationRuleStatusType = 'active' | 'paused' | 'disabled' | 'failed' | 'archived'
export type AutomationRuleKindType = 'event' | 'schedule' | 'manual'

export const AutomationRuleStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DISABLED: 'disabled',
  FAILED: 'failed',
  ARCHIVED: 'archived',
} as const

export const AutomationRuleKind = {
  EVENT: 'event',
  SCHEDULE: 'schedule',
  MANUAL: 'manual',
} as const

/**
 * AutomationRule resource.
 *
 * AutomationRule owns policy/condition/action wiring. The executable work
 * remains in Task, time-based triggering remains in Schedule, and each concrete
 * attempt remains in Run.
 *
 * The id template is intentionally left unset. Callers must provide an exact
 * base-relative id until the durable storage path is designed.
 */
export const automationRuleResource = podTable(
  'automation_rule',
  {
    id: id('id'),

    title: string('title').predicate(DCTerms.title).notNull(),
    description: text('description').predicate(DCTerms.description),
    status: string('status').predicate(UDFS.status).notNull().default(AutomationRuleStatus.ACTIVE),
    ruleKind: string('ruleKind').predicate(UDFS.ruleKind).notNull().default(AutomationRuleKind.EVENT),

    task: uri('task').predicate(UDFS.task).link(taskResource),
    schedule: uri('schedule').predicate(UDFS.schedule).link(scheduleResource),
    source: uri('source').predicate(UDFS.source),
    target: uri('target').predicate(UDFS.target),

    condition: object('condition').predicate(UDFS.condition),
    actions: object('actions').predicate(UDFS.actions),
    metadata: object('metadata').predicate(UDFS.metadata),

    lastTriggeredAt: timestamp('lastTriggeredAt').predicate(UDFS.lastTriggeredAt),
    lastRunStatus: string('lastRunStatus').predicate(UDFS.lastRunStatus),
    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.AutomationRule,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `automationRuleResource`.
export const automationRuleTable = automationRuleResource

export type AutomationRuleRow = typeof automationRuleResource.$inferSelect
export type AutomationRuleInsert = typeof automationRuleResource.$inferInsert
export type AutomationRuleUpdate = typeof automationRuleResource.$inferUpdate
