import { definePodRepository } from './repository'
import { threadResource, type ThreadRow, type ThreadInsert, type ThreadUpdate } from './thread.schema'

export const threadRepository = definePodRepository<
  typeof threadResource,
  ThreadRow,
  ThreadInsert,
  ThreadUpdate
>({
  namespace: 'thread',
  table: threadResource,
  searchableFields: ['title'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
})
