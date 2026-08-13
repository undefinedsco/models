import { UDFS } from './namespaces'

/** Adapter-facing modality names. Durable model capability values use URIs below. */
export const AI_MODEL_MODALITIES = ['text', 'image', 'audio', 'video', 'pdf'] as const
export type AIModelModality = (typeof AI_MODEL_MODALITIES)[number]

/** Adapter-facing capability names accepted at discovery/import boundaries. */
export const AI_MODEL_CAPABILITIES = [
  'chat',
  'embedding',
  'reranking',
  'tool_call',
  'reasoning',
  'web',
  'vision',
  'ocr',
  'document_understanding',
  'structured_output',
  'indexing',
  'image_generation',
  'speech_recognition',
  'speech_synthesis',
  'video_generation',
] as const
export type AIModelCapability = (typeof AI_MODEL_CAPABILITIES)[number]

/** Canonical RDF resources persisted in `AIModel.hasCapability`. */
export const AI_MODEL_CAPABILITY = {
  chat: UDFS.ChatCapability,
  embedding: UDFS.EmbeddingCapability,
  reranking: UDFS.RerankingCapability,
  tool_call: UDFS.ToolCallCapability,
  reasoning: UDFS.ReasoningCapability,
  web: UDFS.WebCapability,
  vision: UDFS.VisionCapability,
  ocr: UDFS.OCRCapability,
  document_understanding: UDFS.DocumentUnderstandingCapability,
  structured_output: UDFS.StructuredOutputCapability,
  indexing: UDFS.IndexingCapability,
  image_generation: UDFS.ImageGenerationCapability,
  speech_recognition: UDFS.SpeechRecognitionCapability,
  speech_synthesis: UDFS.SpeechSynthesisCapability,
  video_generation: UDFS.VideoGenerationCapability,
} as const satisfies Record<AIModelCapability, string>

export type AIModelCapabilityUri = (typeof AI_MODEL_CAPABILITY)[AIModelCapability]

export const AI_MODEL_CLASS = {
  chat: UDFS.ChatModel,
  embedding: UDFS.EmbeddingModel,
  document_understanding: UDFS.DocumentUnderstandingModel,
  reranking: UDFS.RerankingModel,
  image_generation: UDFS.ImageGenerationModel,
  speech_recognition: UDFS.SpeechRecognitionModel,
  speech_synthesis: UDFS.SpeechSynthesisModel,
  video_generation: UDFS.VideoGenerationModel,
} as const

export type AIModelClass = keyof typeof AI_MODEL_CLASS
export type AIModelClassUri = (typeof AI_MODEL_CLASS)[AIModelClass]

const modelClassAliases: Readonly<Record<string, AIModelClass>> = {
  chat: 'chat',
  language: 'chat',
  embedding: 'embedding',
  embeddings: 'embedding',
  document_understanding: 'document_understanding',
  rerank: 'reranking',
  reranker: 'reranking',
  reranking: 'reranking',
  image: 'image_generation',
  image_generation: 'image_generation',
  transcription: 'speech_recognition',
  speech_recognition: 'speech_recognition',
  text_to_speech: 'speech_synthesis',
  speech_synthesis: 'speech_synthesis',
  video: 'video_generation',
  video_generation: 'video_generation',
}

export const AI_MODEL_CLASS_DEFAULT_CAPABILITY: Readonly<Record<AIModelClassUri, AIModelCapabilityUri>> = {
  [AI_MODEL_CLASS.chat]: AI_MODEL_CAPABILITY.chat,
  [AI_MODEL_CLASS.embedding]: AI_MODEL_CAPABILITY.embedding,
  [AI_MODEL_CLASS.document_understanding]: AI_MODEL_CAPABILITY.document_understanding,
  [AI_MODEL_CLASS.reranking]: AI_MODEL_CAPABILITY.reranking,
  [AI_MODEL_CLASS.image_generation]: AI_MODEL_CAPABILITY.image_generation,
  [AI_MODEL_CLASS.speech_recognition]: AI_MODEL_CAPABILITY.speech_recognition,
  [AI_MODEL_CLASS.speech_synthesis]: AI_MODEL_CAPABILITY.speech_synthesis,
  [AI_MODEL_CLASS.video_generation]: AI_MODEL_CAPABILITY.video_generation,
}

export const AI_MODEL_WORKLOAD_REQUIREMENT = {
  chatModel: AI_MODEL_CAPABILITY.chat,
  ocrModel: AI_MODEL_CAPABILITY.ocr,
  readerModel: AI_MODEL_CAPABILITY.document_understanding,
  embeddingModel: AI_MODEL_CAPABILITY.embedding,
  indexerModel: AI_MODEL_CAPABILITY.indexing,
  rerankerModel: AI_MODEL_CAPABILITY.reranking,
} as const

export type AIModelWorkload = keyof typeof AI_MODEL_WORKLOAD_REQUIREMENT

