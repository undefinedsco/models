import { boolean, id, integer, podTable, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { agentResource } from './agent.schema'
import { aiModelResource } from './ai-model.schema'
import { UDFS } from './namespaces'
import { taskResource } from './task.schema'

export const aiConfigResource = podTable('aiConfig', {
  id: id('id').default('config.ttl#{key}'),
  chatModel: uri('chatModel').predicate(UDFS.chatModel).link(aiModelResource),
  ocrModel: uri('ocrModel').predicate(UDFS.ocrModel).link(aiModelResource),
  readerModel: uri('readerModel').predicate(UDFS.readerModel).link(aiModelResource),
  embeddingModel: uri('embeddingModel').predicate(UDFS.embeddingModel).link(aiModelResource),
  indexerModel: uri('indexerModel').predicate(UDFS.indexerModel).link(aiModelResource),
  rerankerModel: uri('rerankerModel').predicate(UDFS.rerankerModel).link(aiModelResource),
  ftsEnabled: boolean('ftsEnabled').predicate(UDFS.ftsEnabled).default(true),
  vectorEnabled: boolean('vectorEnabled').predicate(UDFS.vectorEnabled).default(false),
  progressiveIndexingEnabled: boolean('progressiveIndexingEnabled').predicate(UDFS.progressiveIndexingEnabled).default(true),
  automaticIndexing: boolean('automaticIndexing').predicate(UDFS.automaticIndexing).default(true),
  textBackend: string('textBackend').predicate(UDFS.textBackend).default('auto'),
  vectorBackend: string('vectorBackend').predicate(UDFS.vectorBackend).default('auto'),
  previousModel: uri('previousModel').predicate(UDFS.previousModel).link(aiModelResource),
  migrationStatus: string('migrationStatus').predicate(UDFS.migrationStatus),
  migrationProgress: integer('migrationProgress').predicate(UDFS.migrationProgress),
  updatedAt: timestamp('updatedAt').predicate(UDFS.updatedAt),
}, {
  base: '/settings/ai/',
  sparqlEndpoint: '/settings/ai/-/sparql',
  type: UDFS.AIConfig,
  namespace: UDFS,
})

export const vectorStoreResource = podTable('vectorStore', {
  id: id('id').default('vector-stores.ttl#{key}'),
  name: string('name').predicate(UDFS.name),
  container: uri('container').predicate(UDFS.container),
  chunkingStrategy: string('chunkingStrategy').predicate(UDFS.chunkingStrategy),
  status: string('status').predicate(UDFS.status),
  createdAt: timestamp('createdAt').predicate(UDFS.createdAt),
  lastActiveAt: timestamp('lastActiveAt').predicate(UDFS.lastActiveAt),
}, {
  base: '/settings/ai/',
  sparqlEndpoint: '/settings/ai/-/sparql',
  type: UDFS.VectorStore,
  namespace: UDFS,
})

export const indexedFileResource = podTable('indexedFile', {
  id: id('id').default('indexed-files.ttl#{key}'),
  fileUrl: uri('fileUrl').predicate(UDFS.fileUrl),
  vectorId: integer('vectorId').predicate(UDFS.vectorId),
  chunkingStrategy: string('chunkingStrategy').predicate(UDFS.chunkingStrategy),
  status: string('status').predicate(UDFS.status),
  usageBytes: integer('usageBytes').predicate(UDFS.usageBytes),
  lastError: string('lastError').predicate(UDFS.lastError),
  indexedAt: timestamp('indexedAt').predicate(UDFS.indexedAt),
}, {
  base: '/settings/ai/',
  sparqlEndpoint: '/settings/ai/-/sparql',
  type: UDFS.IndexedFile,
  namespace: UDFS,
})

export const agentStatusResource = podTable('agentStatus', {
  id: id('id').default('agent-status.ttl#{key}'),
  agent: uri('agent').predicate(UDFS.agent).link(agentResource),
  status: string('status').predicate(UDFS.status),
  startedAt: timestamp('startedAt').predicate(UDFS.startedAt),
  lastActivityAt: timestamp('lastActivityAt').predicate(UDFS.lastActivityAt),
  currentTask: uri('currentTask').predicate(UDFS.task).link(taskResource),
  errorMessage: string('errorMessage').predicate(UDFS.errorMessage),
}, {
  base: '/settings/ai/',
  sparqlEndpoint: '/settings/ai/-/sparql',
  type: UDFS.AgentStatus,
  namespace: UDFS,
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
