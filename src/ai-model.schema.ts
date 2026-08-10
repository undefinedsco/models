import { id, integer, real, solidSchema, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { aiProviderResource } from './ai-provider.schema'
import { RDF, UDFS } from './namespaces'

const MODEL_STORAGE = {
  base: '/settings/providers/',
  sparqlEndpoint: '/settings/providers/-/sparql',
} as const

export const aiModelSchema = solidSchema({
  id: id('id').default('{isProvidedBy.doc}#{key}'),
  rdfType: uri('rdfType').array().predicate(RDF.type).notNull().default([UDFS.AIModel]),
  displayName: string('displayName').predicate(UDFS.displayName),
  isProvidedBy: uri('isProvidedBy').predicate(UDFS.isProvidedBy).link(aiProviderResource),
  inputModalities: text('inputModalities').array().predicate(UDFS.inputModality),
  outputModalities: text('outputModalities').array().predicate(UDFS.outputModality),
  /** Adapter/runtime endpoint support; kept separate from semantic model capabilities. */
  runtimeCapabilities: string('runtimeCapabilities').array().predicate(UDFS.capabilities),
  capabilities: uri('capabilities').array().predicate(UDFS.hasCapability),
  pricingInput: real('pricingInput').predicate(UDFS.pricingInput),
  pricingOutput: real('pricingOutput').predicate(UDFS.pricingOutput),
  status: string('status').predicate(UDFS.status).default('active'),
  createdAt: timestamp('createdAt').predicate(UDFS.createdAt).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').predicate(UDFS.updatedAt).notNull().defaultNow(),
}, {
  type: UDFS.AIModel,
  subClassOf: UDFS.Model,
  namespace: UDFS,
})

export const chatModelSchema = aiModelSchema.extend({
  contextLength: integer('contextLength').predicate(UDFS.contextLength),
  maxOutputTokens: integer('maxOutputTokens').predicate(UDFS.maxOutputTokens),
}, {
  type: UDFS.ChatModel,
  namespace: UDFS,
})

export const embeddingModelSchema = aiModelSchema.extend({
  dimension: integer('dimension').predicate(UDFS.dimension),
}, {
  type: UDFS.EmbeddingModel,
  namespace: UDFS,
})

export const documentUnderstandingModelSchema = aiModelSchema.extend({}, {
  type: UDFS.DocumentUnderstandingModel,
  namespace: UDFS,
})

export const rerankingModelSchema = aiModelSchema.extend({}, {
  type: UDFS.RerankingModel,
  namespace: UDFS,
})

export const imageGenerationModelSchema = aiModelSchema.extend({}, {
  type: UDFS.ImageGenerationModel,
  namespace: UDFS,
})

export const speechRecognitionModelSchema = aiModelSchema.extend({}, {
  type: UDFS.SpeechRecognitionModel,
  namespace: UDFS,
})

export const speechSynthesisModelSchema = aiModelSchema.extend({}, {
  type: UDFS.SpeechSynthesisModel,
  namespace: UDFS,
})

export const videoGenerationModelSchema = aiModelSchema.extend({}, {
  type: UDFS.VideoGenerationModel,
  namespace: UDFS,
})

export const aiModelResource = aiModelSchema.table('aiModel', MODEL_STORAGE)
export const chatModelResource = chatModelSchema.table('chatModel', MODEL_STORAGE)
export const embeddingModelResource = embeddingModelSchema.table('embeddingModel', MODEL_STORAGE)
export const documentUnderstandingModelResource = documentUnderstandingModelSchema.table('documentUnderstandingModel', MODEL_STORAGE)
export const rerankingModelResource = rerankingModelSchema.table('rerankingModel', MODEL_STORAGE)
export const imageGenerationModelResource = imageGenerationModelSchema.table('imageGenerationModel', MODEL_STORAGE)
export const speechRecognitionModelResource = speechRecognitionModelSchema.table('speechRecognitionModel', MODEL_STORAGE)
export const speechSynthesisModelResource = speechSynthesisModelSchema.table('speechSynthesisModel', MODEL_STORAGE)
export const videoGenerationModelResource = videoGenerationModelSchema.table('videoGenerationModel', MODEL_STORAGE)

// Compatibility alias. New model code should prefer `aiModelResource`.
export const aiModelTable = aiModelResource

export type AIModelRow = typeof aiModelResource.$inferSelect
export type AIModelInsert = typeof aiModelResource.$inferInsert
export type AIModelUpdate = typeof aiModelResource.$inferUpdate
export type ChatModelRow = typeof chatModelResource.$inferSelect
export type ChatModelInsert = typeof chatModelResource.$inferInsert
export type ChatModelUpdate = typeof chatModelResource.$inferUpdate
export type EmbeddingModelRow = typeof embeddingModelResource.$inferSelect
export type EmbeddingModelInsert = typeof embeddingModelResource.$inferInsert
export type EmbeddingModelUpdate = typeof embeddingModelResource.$inferUpdate
export type DocumentUnderstandingModelRow = typeof documentUnderstandingModelResource.$inferSelect
export type DocumentUnderstandingModelInsert = typeof documentUnderstandingModelResource.$inferInsert
export type DocumentUnderstandingModelUpdate = typeof documentUnderstandingModelResource.$inferUpdate
export type RerankingModelRow = typeof rerankingModelResource.$inferSelect
export type RerankingModelInsert = typeof rerankingModelResource.$inferInsert
export type RerankingModelUpdate = typeof rerankingModelResource.$inferUpdate
export type ImageGenerationModelRow = typeof imageGenerationModelResource.$inferSelect
export type ImageGenerationModelInsert = typeof imageGenerationModelResource.$inferInsert
export type ImageGenerationModelUpdate = typeof imageGenerationModelResource.$inferUpdate
export type SpeechRecognitionModelRow = typeof speechRecognitionModelResource.$inferSelect
export type SpeechRecognitionModelInsert = typeof speechRecognitionModelResource.$inferInsert
export type SpeechRecognitionModelUpdate = typeof speechRecognitionModelResource.$inferUpdate
export type SpeechSynthesisModelRow = typeof speechSynthesisModelResource.$inferSelect
export type SpeechSynthesisModelInsert = typeof speechSynthesisModelResource.$inferInsert
export type SpeechSynthesisModelUpdate = typeof speechSynthesisModelResource.$inferUpdate
export type VideoGenerationModelRow = typeof videoGenerationModelResource.$inferSelect
export type VideoGenerationModelInsert = typeof videoGenerationModelResource.$inferInsert
export type VideoGenerationModelUpdate = typeof videoGenerationModelResource.$inferUpdate
