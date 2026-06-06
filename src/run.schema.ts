import { id, object, podTable, renderDefaultIdTemplate, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { deliveryResource } from './delivery.schema'
import { taskResource } from './task.schema'
import { threadResource } from './thread.schema'
import { resourceKey } from './resource-id-defaults'

export type RunStatusType =
  | 'queued'
  | 'running'
  | 'waiting_input'
  | 'waiting_runner'
  | 'completed'
  | 'failed'
  | 'cancelled'

export const RunStatus = {
  QUEUED: 'queued',
  RUNNING: 'running',
  WAITING_INPUT: 'waiting_input',
  WAITING_RUNNER: 'waiting_runner',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export const RunStepType = {
  CREATED: 'run.created',
  STARTED: 'run.started',
  TEXT_DELTA: 'runtime.text_delta',
  AUTH_REQUIRED: 'runtime.auth_required',
  TOOL_CALL: 'runtime.tool_call',
  WAITING_INPUT: 'runtime.waiting_input',
  WAITING_RUNNER: 'runtime.waiting_runner',
  CANCEL_REQUESTED: 'run.cancel_requested',
  CANCELLED: 'run.cancelled',
  ERROR: 'runtime.error',
  COMPLETED: 'run.completed',
  FAILED: 'run.failed',
  CLIENT_TOOL_OUTPUT: 'runtime.client_tool_output',
  CONTINUE_REQUESTED: 'run.continue_requested',
} as const

export type RunStepTypeValue = (typeof RunStepType)[keyof typeof RunStepType]

/**
 * Run resource.
 *
 * Run is the durable execution fact for an Agent Runtime attempt. Chat and
 * Task describe command shape; Run describes the concrete runtime execution.
 */
export const runResource = podTable(
  'run',
  {
    id: id('id').default((key: string | undefined, row?: Record<string, unknown>) => (
      renderDefaultIdTemplate(
        row?.task
          ? 'task/{task.id[-1]}/{yyyy}/{MM}/{dd}/runs.ttl#{key}'
          : row?.thread
            ? '{thread.id[0:2]}/{yyyy}/{MM}/{dd}/runs.ttl#{key}'
            : 'runs/{yyyy}/{MM}/{dd}/runs.ttl#{key}',
        {
          key: resourceKey(key, 'run'),
          row,
          links: {
            task: taskResource,
            thread: threadResource,
          },
        },
      )
    )),

    task: uri('task').predicate(UDFS.task).link(taskResource),
    delivery: uri('delivery').predicate(UDFS.delivery).link(deliveryResource),
    trigger: uri('trigger').predicate(UDFS.trigger),
    input: uri('input').predicate(UDFS.input),
    thread: uri('thread').predicate(UDFS.inThread).notNull().link(threadResource),
    workspace: uri('workspace').predicate(UDFS.workspace).notNull(),

    status: string('status').predicate(UDFS.status).notNull().default(RunStatus.QUEUED),
    runner: string('runner').predicate(UDFS.runner).notNull(),
    prompt: string('prompt').predicate(UDFS.prompt),
    externalRunId: string('externalRunId').predicate(UDFS.externalRunId),
    leaseOwner: string('leaseOwner').predicate(UDFS.leaseOwner),
    leaseExpiresAt: timestamp('leaseExpiresAt').predicate(UDFS.leaseExpiresAt),
    heartbeatAt: timestamp('heartbeatAt').predicate(UDFS.heartbeatAt),
    cancelRequestedAt: timestamp('cancelRequestedAt').predicate(UDFS.cancelRequestedAt),
    error: string('error').predicate(UDFS.error),
    // Opaque protocol/local/UI metadata only. Shared relations must be explicit URI fields.
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    startedAt: timestamp('startedAt').predicate(UDFS.startedAt),
    completedAt: timestamp('completedAt').predicate(UDFS.completedAt),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.Run,
    namespace: UDFS,
  },
)

/**
 * RunStep resource.
 *
 * Append-only execution facts emitted while a Run executes. `run` is the
 * semantic RDF relation to the Run; storage colocation is derived from that
 * relation by the id default helper.
 */
export const runStepResource = podTable(
  'run_step',
  {
    id: id('id').default('{run.id[0:5]}/runs.ttl#{key}'),
    run: uri('run').predicate(UDFS.run).notNull().link(runResource),
    stepType: string('stepType').predicate(UDFS.stepType).notNull(),
    message: string('message').predicate(DCTerms.description),
    payload: object('payload').predicate(UDFS.payload),
    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: UDFS.RunStep,
    namespace: UDFS,
  },
)

// Compatibility aliases. New model code should prefer Resource names.
export const runTable = runResource
export const runStepTable = runStepResource

export type RunRow = typeof runResource.$inferSelect
export type RunInsert = typeof runResource.$inferInsert
export type RunUpdate = typeof runResource.$inferUpdate
export type RunStepRow = typeof runStepResource.$inferSelect
export type RunStepInsert = typeof runStepResource.$inferInsert
export type RunStepUpdate = typeof runStepResource.$inferUpdate
