import { describe, expect, it } from 'vitest'
import {
  getBuiltinDefaultModel,
  getBuiltinModel,
  getBuiltinModels,
  getBuiltinProvider,
} from '../src/discovery'

describe('discovery shared metadata', () => {
  it('returns builtin providers by canonical slug', () => {
    expect(getBuiltinProvider('anthropic')?.slug).toBe('anthropic')
    expect(getBuiltinProvider('openai')?.slug).toBe('openai')
    expect(getBuiltinProvider('x-ai')?.slug).toBe('x-ai')
    expect(getBuiltinProvider('claude')).toBeUndefined()
    expect(getBuiltinProvider('codex')).toBeUndefined()
    expect(getBuiltinProvider('xai')).toBeUndefined()
  })

  it('keeps provider base urls aligned with shared runtime defaults', () => {
    expect(getBuiltinProvider('anthropic')?.baseUrl).toBe('https://api.anthropic.com/v1')
    expect(getBuiltinProvider('google')?.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta')
    expect(getBuiltinProvider('ollama')).toMatchObject({
      slug: 'ollama',
      baseUrl: 'http://localhost:11434/v1',
      authType: 'none',
    })
  })

  it('filters builtin models by canonical provider slug', () => {
    const defaultClaudeModel = getBuiltinDefaultModel('anthropic')

    expect(getBuiltinModels('anthropic').every((model) => model.provider === 'anthropic')).toBe(true)
    expect(defaultClaudeModel?.provider).toBe('anthropic')
    expect(defaultClaudeModel && getBuiltinModel('anthropic', defaultClaudeModel.id)?.provider).toBe('anthropic')
    expect(getBuiltinDefaultModel('x-ai')?.provider).toBe('x-ai')
    expect(getBuiltinModels('claude')).toEqual([])
  })
})
