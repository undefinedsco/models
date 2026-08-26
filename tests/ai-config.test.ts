import { describe, expect, it } from 'vitest'
import {
  AIConfigRuntimeCapability,
  aiConfigSupportsRuntimeCapability,
  aiConfigModelRef,
  aiConfigProviderRef,
  aiConfigRepository,
  buildAIConfigDisconnectPlan,
  buildAIConfigMutationPlan,
  buildAIConfigProviderStateMap,
  createAIConfigCredentialId,
  getDefaultAIConfigCredentialId,
  getAIConfigProviderCapabilities,
  getAIConfigProviderFamilyIds,
  getAIConfigProviderMetadata,
  normalizeAIConfigModelId,
  normalizeAIConfigProviderId,
  normalizeAIConfigResourceId,
  sameAIConfigProviderFamily,
  selectAIConfigCredential,
  selectAIConfigCredentialForBackend,
} from '../src/ai-config'
import { UDFS } from '../src/namespaces'

describe('ai-config shared core', () => {
  it('creates opaque credential ids and keeps human meaning in fields', () => {
    const first = createAIConfigCredentialId()
    const second = createAIConfigCredentialId()

    expect(first).toMatch(/^cred_[a-z0-9_-]+$/u)
    expect(second).toMatch(/^cred_[a-z0-9_-]+$/u)
    expect(second).not.toBe(first)
  })

  it('keeps the legacy deterministic default credential id stable', () => {
    expect(getDefaultAIConfigCredentialId('codex')).toBe('openai-default')
  })

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

  it('uses explicit runtime capabilities and a conservative legacy fallback', () => {
    expect(getAIConfigProviderCapabilities('undefineds')).toEqual([
      AIConfigRuntimeCapability.chatCompletions,
      AIConfigRuntimeCapability.responses,
      AIConfigRuntimeCapability.responsesWebSearch,
      AIConfigRuntimeCapability.imageInput,
      AIConfigRuntimeCapability.imageGeneration,
      AIConfigRuntimeCapability.imageEditing,
      AIConfigRuntimeCapability.toolCalls,
    ])
    expect(getAIConfigProviderCapabilities('legacy-custom')).toEqual([
      AIConfigRuntimeCapability.chatCompletions,
    ])
    expect(getAIConfigProviderCapabilities('legacy-custom', [])).toEqual([])
    expect(aiConfigSupportsRuntimeCapability(
      'legacy-custom',
      AIConfigRuntimeCapability.responsesWebSearch,
    )).toBe(false)
    expect(aiConfigSupportsRuntimeCapability(
      'custom-openai',
      AIConfigRuntimeCapability.responsesWebSearch,
      ['chat_completions', 'responses', 'responses_web_search'],
    )).toBe(true)
  })

  it('normalizes Qwen aliases to the DashScope embedding provider catalog entry', () => {
    expect(normalizeAIConfigProviderId('qwen')).toBe('dashscope')
    expect(normalizeAIConfigProviderId('alibaba')).toBe('dashscope')

    const metadata = getAIConfigProviderMetadata('qwen')
    expect(metadata).toMatchObject({
      id: 'dashscope',
      displayName: 'DashScope',
      defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModels: ['text-embedding-v4'],
      defaultModelType: 'embedding',
    })
  })

  it('exposes DashScope text-embedding-v4 as an embedding fallback catalog model', () => {
    const states = buildAIConfigProviderStateMap({
      providerRows: [],
      credentialRows: [],
      modelRows: [],
    })

    expect(states.dashscope).toMatchObject({
      id: 'dashscope',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      selectedModelId: 'text-embedding-v4',
      models: [
        {
          id: 'text-embedding-v4',
          modelType: 'embedding',
          enabled: true,
        },
      ],
    })
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
    expect(aiConfigModelRef('anthropic', 'claude-sonnet-4')).toBe('anthropic.ttl#claude-sonnet-4')
  })

  it('builds AI config refs as target-table ids for drizzle link resolution', () => {
    const providerBase = 'https://cloud.example/alice/pod/settings/providers/'
    const providerRef = aiConfigProviderRef('anthropic')
    const modelRef = aiConfigModelRef('anthropic', 'claude-sonnet-4')

    expect(providerRef).toBe('anthropic.ttl')
    expect(modelRef).toBe('anthropic.ttl#claude-sonnet-4')
    expect(providerRef).not.toContain('settings/providers/')
    expect(modelRef).not.toContain('settings/providers/')
    expect(new URL(providerRef, providerBase).href).toBe('https://cloud.example/alice/pod/settings/providers/anthropic.ttl')
    expect(new URL(modelRef, providerBase).href).toBe('https://cloud.example/alice/pod/settings/providers/anthropic.ttl#claude-sonnet-4')
    expect(new URL('settings/providers/anthropic.ttl', providerBase).href).toBe('https://cloud.example/alice/pod/settings/providers/settings/providers/anthropic.ttl')
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
      selectedModelIds: ['claude-sonnet-4'],
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

  it('reads multiple provider model links while keeping scalar RDF compatibility', () => {
    const states = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: false,
      providerRows: [
        {
          id: 'openai',
          hasModel: [
            '/settings/providers/openai.ttl#gpt-4o',
            '/settings/providers/openai.ttl#gpt-4o-mini',
          ],
        },
      ],
      credentialRows: [],
      modelRows: [
        {
          id: 'openai.ttl#gpt-4o',
          displayName: 'GPT-4o',
          isProvidedBy: '/settings/providers/openai.ttl',
          status: 'active',
        },
        {
          id: 'openai.ttl#gpt-4o-mini',
          displayName: 'GPT-4o mini',
          isProvidedBy: '/settings/providers/openai.ttl',
          status: 'active',
        },
      ],
    })

    expect(states.openai).toMatchObject({
      selectedModelId: 'gpt-4o',
      selectedModelIds: ['gpt-4o', 'gpt-4o-mini'],
    })

    const legacyStates = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: false,
      providerRows: [{ id: 'openai', hasModel: '/settings/providers/openai.ttl#gpt-4o' }],
      credentialRows: [],
      modelRows: [],
    })

    expect(legacyStates.openai).toMatchObject({
      selectedModelId: 'gpt-4o',
      selectedModelIds: ['gpt-4o'],
    })
  })

  it('projects RDF subclasses and capability URIs for legacy AI Connections DTOs', () => {
    const states = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: false,
      providerRows: [],
      credentialRows: [],
      modelRows: [{
        id: 'openai.ttl#gpt-4o',
        displayName: 'GPT-4o',
        isProvidedBy: '/settings/providers/openai.ttl',
        rdfType: [UDFS.AIModel, UDFS.ChatModel],
        capabilities: [UDFS.ChatCapability, UDFS.VisionCapability, UDFS.OCRCapability],
      }],
    })

    expect(states.openai?.models[0]).toMatchObject({
      modelType: 'chat',
      capabilities: ['chat', 'vision', 'ocr'],
    })
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
        if (id === 'deepseek.ttl') {
          return {
            id: 'deepseek.ttl',
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
      credentialResourceId: 'deepseek-key-1',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com/v1',
    })
  })

  it('uses the exact credential resource id when recording rotation usage', async () => {
    const updates: Array<{ id: string; data: Record<string, unknown> }> = []
    const usedAt = new Date('2026-08-11T08:00:00.000Z')

    await aiConfigRepository.markCredentialUsed({
      select() {
        throw new Error('select should not be called')
      },
      async findById() {
        throw new Error('findById should not be called')
      },
      async updateById(_resource: unknown, id: string, data: Record<string, unknown>) {
        updates.push({ id, data })
        return null
      },
    }, {
      credentialId: 'jina-default',
      credentialResourceId: 'credentials.ttl#jina-default',
    }, usedAt)

    expect(updates).toEqual([{
      id: 'credentials.ttl#jina-default',
      data: { lastUsedAt: usedAt },
    }])
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
      id: 'anthropic.ttl',
      baseUrl: 'https://api.anthropic.com/v1',
      hasModel: [aiConfigModelRef('anthropic', 'claude-sonnet-4')],
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'credentials.ttl#anthropic-default',
      provider: aiConfigProviderRef('anthropic'),
      service: 'ai',
      status: 'active',
      apiKey: 'sk-ant-test',
      isDefault: true,
    })
    expect(plan.modelUpserts).toHaveLength(1)
    expect(plan.modelUpserts[0]).toMatchObject({
      id: 'anthropic.ttl#claude-sonnet-4',
      displayName: 'Claude Sonnet 4',
      rdfType: [UDFS.ChatModel],
      capabilities: [UDFS.ChatCapability],
      isProvidedBy: aiConfigProviderRef('anthropic'),
      status: 'active',
    })
    expect(plan.modelDeleteIds).toEqual([])
  })

  it('keeps reader models in the shared AI provider/model/credential config', () => {
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
            modelType: 'document_understanding',
          },
        ],
      },
    })

    expect(plan.providerId).toBe('paddleocr')
    expect(plan.providerPayload).toMatchObject({
      id: 'paddleocr.ttl',
      baseUrl: 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
      hasModel: [aiConfigModelRef('paddleocr', 'pp-ocrv6')],
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'credentials.ttl#paddleocr-default',
      provider: aiConfigProviderRef('paddleocr'),
      service: 'ai',
      status: 'active',
      apiKey: 'paddle-token',
    })
    expect(plan.modelUpserts).toHaveLength(1)
    expect(plan.modelUpserts[0]).toMatchObject({
      id: 'paddleocr.ttl#pp-ocrv6',
      displayName: 'PP-OCRv6',
      rdfType: [UDFS.DocumentUnderstandingModel],
      capabilities: [UDFS.DocumentUnderstandingCapability, UDFS.OCRCapability],
      isProvidedBy: aiConfigProviderRef('paddleocr'),
      status: 'active',
    })
  })

  it('rejects explicit unknown model class names at mutation boundaries', () => {
    for (const modelType of ['reader', 'document', 'ocr', 'typo']) {
      expect(() => buildAIConfigMutationPlan({
        providerId: 'paddleocr',
        currentProviderRows: [],
        currentCredentialRows: [],
        currentModelRows: [],
        updates: {
          models: [
            {
              id: `model-${modelType}`,
              name: modelType,
              enabled: true,
              capabilities: [],
              modelType,
            },
          ],
        },
      })).toThrow(`Unsupported AI model class: ${modelType}`)
    }
  })

  it('persists every enabled model as a provider URI link', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'openai',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: true,
            capabilities: [],
          },
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            capabilities: [],
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            enabled: false,
            capabilities: [],
          },
        ],
      },
    })

    expect(plan.providerPayload?.hasModel).toEqual([
      aiConfigModelRef('openai', 'gpt-4o'),
      aiConfigModelRef('openai', 'gpt-4o-mini'),
    ])
  })

  it('normalizes a legacy scalar provider link when no model update is requested', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'openai',
      currentProviderRows: [
        {
          id: 'openai',
          hasModel: '/settings/providers/openai.ttl#gpt-4o',
        },
      ],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: { enabled: true },
    })

    expect(plan.providerPayload?.hasModel).toEqual([
      aiConfigModelRef('openai', 'gpt-4o'),
    ])
  })

  it('clears provider model links when all picked models are disabled', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'openai',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            enabled: false,
            capabilities: [],
          },
        ],
      },
    })

    expect(plan.providerPayload?.hasModel).toBeUndefined()
  })

  it('round-trips explicit provider and model runtime capabilities', () => {
    const plan = buildAIConfigMutationPlan({
      providerId: 'custom-openai',
      currentProviderRows: [],
      currentCredentialRows: [],
      currentModelRows: [],
      updates: {
        capabilities: ['chat_completions', 'responses', 'responses_web_search'],
        models: [{
          id: 'model-1',
          name: 'Model 1',
          enabled: true,
          capabilities: ['image_input', 'tool_calls'],
        }],
      },
    })

    expect(plan.providerPayload?.capabilities).toEqual([
      'chat_completions',
      'responses',
      'responses_web_search',
    ])
    expect(plan.modelUpserts[0]).toMatchObject({
      rdfType: [UDFS.ChatModel],
      capabilities: [UDFS.ChatCapability],
      runtimeCapabilities: ['image_input', 'tool_calls'],
    })

    const states = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: false,
      providerRows: [{ id: 'custom-openai', capabilities: plan.providerPayload?.capabilities }],
      credentialRows: [],
      modelRows: [{
        ...plan.modelUpserts[0],
        id: 'model-1',
        isProvidedBy: '/settings/providers/custom-openai.ttl',
      }],
    })
    expect(states['custom-openai']?.capabilities).toEqual([
      'chat_completions',
      'responses',
      'responses_web_search',
    ])
    expect(states['custom-openai']?.models[0]?.capabilities).toEqual(['image_input', 'tool_calls'])
  })

  it('returns reader model type from AI config state reads', () => {
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
          modelType: 'document_understanding',
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
          modelType: 'document_understanding',
          capabilities: [],
          isCustom: true,
        },
      ],
    })
  })

  it('uses document understanding as the PaddleOCR catalog fallback model type', () => {
    const states = buildAIConfigProviderStateMap({
      fallbackToCatalogModels: true,
      providerRows: [],
      credentialRows: [],
      modelRows: [],
    })

    expect(states.paddleocr.models[0]).toMatchObject({
      id: 'PP-OCRv6',
      modelType: 'document_understanding',
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
      id: 'deepseek.ttl',
      baseUrl: 'https://api.deepseek.com/v1',
      supportsBackend: 'codex',
      rotationPolicy: 'round_robin',
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'credentials.ttl#deepseek-key-1',
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
      id: 'stepfun.ttl',
      baseUrl: 'https://api.stepfun.com/v1',
      hasModel: [aiConfigModelRef('stepfun', 'step-3.7-flash')],
    })
    expect(plan.credentialPayload).toMatchObject({
      id: 'credentials.ttl#stepfun-default',
      provider: aiConfigProviderRef('stepfun'),
      service: 'ai',
      status: 'active',
      apiKey: 'sk-stepfun-test',
      label: 'Stepfun Key',
      isDefault: true,
    })
    expect(plan.modelUpserts).toHaveLength(1)
    expect(plan.modelUpserts[0]).toMatchObject({
      id: 'stepfun.ttl#step-3.7-flash',
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
      credentialDeleteIds: ['credentials.ttl#anthropic-default', 'claude-default'],
    })
  })
})
