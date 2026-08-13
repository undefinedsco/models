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
  ocrEnabled: boolean('ocrEnabled').predicate(UDFS.ocrEnabled).default(true),
  automaticOcr: boolean('automaticOcr').predicate(UDFS.automaticOcr).default(true),
  imageRecognition: boolean('imageRecognition').predicate(UDFS.imageRecognition).default(true),
  pdfRecognition: boolean('pdfRecognition').predicate(UDFS.pdfRecognition).default(true),
  tableRecognition: boolean('tableRecognition').predicate(UDFS.tableRecognition).default(false),
  processingMode: string('processingMode').predicate(UDFS.processingMode).default('auto'),
  readerPolicy: string('readerPolicy').predicate(UDFS.readerPolicy).default('auto'),
  readerPriority: string('readerPriority').predicate(UDFS.readerPriority).default('structure-first'),
  maxFileSizeMb: integer('maxFileSizeMb').predicate(UDFS.maxFileSizeMb).default(64),
  maxPages: integer('maxPages').predicate(UDFS.maxPages).default(500),
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
