import { definePodRepository } from './repository'
import { and, eq, type QueryCondition } from '@undefineds.co/drizzle-solid'
import {
  messageResource,
  type MessageRow,
  type MessageInsert,
  type MessageUpdate,
  type MessageRoleType,
  type MessageStatusType,
} from './message.schema'

export interface MessageListWhere extends Record<string, unknown> {
  scope?: string | null
  chat?: string | null
  thread?: string | null
  maker?: string | null
  role?: MessageRoleType | string | null
  status?: MessageStatusType | string | null
  toolName?: string | null
  toolCallId?: string | null
  coordinationId?: string | null
  search?: string
}

const exactFilterColumns = {
  scope: messageResource.scope,
  chat: messageResource.chat,
  thread: messageResource.thread,
  maker: messageResource.maker,
  role: messageResource.role,
  status: messageResource.status,
  toolName: messageResource.toolName,
  toolCallId: messageResource.toolCallId,
  coordinationId: messageResource.coordinationId,
} as const

function exactFilter<Field extends keyof typeof exactFilterColumns>(
  field: Field,
  value: MessageListWhere[Field],
): QueryCondition | undefined {
  return value === undefined ? undefined : eq(exactFilterColumns[field], value)
}

function messageListFilter(where?: MessageListWhere): QueryCondition | undefined {
  if (!where) return undefined

  const filters = [
    exactFilter('scope', where.scope),
    exactFilter('chat', where.chat),
    exactFilter('thread', where.thread),
    exactFilter('maker', where.maker),
    exactFilter('role', where.role),
    exactFilter('status', where.status),
    exactFilter('toolName', where.toolName),
    exactFilter('toolCallId', where.toolCallId),
    exactFilter('coordinationId', where.coordinationId),
  ].filter((filter): filter is QueryCondition => Boolean(filter))

  if (filters.length === 0) return undefined
  return filters.length === 1 ? filters[0] : and(...filters)
}

export const messageRepository = definePodRepository<
  typeof messageResource,
  MessageRow,
  MessageInsert,
  MessageUpdate,
  MessageListWhere
>({
  namespace: 'message',
  resource: messageResource,
  searchableFields: ['content'],
  defaultSort: { field: 'createdAt', direction: 'asc' },
  filter: ({ filters }) => messageListFilter(filters),
})
