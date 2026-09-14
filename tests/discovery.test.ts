import { describe, expect, it } from 'vitest'
import {
  getBuiltinDefaultModel,
  getBuiltinModel,
  getBuiltinModels,
  getBuiltinProvider,
} from '../src/discovery'

describe('discovery shared metadata', () => {
  it('normalizes provider aliases for builtin provider lookups', () => {
    expect(getBuiltinProvider('claude')?.slug).toBe('anthropic')
    expect(getBuiltinProvider('codex')?.slug).toBe('openai')
    expect(getBuiltinProvider('xai')?.slug).toBe('x-ai')
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

  it('publishes canonical Zhipu offerings for API Platform and Coding Plan', () => {
    expect(getBuiltinProvider('zhipu')?.offerings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'api-platform',
        kind: 'api-platform',
        authModes: ['apiKey'],
        endpoints: [expect.objectContaining({
          protocol: 'chatCompletions',
          baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        })],
      }),
      expect.objectContaining({
        id: 'coding-plan',
        kind: 'token-plan',
        authModes: ['apiKey'],
        endpoints: [expect.objectContaining({
          protocol: 'chatCompletions',
          baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
        })],
      }),
    ]))
  })

  it('publishes Ollama as a local offering', () => {
    expect(getBuiltinProvider('ollama')?.offerings).toEqual([
      expect.objectContaining({
        id: 'local',
        kind: 'local',
        authModes: ['local'],
        endpoints: [expect.objectContaining({
          protocol: 'chatCompletions',
          baseUrl: 'http://localhost:11434/v1',
        })],
      }),
    ])
  })

  it('normalizes provider ids when querying builtin models', () => {
    const defaultClaudeModel = getBuiltinDefaultModel('claude')

    expect(getBuiltinModels('claude').every((model) => model.provider === 'anthropic')).toBe(true)
    expect(defaultClaudeModel?.provider).toBe('anthropic')
    expect(defaultClaudeModel && getBuiltinModel('claude', defaultClaudeModel.id)?.provider).toBe('anthropic')
    expect(getBuiltinDefaultModel('xai')?.provider).toBe('x-ai')
  })
})
