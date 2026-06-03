import { definePodRepository } from './repository'
import { chatResource, type ChatRow, type ChatInsert, type ChatUpdate } from './chat.schema'

export const chatRepository = definePodRepository<
  typeof chatResource,
  ChatRow,
  ChatInsert,
  ChatUpdate
>({
  namespace: 'chat',
  resource: chatResource,
  searchableFields: ['title', 'description'],
  defaultSort: { field: 'lastActiveAt', direction: 'desc' },
})
