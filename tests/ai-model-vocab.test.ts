import { describe, expect, it } from 'vitest'
import {
  AI_MODEL_CAPABILITIES,
  AI_MODEL_MODALITIES,
  filterAIModelCapabilities,
  filterAIModelModalities,
  isAIModelCapability,
  isAIModelModality,
} from '../src/ai-model-vocab'

describe('AI model vocabulary', () => {
  it('keeps modalities and capabilities as separate models.dev-aligned vocabularies', () => {
    expect(AI_MODEL_MODALITIES).toEqual(['text', 'image', 'audio', 'video', 'pdf'])
    expect(AI_MODEL_CAPABILITIES).toEqual(['tool_call', 'reasoning', 'web'])
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
})
