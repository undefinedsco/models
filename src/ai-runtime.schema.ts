import { id, integer, podTable, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { aiModelResource } from './ai-model.schema'
import { XPOD_AI } from './namespaces'

export const aiConfigResource = podTable('aiConfig', {
  id: id('id'),
  embeddingModel: uri('embeddingModel').predicate(XPOD_AI.embeddingModel).link(aiModelResource),
  previousModel: uri('previousModel').predicate(XPOD_AI.previousModel).link(aiModelResource),
  migrationStatus: string('migrationStatus').predicate(XPOD_AI.migrationStatus),
  migrationProgress: integer('migrationProgress').predicate(XPOD_AI.migrationProgress),
  updatedAt: timestamp('updatedAt').predicate(XPOD_AI.updatedAt),
}, {
  base: '/settings/ai/config.ttl',
  type: XPOD_AI.AIConfig,
  namespace: XPOD_AI,
  subjectTemplate: '#{id}',
})

export const vectorStoreResource = podTable('vectorStore', {
  id: id('id'),
  name: string('name').predicate(XPOD_AI.name),
  container: uri('container').predicate(XPOD_AI.container),
  chunkingStrategy: string('chunkingStrategy').predicate(XPOD_AI.chunkingStrategy),
  status: string('status').predicate(XPOD_AI.status),
  createdAt: timestamp('createdAt').predicate(XPOD_AI.createdAt),
  lastActiveAt: timestamp('lastActiveAt').predicate(XPOD_AI.lastActiveAt),
}, {
  base: '/settings/ai/vector-stores.ttl',
  type: XPOD_AI.VectorStore,
  namespace: XPOD_AI,
  subjectTemplate: '#{id}',
})

export const indexedFileResource = podTable('indexedFile', {
  id: id('id'),
  fileUrl: uri('fileUrl').predicate(XPOD_AI.fileUrl),
  vectorId: integer('vectorId').predicate(XPOD_AI.vectorId),
  chunkingStrategy: string('chunkingStrategy').predicate(XPOD_AI.chunkingStrategy),
  status: string('status').predicate(XPOD_AI.status),
  usageBytes: integer('usageBytes').predicate(XPOD_AI.usageBytes),
  lastError: string('lastError').predicate(XPOD_AI.lastError),
  indexedAt: timestamp('indexedAt').predicate(XPOD_AI.indexedAt),
}, {
  base: '/settings/ai/indexed-files.ttl',
  type: XPOD_AI.IndexedFile,
  namespace: XPOD_AI,
  subjectTemplate: '#{id}',
})

export const agentStatusResource = podTable('agentStatus', {
  id: id('id'),
  agentId: string('agentId').predicate(XPOD_AI.agentId),
  status: string('status').predicate(XPOD_AI.status),
  startedAt: timestamp('startedAt').predicate(XPOD_AI.startedAt),
  lastActivityAt: timestamp('lastActivityAt').predicate(XPOD_AI.lastActivityAt),
  currentTaskId: string('currentTaskId').predicate(XPOD_AI.currentTaskId),
  errorMessage: string('errorMessage').predicate(XPOD_AI.errorMessage),
}, {
  base: '/settings/ai/agent-status.ttl',
  type: XPOD_AI.AgentStatus,
  namespace: XPOD_AI,
  subjectTemplate: '#{id}',
})

// Compatibility aliases. New model code should prefer `*Resource`.
export const aiConfigTable = aiConfigResource
export const vectorStoreTable = vectorStoreResource
export const indexedFileTable = indexedFileResource
export const agentStatusTable = agentStatusResource

export type AIConfigRow = typeof aiConfigResource.$inferSelect
export type AIConfigInsert = typeof aiConfigResource.$inferInsert
export type AIConfigUpdate = typeof aiConfigResource.$inferUpdate

export type VectorStoreRow = typeof vectorStoreResource.$inferSelect
export type VectorStoreInsert = typeof vectorStoreResource.$inferInsert
export type VectorStoreUpdate = typeof vectorStoreResource.$inferUpdate

export type IndexedFileRow = typeof indexedFileResource.$inferSelect
export type IndexedFileInsert = typeof indexedFileResource.$inferInsert
export type IndexedFileUpdate = typeof indexedFileResource.$inferUpdate

export type AgentStatusRow = typeof agentStatusResource.$inferSelect
export type AgentStatusInsert = typeof agentStatusResource.$inferInsert
export type AgentStatusUpdate = typeof agentStatusResource.$inferUpdate
