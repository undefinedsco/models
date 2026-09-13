import { boolean, id, podTable, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, SCHEMA, UDFS } from './namespaces'

export function conversationShareResourceId(shareId: string): string {
  return shareId.endsWith('.ttl') ? shareId : `${encodeURIComponent(shareId)}.ttl`
}

export const conversationShareResource = podTable('conversationShare', {
  id: id('id').default((key: string | undefined) => key ? conversationShareResourceId(key) : ''),
  thread: uri('thread').predicate(UDFS.targetThread).notNull(),
  resourceUrl: uri('resourceUrl').predicate(SCHEMA.url).notNull(),
  includeToolDetails: boolean('includeToolDetails').predicate(UDFS.includeToolDetails).notNull().default(false),
  excludedMessageIds: string('excludedMessageIds').array().predicate(UDFS.excludedMessage),
  createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  revokedAt: timestamp('revokedAt').predicate(UDFS.revokedAt),
}, {
  base: '/.data/chat-shares/',
  sparqlEndpoint: '/.data/chat-shares/-/sparql',
  type: UDFS.ConversationShare,
  namespace: UDFS,
})

export type ConversationShareRow = typeof conversationShareResource.$inferSelect
export type ConversationShareInsert = typeof conversationShareResource.$inferInsert
export type ConversationShareUpdate = typeof conversationShareResource.$inferUpdate
