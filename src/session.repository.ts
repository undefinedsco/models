import { definePodRepository } from './repository'
import {
  sessionResource,
  type SessionRow,
  type SessionInsert,
  type SessionUpdate,
} from './session'

export const sessionRepository = definePodRepository<
  typeof sessionResource,
  SessionRow,
  SessionInsert,
  SessionUpdate
>({
  namespace: 'session',
  resource: sessionResource,
  searchableFields: ['chat', 'thread', 'status', 'tool'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
})
