import { describe, expect, it } from 'vitest'
import {
  aiConfigModelRef,
  aiConfigProviderRef,
  buildAIConfigDisconnectPlan,
  buildAIConfigMutationPlan,
  buildAIConfigProviderStateMap,
  getAIConfigProviderFamilyIds,
  getAIConfigProviderMetadata,
  normalizeAIConfigModelId,
  normalizeAIConfigProviderId,
  normalizeAIConfigResourceId,
  sameAIConfigProviderFamily,
  selectAIConfigCredential,
} from '../src/ai-config'

describe('ai-config shared core', () => {
  it('normalizes provider aliases to canonical ids', () => {
    expect(normalizeAIConfigProviderId('claude')).toBe('anthropic')
    expect(normalizeAIConfigProviderId('codex')).toBe('openai')
    expect(normalizeAIConfigProviderId('xai')).toBe('x-ai')
    expect(getAIConfigProviderFamilyIds('claude')).toEqual(['anthropic', 'claude'])
    expect(getAIConfigProviderFamilyIds('openai')).toEqual(['openai', 'codex'])
    expect(getAIConfigProviderFamilyIds('xai')).toEqual(['x-ai', 'xai'])
    expect(sameAIConfigProviderFamily('https://pod.example/settings/providers/claude.ttl', 'anthropic')).toBe(true)
    expect(sameAIConfigProviderFamily('claude.ttl', 'anthropic')).toBe(true)
    expect(sameAIConfigProviderFamily('settings/providers/claude.ttl', 'anthropic')).toBe(true)
    expect(sameAIConfigProviderFamily('xai', 'https://pod.example/settings/providers/x-ai.ttl')).toBe(true)
    expect(normalizeAIConfigResourceId('credentials.ttl#openai-default')).toBe('openai-default')
    expect(normalizeAIConfigResourceId('/settings/providers/openai.ttl')).toBe('openai')
    expect(normalizeAIConfigResourceId('settings/providers/openai.ttl')).toBe('openai')
  })

  it('keeps LinX cloud models out of Pod-backed user AI config defaults', () => {
    expect(normalizeAIConfigProviderId('undefineds')).toBe('undefineds')

    const states = buildAIConfigProviderStateMap({
      providerRows: [],
      credentialRows: [],
      modelRows: [],
    })

    expect(getAIConfigProviderMetadata('undefineds')).toMatchObject({
      id: 'undefineds',
      displayName: 'Undefineds',
    })
    expect(states.undefineds).toBeUndefined()
  })

  it('normalizes provider-qualified model ids only in provider context', () => {
    expect(normalizeAIConfigResourceId('undefineds/linx')).toBe('undefineds/linx')
    expect(normalizeAIConfigModelId('anthropic/claude-sonnet-4', 'anthropic')).toBe('claude-sonnet-4')
    expect(normalizeAIConfigModelId('anthropic.ttl#claude-sonnet-4', 'anthropic')).toBe('claude-sonnet-4')
    expect(normalizeAIConfigModelId('openrouter/openai/gpt-4o-mini', 'openrouter')).toBe('openai/gpt-4o-mini')
    expect(normalizeAIConfigModelId('https://pod.example/settings/providers/anthropic.ttl#claude-sonnet-4', 'anthropic')).toBe('claude-sonnet-4')
    expect(aiConfigModelRef('anthropic', 'claude-sonnet-4')).toBe('/settings/providers/anthropic.ttl#claude-sonnet-4')
  })

  it('builds provider state from provider-scoped AI config resources', () => {
    const states = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: false,
      providerRows: [
        {
          id: 'anthropic',
          baseUrl: 'https://api.anthropic.com/v1',
          hasModel: '/settings/providers/anthropic.ttl#claude-sonnet-4',
        },
      ],
      credentialRows: [
        {
          id: 'credentials.ttl#anthropic-default',
          provider: '/settings/providers/claude.ttl',
          service: 'ai',
          status: 'active',
          apiKey: 'sk-ant-test',
        },
      ],
      modelRows: [
        {
          id: 'anthropic.ttl#claude-sonnet-4',
          displayName: 'Claude Sonnet 4',
          isProvidedBy: '/settings/providers/anthropic.ttl',
          status: 'active',
        },
      ],
    })

    expect(states.anthropic).toMatchObject({
      id: 'anthropic',
      enabled: true,
      apiKey: 'sk-ant-test',
      baseUrl: 'https://api.anthropic.com/v1',
      credentialId: 'anthropic-default',
      selectedModelId: 'claude-sonnet-4',
    })
    expect(states.anthropic?.models).toEqual([
      {
        id: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        enabled: true,
        capabilities: [],
        isCustom: true,
      },
    ])
  })

  it('selects the default credential before round-robin candidates', () => {
    const selected = selectAIConfigCredential('openai', [
      {
        id: 'openai-oldest',
        provider: '/settings/providers/openai.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-oldest',
        lastUsedAt: new Date('2026-05-13T01:00:00.000Z'),
      },
      {
        id: 'openai-default',
        provider: '/settings/providers/openai.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-default',
        isDefault: true,
        lastUsedAt: new Date('2026-05-13T02:00:00.000Z'),
      },
    ])

    expect(selected).toMatchObject({
      credentialId: 'openai-default',
      apiKey: 'sk-default',
      isDefault: true,
    })
  })

  it('round-robins non-default credentials by oldest lastUsedAt', () => {
    const selected = selectAIConfigCredential('openai', [
      {
        id: 'openai-newer',
        provider: '/settings/providers/openai.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-newer',
        lastUsedAt: new Date('2026-05-13T02:00:00.000Z'),
      },
      {
        id: 'openai-older',
        provider: '/settings/providers/openai.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-older',
        lastUsedAt: new Date('2026-05-13T01:00:00.000Z'),
      },
    ])

    expect(selected).toMatchObject({
      credentialId: 'openai-older',
      apiKey: 'sk-older',
      isDefault: false,
    })
  })

  it('does not use @id as an AI config row id fallback', () => {
    const selected = selectAIConfigCredential('openai', [
      {
        '@id': 'https://pod.example/settings/credentials.ttl#openai-default',
        provider: '/settings/providers/openai.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-default',
      },
    ])

    expect(selected?.credentialId).toBe('')

    const disconnect = buildAIConfigDisconnectPlan({
      providerId: 'openai',
      currentCredentialRows: [
        {
          '@id': 'https://pod.example/settings/credentials.ttl#openai-default',
          provider: '/settings/providers/openai.ttl',
          service: 'ai',
          status: 'active',
          apiKey: 'sk-default',
        },
      ],
    })

    expect(disconnect.credentialDeleteIds).toEqual([])
  })

  it('creates a shared mutation plan for provider, credential, and model writes', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'claude',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        enabled: true,
        apiKey: 'sk-ant-test',
        models: [
          {
            id: 'claude-sonnet-4',
            name: 'Claude Sonnet 4',
            enabled: true,
            capabilities: [],
          },
        ],
      },
    })

    expect(plan.providerId).toBe('anthropic')
    expect(plan.providerPayload).toMatchObject({
      id: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      hasModel: aiConfigModelRef('anthropic', 'claude-sonnet-4'),
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'anthropic-default',
      provider: aiConfigProviderRef('anthropic'),
      service: 'ai',
      status: 'active',
      apiKey: 'sk-ant-test',
      isDefault: true,
    })
    expect(plan.modelUpserts).toHaveLength(1)
    expect(plan.modelUpserts[0]).toMatchObject({
      id: 'claude-sonnet-4',
      displayName: 'Claude Sonnet 4',
      isProvidedBy: aiConfigProviderRef('anthropic'),
      status: 'active',
    })
    expect(plan.modelDeleteIds).toEqual([])
  })

  it('builds a shared disconnect plan for provider alias credentials', () => {
    const plan = buildAIConfigDisconnectPlan({
      providerId: 'claude',
      currentCredentialRows: [
        {
          id: 'credentials.ttl#anthropic-default',
          provider: '/settings/providers/anthropic.ttl',
          service: 'ai',
          status: 'active',
          apiKey: 'sk-ant-test',
        },
        {
          id: 'claude-default',
          provider: '/settings/providers/claude.ttl',
          service: 'ai',
          status: 'active',
          apiKey: 'sk-claude-test',
        },
        {
          id: 'openai-default',
          provider: '/settings/providers/openai.ttl',
          service: 'ai',
          status: 'active',
          apiKey: 'sk-openai-test',
        },
      ],
    })

    expect(plan).toEqual({
      providerId: 'anthropic',
      credentialDeleteIds: ['anthropic-default', 'claude-default'],
    })
  })
})