const modalitySet: ReadonlySet<string> = new Set(AI_MODEL_MODALITIES)
const capabilitySet: ReadonlySet<string> = new Set(AI_MODEL_CAPABILITIES)
const capabilityUriSet: ReadonlySet<string> = new Set(Object.values(AI_MODEL_CAPABILITY))
const capabilityNameByUri = new Map<string, AIModelCapability>(
  Object.entries(AI_MODEL_CAPABILITY).map(([name, uri]) => [uri, name as AIModelCapability]),
)
const classNameByUri = new Map<string, AIModelClass>(
  Object.entries(AI_MODEL_CLASS).map(([name, uri]) => [uri, name as AIModelClass]),
)
const legacyCapabilityAliases: Readonly<Record<string, AIModelCapability>> = {
  function_calling: 'tool_call',
  function_call: 'tool_call',
  rerank: 'reranking',
  document: 'document_understanding',
  'document-parse': 'document_understanding',
}

export function toAIModelClassUri(value: unknown): AIModelClassUri | undefined {
  if (value === undefined || value === null) return AI_MODEL_CLASS.chat
  if (typeof value === 'string' && (Object.values(AI_MODEL_CLASS) as string[]).includes(value)) {
    return value as AIModelClassUri
  }
  const normalized = typeof value === 'string' ? modelClassAliases[value.trim().toLowerCase()] : undefined
  return normalized ? AI_MODEL_CLASS[normalized] : undefined
}

export function isAIModelModality(value: unknown): value is AIModelModality {
  return typeof value === 'string' && modalitySet.has(value)
}

export function isAIModelCapability(value: unknown): value is AIModelCapability {
  return typeof value === 'string' && capabilitySet.has(value)
}

export function isAIModelCapabilityUri(value: unknown): value is AIModelCapabilityUri {
  return typeof value === 'string' && capabilityUriSet.has(value)
}

export function toAIModelCapabilityUri(value: unknown): AIModelCapabilityUri | undefined {
  if (isAIModelCapabilityUri(value)) return value
  if (typeof value !== 'string') return undefined
  const normalized = legacyCapabilityAliases[value] ?? value
  return isAIModelCapability(normalized) ? AI_MODEL_CAPABILITY[normalized] : undefined
}

/** Project a persisted capability URI to the stable adapter-facing name. */
export function toAIModelCapabilityName(value: unknown): AIModelCapability | undefined {
  return typeof value === 'string' ? capabilityNameByUri.get(value) : undefined
}

/** Project RDF type URI(s) to the legacy adapter-facing model class name. */
export function toAIModelClassName(value: unknown): AIModelClass {
  const values = Array.isArray(value) ? value : [value]
  for (const entry of values) {
    if (typeof entry !== 'string') continue
    const name = classNameByUri.get(entry)
    if (name) return name
  }
  return 'chat'
}

export function filterAIModelModalities(value: unknown): AIModelModality[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isAIModelModality))]
}

export function filterAIModelCapabilities(value: unknown): AIModelCapability[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isAIModelCapability))]
}

export function filterAIModelCapabilityUris(value: unknown): AIModelCapabilityUri[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(toAIModelCapabilityUri).filter((entry): entry is AIModelCapabilityUri => Boolean(entry)))]
}

export function isAIModelEligibleForWorkload(
  model: { rdfType?: unknown; capabilities?: unknown },
  workload: AIModelWorkload,
): boolean {
  return withAIModelClassDefaultCapabilities(model).capabilities.includes(AI_MODEL_WORKLOAD_REQUIREMENT[workload])
}

export function selectAIModelForWorkload<T extends {
  id?: string | null
  '@id'?: string | null
  status?: string | null
  rdfType?: unknown
  capabilities?: unknown
}>(input: {
  config: Partial<Record<AIModelWorkload, string | null | undefined>>
  models: T[]
  workload: AIModelWorkload
}): T | undefined {
  const selectedUri = input.config[input.workload]
  if (!selectedUri) return undefined

  const model = input.models.find((candidate) =>
    (candidate.id ?? candidate['@id']) === selectedUri)
  if (!model || model.status === 'inactive') return undefined

  return isAIModelEligibleForWorkload(model, input.workload) ? model : undefined
}

export function withAIModelClassDefaultCapabilities<T extends {
  rdfType?: unknown
  capabilities?: unknown
}>(model: T): T & { capabilities: AIModelCapabilityUri[] } {
  const rdfTypes = Array.isArray(model.rdfType) ? model.rdfType : [model.rdfType]
  const capabilities = filterAIModelCapabilityUris(model.capabilities)
  for (const rdfType of rdfTypes) {
    if (typeof rdfType !== 'string') continue
    const value = AI_MODEL_CLASS_DEFAULT_CAPABILITY[
      rdfType as AIModelClassUri
    ]
    if (value) capabilities.push(value)
  }
  return { ...model, capabilities: [...new Set(capabilities)] }
}
