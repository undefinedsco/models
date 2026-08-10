import { eq } from '@undefineds.co/drizzle-solid'
import { definePodRepository } from './repository'
import {
  conversationShareResource,
  type ConversationShareInsert,
  type ConversationShareRow,
  type ConversationShareUpdate,
} from './conversation-share.schema'

export interface ConversationShareWhere extends Record<string, unknown> {
  thread?: string
}

export const conversationShareRepository = definePodRepository<
  typeof conversationShareResource,
  ConversationShareRow,
  ConversationShareInsert,
  ConversationShareUpdate,
  ConversationShareWhere
>({
  namespace: 'conversation-share',
  resource: conversationShareResource,
  defaultSort: { field: 'createdAt', direction: 'desc' },
  filter: ({ filters }) => filters?.thread
    ? eq(conversationShareResource.thread, filters.thread)
    : undefined,
})
