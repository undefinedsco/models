import { describe, expect, it } from 'vitest'
import {
  aiConfigModelRef,
  aiConfigProviderRef,
  aiConfigRepository,
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
  selectAIConfigCredentialForBackend,
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
        modelType: 'chat',
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

  it('selects custom providers that explicitly support a backend', () => {
    const selected = selectAIConfigCredentialForBackend('codex', [
      {
        id: 'openai-default',
        provider: '/settings/providers/openai.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-openai',
      },
      {
        id: 'deepseek-newer',
        provider: '/settings/providers/deepseek.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-deepseek-newer',
        isDefault: true,
        lastUsedAt: new Date('2026-05-13T03:00:00.000Z'),
      },
      {
        id: 'deepseek-older',
        provider: '/settings/providers/deepseek.ttl',
        service: 'ai',
        status: 'active',
        apiKey: 'sk-deepseek-older',
        lastUsedAt: new Date('2026-05-13T01:00:00.000Z'),
      },
    ], [
      {
        id: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        supportsBackend: 'codex',
        rotationPolicy: 'round_robin',
      },
      {
        id: 'openai',
        baseUrl: 'https://api.openai.com/v1',
      },
    ])

    expect(selected).toMatchObject({
      backend: 'codex',
      providerId: 'deepseek',
      credentialId: 'deepseek-older',
      apiKey: 'sk-deepseek-older',
      baseUrl: 'https://api.deepseek.com/v1',
      isDefault: false,
    })
  })

  it('loads backend credentials through repository credential list plus exact provider reads', async () => {
    const selected = await aiConfigRepository.loadCredentialForBackend({
      select() {
        return {
          from(resource: unknown) {
            expect((resource as { config?: { name?: string } }).config?.name).toBe('credential')
            return {
              async execute() {
                return [
                  {
                    id: 'deepseek-key-1',
                    provider: '/settings/providers/deepseek.ttl',
                    service: 'ai',
                    status: 'active',
                    apiKey: 'sk-deepseek',
                  },
                ]
              },
            }
          },
        }
      },
      async findById(resource: unknown, id: string) {
        expect((resource as { config?: { name?: string } }).config?.name).toBe('aiProvider')
        if (id === 'deepseek') {
          return {
            id: 'deepseek',
            baseUrl: 'https://api.deepseek.com/v1',
            supportsBackend: 'codex',
          }
        }
        return null
      },
    }, 'codex')

    expect(selected).toMatchObject({
      providerId: 'deepseek',
      credentialId: 'deepseek-key-1',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
    })
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

  it('keeps parser models in the shared AI provider/model/credential config', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'paddleocr',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        enabled: true,
        apiKey: 'paddle-token',
        models: [
          {
            id: 'pp-ocrv6',
            name: 'PP-OCRv6',
            enabled: true,
            capabilities: ['document-parse', 'ocr'],
            modelType: 'parser',
          },
        ],
      },
    })

    expect(plan.providerId).toBe('paddleocr')
    expect(plan.providerPayload).toMatchObject({
      id: 'paddleocr',
      hasModel: aiConfigModelRef('paddleocr', 'pp-ocrv6'),
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'paddleocr-default',
      provider: aiConfigProviderRef('paddleocr'),
      service: 'ai',
      status: 'active',
      apiKey: 'paddle-token',
    })
    expect(plan.modelUpserts).toHaveLength(1)
    expect(plan.modelUpserts[0]).toMatchObject({
      id: 'pp-ocrv6',
      displayName: 'PP-OCRv6',
      modelType: 'parser',
      isProvidedBy: aiConfigProviderRef('paddleocr'),
      status: 'active',
    })
  })

  it('returns parser model type from AI config state reads', () => {
    const states = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: false,
      providerRows: [
        {
          id: 'paddleocr',
          hasModel: '/settings/providers/paddleocr.ttl#pp-ocrv6',
        },
      ],
      credentialRows: [
        {
          id: 'paddleocr-default',
          provider: '/settings/providers/paddleocr.ttl',
          service: 'ai',
          status: 'active',
          apiKey: 'paddle-token',
        },
      ],
      modelRows: [
        {
          id: 'paddleocr.ttl#pp-ocrv6',
          displayName: 'PP-OCRv6',
          modelType: 'parser',
          isProvidedBy: '/settings/providers/paddleocr.ttl',
          status: 'active',
        },
      ],
    })

    expect(states.paddleocr).toMatchObject({
      id: 'paddleocr',
      enabled: true,
      apiKey: 'paddle-token',
      selectedModelId: 'pp-ocrv6',
      models: [
        {
          id: 'pp-ocrv6',
          name: 'PP-OCRv6',
          enabled: true,
          modelType: 'parser',
          capabilities: [],
          isCustom: true,
        },
      ],
    })
  })

  it('creates a shared mutation plan for custom codex provider credentials', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'deepseek',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        enabled: true,
        apiKey: 'sk-deepseek-test',
        baseUrl: 'https://api.deepseek.com/v1',
        supportsBackend: 'codex',
        rotationPolicy: 'round_robin',
        credentialId: 'deepseek-key-1',
        credentialLabel: 'DeepSeek Key 1',
      },
    })

    expect(plan.providerId).toBe('deepseek')
    expect(plan.providerPayload).toMatchObject({
      id: 'deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
      supportsBackend: 'codex',
      rotationPolicy: 'round_robin',
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'deepseek-key-1',
      provider: aiConfigProviderRef('deepseek'),
      service: 'ai',
      status: 'active',
      apiKey: 'sk-deepseek-test',
      label: 'DeepSeek Key 1',
      isDefault: true,
    })
    expect(plan.credentialPayload?.baseUrl).toBeUndefined()
  })

  it('creates a shared mutation plan for custom LinX-routed StepFun model credentials', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'stepfun',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        enabled: true,
        apiKey: 'sk-stepfun-test',
        baseUrl: 'https://api.stepfun.com/v1',
        models: [
          {
            id: 'step-3.7-flash',
            name: 'step-3.7-flash',
            enabled: true,
            capabilities: [],
          },
        ],
      },
    })

    expect(plan.providerId).toBe('stepfun')
    expect(plan.providerPayload).toMatchObject({
      id: 'stepfun',
      baseUrl: 'https://api.stepfun.com/v1',
      hasModel: aiConfigModelRef('stepfun', 'step-3.7-flash'),
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'stepfun-default',
      provider: aiConfigProviderRef('stepfun'),
      service: 'ai',
      status: 'active',
      apiKey: 'sk-stepfun-test',
      label: 'Stepfun Key',
      isDefault: true,
    })
    expect(plan.modelUpserts).toHaveLength(1)
    expect(plan.modelUpserts[0]).toMatchObject({
      id: 'step-3.7-flash',
      displayName: 'step-3.7-flash',
      isProvidedBy: aiConfigProviderRef('stepfun'),
      status: 'active',
    })
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
