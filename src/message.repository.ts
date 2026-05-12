import { definePodRepository } from './repository'
import { messageResource, type MessageRow, type MessageInsert, type MessageUpdate } from './message.schema'

export const messageRepository = definePodRepository<
  typeof messageResource,
  MessageRow,
  MessageInsert,
  MessageUpdate
>({
  namespace: 'message',
  table: messageResource,
  searchableFields: ['content'],
  defaultSort: { field: 'createdAt', direction: 'asc' },
})
