import { describe, expect, it } from 'vitest'
import { UDFS } from '../src/namespaces'
import {
  AI_MODEL_CAPABILITY,
  AI_MODEL_CAPABILITIES,
  AI_MODEL_CLASS,
  AI_MODEL_MODALITIES,
  AI_MODEL_WORKLOAD_REQUIREMENT,
  withAIModelClassDefaultCapabilities,
  filterAIModelCapabilityUris,
  filterAIModelCapabilities,
  filterAIModelModalities,
  isAIModelEligibleForWorkload,
  isAIModelCapability,
  isAIModelCapabilityUri,
  isAIModelModality,
  selectAIModelForWorkload,
  toAIModelCapabilityUri,
  toAIModelCapabilityName,
  toAIModelClassName,
  toAIModelClassUri,
} from '../src'

describe('AI model vocabulary', () => {
  it('keeps modalities and capabilities as separate models.dev-aligned vocabularies', () => {
    expect(AI_MODEL_MODALITIES).toEqual(['text', 'image', 'audio', 'video', 'pdf'])
    expect(AI_MODEL_CAPABILITIES).toEqual([
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
    ])
    expect(isAIModelModality('image')).toBe(true)
    expect(isAIModelModality('tool_call')).toBe(false)
    expect(isAIModelCapability('reasoning')).toBe(true)
    expect(isAIModelCapability('image')).toBe(false)
  })

  it('filters unknown entries and duplicates from untrusted lists', () => {
    expect(filterAIModelModalities(['text', 'image', 'vision', 'image', 1])).toEqual(['text', 'image'])
    expect(filterAIModelCapabilities(['tool_call', 'function_calling', 'web', 'web'])).toEqual(['tool_call', 'web'])
    expect(filterAIModelModalities('image')).toEqual([])
    expect(filterAIModelCapabilities(undefined)).toEqual([])
  })

  it('stores canonical capability URIs while accepting legacy adapter names', () => {
    expect(toAIModelCapabilityUri('ocr')).toBe(AI_MODEL_CAPABILITY.ocr)
    expect(toAIModelCapabilityUri(AI_MODEL_CAPABILITY.ocr)).toBe(AI_MODEL_CAPABILITY.ocr)
    expect(toAIModelCapabilityUri('function_calling')).toBe(AI_MODEL_CAPABILITY.tool_call)
    expect(toAIModelCapabilityUri('unknown')).toBeUndefined()
    expect(isAIModelCapabilityUri(AI_MODEL_CAPABILITY.reasoning)).toBe(true)
    expect(isAIModelCapabilityUri('reasoning')).toBe(false)
    expect(filterAIModelCapabilityUris([
      'ocr',
      AI_MODEL_CAPABILITY.ocr,
      'document_understanding',
      1,
    ])).toEqual([
      AI_MODEL_CAPABILITY.ocr,
      AI_MODEL_CAPABILITY.document_understanding,
    ])
  })

  it('projects canonical RDF values back to adapter names', () => {
    expect(toAIModelClassName(AI_MODEL_CLASS.embedding)).toBe('embedding')
    expect(toAIModelClassName([UDFS.AIModel, AI_MODEL_CLASS.chat])).toBe('chat')
    expect(toAIModelClassName(UDFS.AIModel)).toBe('chat')
    expect(toAIModelCapabilityName(AI_MODEL_CAPABILITY.ocr)).toBe('ocr')
    expect(toAIModelCapabilityName('unknown')).toBeUndefined()
  })

  it('uses document understanding as the canonical document model class', () => {
    expect(AI_MODEL_CLASS.document_understanding).toBe(UDFS.DocumentUnderstandingModel)
    expect(withAIModelClassDefaultCapabilities({
      rdfType: [UDFS.DocumentUnderstandingModel],
      capabilities: [],
    })).toMatchObject({
      capabilities: [AI_MODEL_CAPABILITY.document_understanding],
    })
    expect((UDFS as Record<string, string>).DocumentModel).toBeUndefined()
  })

  it('keeps workload roles independent from model subclasses', () => {
    expect(AI_MODEL_WORKLOAD_REQUIREMENT.ocrModel).toBe(AI_MODEL_CAPABILITY.ocr)
    expect(toAIModelClassUri(undefined)).toBe(UDFS.ChatModel)
    expect(toAIModelClassUri('reader')).toBeUndefined()
    expect(toAIModelClassUri('document')).toBeUndefined()
    expect(toAIModelClassUri('ocr')).toBeUndefined()
    expect(toAIModelClassUri('typo')).toBeUndefined()
    expect(isAIModelEligibleForWorkload({
      capabilities: [AI_MODEL_CAPABILITY.ocr],
    }, 'ocrModel')).toBe(true)
    expect(isAIModelEligibleForWorkload({
      capabilities: ['ocr'],
    }, 'ocrModel')).toBe(true)
    expect(isAIModelEligibleForWorkload({
      capabilities: [AI_MODEL_CAPABILITY.document_understanding],
    }, 'ocrModel')).toBe(false)
    expect(isAIModelEligibleForWorkload({
      rdfType: [UDFS.DocumentUnderstandingModel],
      capabilities: [],
    }, 'readerModel')).toBe(true)
  })

  it('selects reader models only from the exact configured relation', () => {
    expect(selectAIModelForWorkload({
      config: {
        readerModel: '/settings/providers/paddleocr.ttl#paddleocr-vl-1.6',
      },
      models: [{
        id: '/settings/providers/paddleocr.ttl#paddleocr-vl-1.6',
        status: 'active',
        rdfType: [UDFS.DocumentUnderstandingModel],
        capabilities: [UDFS.DocumentUnderstandingCapability],
      }],
      workload: 'readerModel',
    })?.id).toContain('paddleocr-vl-1.6')

    expect(selectAIModelForWorkload({
      config: { readerModel: '/settings/providers/qwen.ttl#qwen-vl' },
      models: [{
        id: '/settings/providers/qwen.ttl#qwen-vl',
        rdfType: [UDFS.ChatModel],
        capabilities: [
          UDFS.DocumentUnderstandingCapability,
          UDFS.VisionCapability,
        ],
      }],
      workload: 'readerModel',
    })?.id).toContain('qwen-vl')

    expect(selectAIModelForWorkload({
      config: {},
      models: [{
        id: '/settings/providers/paddleocr.ttl#paddleocr-vl-1.6',
        capabilities: [UDFS.DocumentUnderstandingCapability],
      }],
      workload: 'readerModel',
    })).toBeUndefined()
  })

  it('rejects inactive and ineligible reader model selections', () => {
    expect(selectAIModelForWorkload({
      config: { readerModel: '/settings/providers/paddleocr.ttl#inactive' },
      models: [{
        id: '/settings/providers/paddleocr.ttl#inactive',
        status: 'inactive',
        capabilities: [UDFS.DocumentUnderstandingCapability],
      }],
      workload: 'readerModel',
    })).toBeUndefined()

    expect(selectAIModelForWorkload({
      config: { readerModel: '/settings/providers/openai.ttl#gpt-4o' },
      models: [{
        id: '/settings/providers/openai.ttl#gpt-4o',
        rdfType: [UDFS.ChatModel],
        capabilities: [UDFS.ChatCapability],
      }],
      workload: 'readerModel',
    })).toBeUndefined()
  })
})
