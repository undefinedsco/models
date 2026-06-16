import { and, eq, type QueryCondition } from '@undefineds.co/drizzle-solid'
import { definePodRepository } from './repository'
import {
  captureCandidateResource,
  captureEventResource,
  type CaptureCandidateInsert,
  type CaptureCandidateRow,
  type CaptureCandidateUpdate,
  type CaptureDecisionType,
  type CaptureEventInsert,
  type CaptureEventRow,
  type CaptureEventUpdate,
} from './capture.schema'

export interface CaptureCandidateListWhere extends Record<string, unknown> {
  source?: string | null
  suggestedType?: string | null
  suggestedTarget?: string | null
  status?: string | null
  chat?: string | null
  thread?: string | null
  task?: string | null
  run?: string | null
}

export interface CaptureEventListWhere extends Record<string, unknown> {
  source?: string | null
  captureCandidate?: string | null
  targetResource?: string | null
  decision?: CaptureDecisionType | string | null
  approval?: string | null
  inputRequest?: string | null
  chat?: string | null
  thread?: string | null
  task?: string | null
  run?: string | null
}

const candidateExactFilterColumns = {
  source: captureCandidateResource.source,
  suggestedType: captureCandidateResource.suggestedType,
  suggestedTarget: captureCandidateResource.suggestedTarget,
  status: captureCandidateResource.status,
  chat: captureCandidateResource.chat,
  thread: captureCandidateResource.thread,
  task: captureCandidateResource.task,
  run: captureCandidateResource.run,
} as const

const eventExactFilterColumns = {
  source: captureEventResource.source,
  captureCandidate: captureEventResource.captureCandidate,
  targetResource: captureEventResource.targetResource,
  decision: captureEventResource.decision,
  approval: captureEventResource.approval,
  inputRequest: captureEventResource.inputRequest,
  chat: captureEventResource.chat,
  thread: captureEventResource.thread,
  task: captureEventResource.task,
  run: captureEventResource.run,
} as const

function exactFilter<
  TColumns extends Record<string, unknown>,
  TFilters extends Record<string, unknown>,
  TField extends keyof TColumns & keyof TFilters,
>(
  columns: TColumns,
  field: TField,
  value: TFilters[TField],
): QueryCondition | undefined {
  return value === undefined ? undefined : eq(columns[field] as never, value)
}

function combineFilters(filters: Array<QueryCondition | undefined>): QueryCondition | undefined {
  const present = filters.filter((filter): filter is QueryCondition => Boolean(filter))
  if (present.length === 0) return undefined
  return present.length === 1 ? present[0] : and(...present)
}

function captureCandidateListFilter(where?: CaptureCandidateListWhere): QueryCondition | undefined {
  if (!where) return undefined
  return combineFilters([
    exactFilter(candidateExactFilterColumns, 'source', where.source),
    exactFilter(candidateExactFilterColumns, 'suggestedType', where.suggestedType),
    exactFilter(candidateExactFilterColumns, 'suggestedTarget', where.suggestedTarget),
    exactFilter(candidateExactFilterColumns, 'status', where.status),
    exactFilter(candidateExactFilterColumns, 'chat', where.chat),
    exactFilter(candidateExactFilterColumns, 'thread', where.thread),
    exactFilter(candidateExactFilterColumns, 'task', where.task),
    exactFilter(candidateExactFilterColumns, 'run', where.run),
  ])
}

function captureEventListFilter(where?: CaptureEventListWhere): QueryCondition | undefined {
  if (!where) return undefined
  return combineFilters([
    exactFilter(eventExactFilterColumns, 'source', where.source),
    exactFilter(eventExactFilterColumns, 'captureCandidate', where.captureCandidate),
    exactFilter(eventExactFilterColumns, 'targetResource', where.targetResource),
    exactFilter(eventExactFilterColumns, 'decision', where.decision),
    exactFilter(eventExactFilterColumns, 'approval', where.approval),
    exactFilter(eventExactFilterColumns, 'inputRequest', where.inputRequest),
    exactFilter(eventExactFilterColumns, 'chat', where.chat),
    exactFilter(eventExactFilterColumns, 'thread', where.thread),
    exactFilter(eventExactFilterColumns, 'task', where.task),
    exactFilter(eventExactFilterColumns, 'run', where.run),
  ])
}

export const captureCandidateRepository = definePodRepository<
  typeof captureCandidateResource,
  CaptureCandidateRow,
  CaptureCandidateInsert,
  CaptureCandidateUpdate,
  CaptureCandidateListWhere
>({
  namespace: 'capture-candidate',
  resource: captureCandidateResource,
  searchableFields: ['summary', 'reason'],
  defaultSort: { field: 'createdAt', direction: 'desc' },
  filter: ({ filters }) => captureCandidateListFilter(filters),
})

export const captureEventRepository = definePodRepository<
  typeof captureEventResource,
  CaptureEventRow,
  CaptureEventInsert,
  CaptureEventUpdate,
  CaptureEventListWhere
>({
  namespace: 'capture-event',
  resource: captureEventResource,
  searchableFields: ['reason', 'userCorrection'],
  defaultSort: { field: 'createdAt', direction: 'desc' },
  filter: ({ filters }) => captureEventListFilter(filters),
})

export interface CaptureEventSourceReadDatabase {
  select(): {
    from(resource: typeof captureEventResource): {
      execute(): Promise<CaptureEventRow[]>
    }
  }
}

export interface CaptureDuplicateCheckInput {
  source: string
  targetResource?: string | null
  decisions?: Array<CaptureDecisionType | string>
}

const DEFAULT_DUPLICATE_DECISIONS = new Set<CaptureDecisionType | string>([
  'direct_commit',
  'optimistic_commit',
  'candidate_created',
  'promoted',
])

export async function listCaptureEventsBySource(
  db: CaptureEventSourceReadDatabase,
  source: string,
): Promise<CaptureEventRow[]> {
  const rows = await db.select().from(captureEventResource).execute()
  return rows.filter((row) => row.source === source)
}

export async function hasCaptureForSource(
  db: CaptureEventSourceReadDatabase,
  input: CaptureDuplicateCheckInput,
): Promise<boolean> {
  const rows = await listCaptureEventsBySource(db, input.source)
  const decisions = input.decisions ? new Set(input.decisions) : DEFAULT_DUPLICATE_DECISIONS
  return rows.some((row) => {
    if (!decisions.has(row.decision)) return false
    return input.targetResource ? row.targetResource === input.targetResource : true
  })
}
