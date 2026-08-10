import { boolean, id, podTable, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, SCHEMA, UDFS } from './namespaces'

function stableProjectKey(value: string): string {
  let hash = 2166136261
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (hash >>> 0).toString(36)
}

export function chatProjectContextResourceId(workspace: string): string {
  return `${stableProjectKey(workspace)}.ttl`
}

export function chatProjectMemoryResourceId(memoryId: string): string {
  return memoryId.endsWith('.ttl') ? memoryId : `${encodeURIComponent(memoryId)}.ttl`
}

export const chatProjectContextResource = podTable('chatProjectContext', {
  id: id('id'),
  workspace: uri('workspace').predicate(UDFS.workspace).notNull(),
  instructions: text('instructions').predicate(UDFS.systemMessage),
  memoryEnabled: boolean('memoryEnabled').predicate(UDFS.memoryEnabled).notNull().default(true),
  createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
}, {
  base: '/.data/chat-projects/',
  sparqlEndpoint: '/.data/chat-projects/-/sparql',
  type: UDFS.ChatProjectContext,
  namespace: UDFS,
})

export const chatProjectMemoryResource = podTable('chatProjectMemory', {
  id: id('id').default((key: string | undefined) => key ? chatProjectMemoryResourceId(key) : ''),
  workspace: uri('workspace').predicate(UDFS.workspace).notNull(),
  text: text('text').predicate(SCHEMA.text).notNull(),
  sourceMessage: uri('sourceMessage').predicate(UDFS.sourceMessage),
  createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
}, {
  base: '/.data/chat-project-memories/',
  sparqlEndpoint: '/.data/chat-project-memories/-/sparql',
  type: UDFS.ProjectMemory,
  namespace: UDFS,
})

export type ChatProjectContextRow = typeof chatProjectContextResource.$inferSelect
export type ChatProjectContextInsert = typeof chatProjectContextResource.$inferInsert
export type ChatProjectContextUpdate = typeof chatProjectContextResource.$inferUpdate
export type ChatProjectMemoryRow = typeof chatProjectMemoryResource.$inferSelect
export type ChatProjectMemoryInsert = typeof chatProjectMemoryResource.$inferInsert
export type ChatProjectMemoryUpdate = typeof chatProjectMemoryResource.$inferUpdate
