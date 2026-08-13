import { describe, expect, it } from 'vitest'
import { string } from '@undefineds.co/drizzle-solid'
import {
  UDFS,
  aiModelSchema,
  aiModelResource,
  chatModelSchema,
  chatModelResource,
  documentUnderstandingModelSchema,
  documentUnderstandingModelResource,
  embeddingModelSchema,
  embeddingModelResource,
  imageGenerationModelSchema,
  imageGenerationModelResource,
  rerankingModelSchema,
  rerankingModelResource,
  speechRecognitionModelSchema,
  speechRecognitionModelResource,
  speechSynthesisModelSchema,
  speechSynthesisModelResource,
  videoGenerationModelSchema,
  videoGenerationModelResource,
  type RerankingModelRow,
  type RerankingModelInsert,
  type RerankingModelUpdate,
  type ImageGenerationModelRow,
  type ImageGenerationModelInsert,
  type ImageGenerationModelUpdate,
  type SpeechRecognitionModelRow,
  type SpeechRecognitionModelInsert,
  type SpeechRecognitionModelUpdate,
  type SpeechSynthesisModelRow,
  type SpeechSynthesisModelInsert,
  type SpeechSynthesisModelUpdate,
  type VideoGenerationModelRow,
  type VideoGenerationModelInsert,
  type VideoGenerationModelUpdate,
} from '../src'

function columnNames(target: { columns: Record<string, unknown> }): string[] {
  return Object.keys(target.columns)
}

function assertModelRowShape<T extends { id: unknown; rdfType: unknown; capabilities?: unknown }>(): void {}
function assertModelWriteShape<T extends { id?: unknown; rdfType?: unknown; capabilities?: unknown }>(): void {}

describe('AI model RDF inheritance', () => {
  const subclasses = [
    ['ChatModel', chatModelSchema, chatModelResource, UDFS.ChatModel],
    ['EmbeddingModel', embeddingModelSchema, embeddingModelResource, UDFS.EmbeddingModel],
    ['DocumentUnderstandingModel', documentUnderstandingModelSchema, documentUnderstandingModelResource, UDFS.DocumentUnderstandingModel],
    ['RerankingModel', rerankingModelSchema, rerankingModelResource, UDFS.RerankingModel],
    ['ImageGenerationModel', imageGenerationModelSchema, imageGenerationModelResource, UDFS.ImageGenerationModel],
    ['SpeechRecognitionModel', speechRecognitionModelSchema, speechRecognitionModelResource, UDFS.SpeechRecognitionModel],
    ['SpeechSynthesisModel', speechSynthesisModelSchema, speechSynthesisModelResource, UDFS.SpeechSynthesisModel],
    ['VideoGenerationModel', videoGenerationModelSchema, videoGenerationModelResource, UDFS.VideoGenerationModel],
  ] as const

  it('defines AIModel as the shared parent schema', () => {
    expect(aiModelSchema.type).toBe(UDFS.AIModel)
    expect(aiModelSchema.subClassOf).toContain(UDFS.Model)
    expect(aiModelResource.getType()).toBe(UDFS.AIModel)
    expect(columnNames(aiModelSchema)).toEqual(expect.arrayContaining([
      'id',
      'displayName',
      'isProvidedBy',
      'inputModalities',
      'outputModalities',
      'capabilities',
      'pricingInput',
      'pricingOutput',
      'status',
    ]))
  })

  it.each(subclasses)('%s inherits the AIModel columns and class', (_label, schema, resource, rdfType) => {
    expect(schema.type).toBe(rdfType)
    expect(schema.subClassOf).toContain(UDFS.AIModel)
    expect(resource.getSubClassOf()).toContain(UDFS.AIModel)
    expect(resource.getType()).toBe(rdfType)
    expect(columnNames(resource)).toEqual(expect.arrayContaining([
      'id',
      'displayName',
      'isProvidedBy',
      'capabilities',
      'status',
    ]))
    expect(resource.config.base).toBe('/settings/providers/')
    expect(resource.getSparqlEndpoint()).toBe('/settings/providers/-/sparql')
  })

  it('keeps API-contract-specific fields on their subclasses', () => {
    expect(columnNames(chatModelResource)).toEqual(expect.arrayContaining(['contextLength', 'maxOutputTokens']))
    expect(columnNames(embeddingModelResource)).toContain('dimension')
    expect(columnNames(aiModelResource)).not.toContain('contextLength')
    expect(columnNames(aiModelResource)).not.toContain('maxOutputTokens')
    expect(columnNames(aiModelResource)).not.toContain('dimension')
    expect(columnNames(documentUnderstandingModelResource)).not.toContain('dimension')
  })

  it('exports row and write types for every non-parameterized model subclass', () => {
    assertModelRowShape<RerankingModelRow>()
    assertModelWriteShape<RerankingModelInsert>()
    assertModelWriteShape<RerankingModelUpdate>()
    assertModelRowShape<ImageGenerationModelRow>()
    assertModelWriteShape<ImageGenerationModelInsert>()
    assertModelWriteShape<ImageGenerationModelUpdate>()
    assertModelRowShape<SpeechRecognitionModelRow>()
    assertModelWriteShape<SpeechRecognitionModelInsert>()
    assertModelWriteShape<SpeechRecognitionModelUpdate>()
    assertModelRowShape<SpeechSynthesisModelRow>()
    assertModelWriteShape<SpeechSynthesisModelInsert>()
    assertModelWriteShape<SpeechSynthesisModelUpdate>()
    assertModelRowShape<VideoGenerationModelRow>()
    assertModelWriteShape<VideoGenerationModelInsert>()
    assertModelWriteShape<VideoGenerationModelUpdate>()
  })

  it('protects predicates inherited from AIModel', () => {
    expect(() => aiModelSchema.extend({
      displayName: string('displayName').predicate('https://example.invalid/name'),
    }, {
      type: 'https://example.invalid/BrokenModel',
    })).toThrow(/predicate/)
  })
})
