import { aiModelResource, type AIModelInsert, type AIModelRow } from '../ai-model.schema'
import {
  AI_MODEL_CLASS_DEFAULT_CAPABILITY,
  filterAIModelCapabilityUris,
  toAIModelCapabilityName,
  toAIModelClassName,
  toAIModelClassUri,
} from '../ai-model-vocab'
import { aiProviderResource, type AIProviderInsert, type AIProviderRow } from '../ai-provider.schema'
import { credentialResource } from '../credential.schema'
import type { CredentialInsert, CredentialRow } from '../credential.schema'

export interface AIConfigProviderCatalogEntry {
  id: string
  displayName: string
  aliases?: string[]
  defaultBaseUrl?: string
  defaultModels?: string[]
  defaultModelType?: string
  capabilities?: string[]
}

export const AIConfigRuntimeCapability = {
  chatCompletions: 'chat_completions',
  responses: 'responses',
  responsesWebSearch: 'responses_web_search',
  imageInput: 'image_input',
  imageGeneration: 'image_generation',
  imageEditing: 'image_editing',
  toolCalls: 'tool_calls',
} as const

export type AIConfigRuntimeCapabilityType = typeof AIConfigRuntimeCapability[keyof typeof AIConfigRuntimeCapability]

const AI_CONFIG_RUNTIME_CAPABILITY_SET: ReadonlySet<string> = new Set(
  Object.values(AIConfigRuntimeCapability),
)

export function filterAIConfigRuntimeCapabilities(value: unknown): AIConfigRuntimeCapabilityType[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((entry): entry is AIConfigRuntimeCapabilityType => (
    typeof entry === 'string' && AI_CONFIG_RUNTIME_CAPABILITY_SET.has(entry)
  )))]
}

export interface AIConfigModel {
  id: string
  name: string
  enabled: boolean
  capabilities: string[]
  modelType?: string
  isCustom?: boolean
}

export interface AIConfigProviderState {
  id: string
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  credentialId?: string
  credentialLabel?: string
  credentialIsDefault?: boolean
  models: AIConfigModel[]
  /** All provider models selected by the user; legacy callers may use selectedModelId. */
  selectedModelIds?: string[]
  selectedModelId?: string
  capabilities: string[]
}

export interface AIConfigUpdate {
  enabled?: boolean
  apiKey?: string
  baseUrl?: string
  supportsBackend?: string
  rotationPolicy?: string
  credentialId?: string
  credentialLabel?: string
  credentialBaseUrl?: string
  models?: AIConfigModel[]
  capabilities?: string[]
}

export interface BuildAIConfigProviderStateMapOptions {
  catalog?: readonly AIConfigProviderCatalogEntry[]
  providerRows: Array<Partial<AIProviderRow> & Record<string, unknown>>
  credentialRows: Array<Partial<CredentialRow> & Record<string, unknown>>
  modelRows: Array<Partial<AIModelRow> & Record<string, unknown>>
  fallbackToCatalogModels?: boolean
}

export interface AIConfigCredentialSelection {
  providerId: string
  credential: Partial<CredentialRow> & Record<string, unknown>
  credentialId?: string
  /** Exact base-relative Pod resource id used for mutations. */
  credentialResourceId?: string
  credentialLabel?: string
  apiKey: string
  baseUrl?: string
  proxyUrl?: string
  isDefault: boolean
}

export interface AIConfigBackendCredentialSelection extends AIConfigCredentialSelection {
  backend: string
}

export interface AIConfigMutationPlan {
  providerId: string
  providerPayload?: AIProviderInsert
  credentialPayload?: CredentialInsert
  modelUpserts: AIModelInsert[]
  modelDeleteIds: string[]
}

export interface AIConfigDisconnectPlan {
  providerId: string
  credentialDeleteIds: string[]
}

export const UNDEFINEDS_AI_PROVIDER_ID = 'undefineds'
export const UNDEFINEDS_AI_PROVIDER_DISPLAY_NAME = 'undefineds'
export const UNDEFINEDS_AI_BASE_URL = 'https://api.undefineds.co/v1'
export const LINX_LITE_MODEL_ID = 'linx-lite'
export const LINX_MODEL_ID = 'linx'
export const DEFAULT_LINX_MODEL_ID = LINX_LITE_MODEL_ID
export const UNDEFINEDS_AI_MODEL_IDS = [LINX_LITE_MODEL_ID, LINX_MODEL_ID] as const

const AI_CONFIG_PROVIDER_CATALOG: readonly AIConfigProviderCatalogEntry[] = [
  {
    id: 'dashscope',
    displayName: 'DashScope',
    aliases: ['qwen', 'alibaba', 'dashscope-cn'],
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModels: ['text-embedding-v4'],
    defaultModelType: 'embedding',
  },
  {
    id: 'openai',
    displayName: 'OpenAI',
    aliases: ['codex'],
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic',
    aliases: ['claude'],
    defaultBaseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'google',
    displayName: 'Google',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  },
  {
    id: 'ollama',
    displayName: 'Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
  },
  {
    id: 'x-ai',
    displayName: 'xAI',
    aliases: ['xai'],
    defaultBaseUrl: 'https://api.x.ai/v1',
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'minimax',
    displayName: 'MiniMax',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
  },
  {
    id: 'mistral',
    displayName: 'Mistral',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
  },
  {
    id: 'groq',
    displayName: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'moonshot',
    displayName: 'Moonshot',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
  },
  {
    id: 'zhipu',
    displayName: 'ZhiPu',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    id: 'codebuddy',
    displayName: 'CodeBuddy',
    defaultBaseUrl: 'https://api.codebuddy.ai/v1',
  },
  {
    id: 'paddleocr',
    displayName: 'PaddleOCR',
    aliases: ['paddle'],
    defaultBaseUrl: 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs',
    defaultModels: ['PP-OCRv6'],
    defaultModelType: 'document_understanding',
  },
]

const AI_CONFIG_PROVIDER_MAP = new Map(
  AI_CONFIG_PROVIDER_CATALOG.map((entry) => [entry.id, entry] as const),
)
const ABSOLUTE_IRI = /^[a-zA-Z][a-zA-Z\d+.-]*:/

interface AIConfigRepositoryDb {
  select(): {
    from(resource: unknown): {
      execute(): Promise<unknown[]>
    }
  }
  findById<T = unknown>(resource: unknown, id: string): Promise<T | null>
  updateById(resource: unknown, id: string, data: Record<string, unknown>): Promise<unknown>
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function titleizeProviderId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function resolveCatalogEntry(id: string, catalog: readonly AIConfigProviderCatalogEntry[]): AIConfigProviderCatalogEntry | undefined {
  return catalog.find((entry) => entry.id === id)
}

function collectKnownProviderIds(catalog: readonly AIConfigProviderCatalogEntry[]): Set<string> {
  const ids = new Set<string>()
  for (const entry of catalog) {
    ids.add(entry.id)
    for (const alias of entry.aliases ?? []) {
      ids.add(alias)
    }
  }
  return ids
}

function preferredSelectedModelIds(models: AIConfigModel[]): string[] {
  const preferredId = models.find((model) => model.enabled)?.id ?? models[0]?.id
  return preferredId ? [preferredId] : []
}

function existingDate(value: unknown): Date | undefined {
  return value instanceof Date ? value : undefined
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeAIConfigModelType(value: unknown): string {
  return normalizeOptionalText(value)?.toLowerCase() ?? 'chat'
}

function normalizeOptionalBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function normalizeOptionalTimestamp(value: unknown): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return 0
}

function normalizeOptionalInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeBackendId(value?: string | null): string {
  return normalizeText(String(value ?? ''))
}

function normalizeRotationPolicy(value: unknown): string {
  const normalized = normalizeOptionalText(value)?.toLowerCase()
  return normalized === 'round_robin' || normalized === 'round-robin' ? 'round_robin' : 'default'
}

function parseBackendList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(parseBackendList)
  }
  if (typeof value !== 'string') {
    return []
  }
  return value
    .split(/[\s,;|]+/u)
    .map(normalizeBackendId)
    .filter(Boolean)
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function collectAIConfigModelRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectAIConfigModelRefs(entry))
  }
  return typeof value === 'string' && value.trim() ? [value] : []
}

function normalizeAIConfigModelStorageIds(value: unknown, providerId: string): string[] {
  return uniqueStrings(
    collectAIConfigModelRefs(value)
      .map((raw) => normalizeAIConfigModelStorageId(raw, providerId))
      .filter(Boolean),
  )
}

function storedResourceId(raw: unknown, buildCanonicalId: (localId: string) => string): string {
  if (typeof raw !== 'string' || !raw.trim()) return ''
  const value = raw.trim()
  const localId = normalizeAIConfigResourceId(value)
  if (!localId) return ''
  if (ABSOLUTE_IRI.test(value)) return buildCanonicalId(localId)
  if (value.includes('#') || /\.ttl$/iu.test(value) || value.endsWith('/')) {
    return value.replace(/^\/+settings\/(?:providers\/)?/u, '')
  }
  return value
}

function inputResourceId(raw: string, buildCanonicalId: (localId: string) => string): string {
  const stored = storedResourceId(raw, buildCanonicalId)
  if (!stored) return ''
  return stored === raw.trim() && !stored.includes('#') && !/\.ttl$/iu.test(stored) && !stored.endsWith('/')
    ? buildCanonicalId(stored)
    : stored
}

function providerStorageId(
  row: Partial<AIProviderRow> & Record<string, unknown> | undefined,
  providerId: string,
): string {
  const existing = storedResourceId(row?.id ?? row?.['@id'], (id) => aiProviderResource.buildId({ id }))
  return existing || aiProviderResource.buildId({ id: providerId })
}

function credentialStorageId(
  row: Partial<CredentialRow> & Record<string, unknown> | undefined,
): string {
  return storedResourceId(row?.id ?? row?.['@id'], (id) => credentialResource.buildId({ id }))
}

function modelStorageId(
  row: Partial<AIModelRow> & Record<string, unknown> | undefined,
  providerId: string,
  modelId: string,
): string {
  const providerRef = aiConfigProviderRef(providerId)
  const existing = storedResourceId(row?.id ?? row?.['@id'], (id) => aiModelResource.buildId({
    id,
    isProvidedBy: providerRef,
  }))
  return existing || aiModelResource.buildId({ id: modelId, isProvidedBy: providerRef })
}

function aiConfigProviderSupportsBackend(
  row: Partial<AIProviderRow> & Record<string, unknown>,
  backend: string,
): boolean {
  const normalizedBackend = normalizeBackendId(backend)
  if (!normalizedBackend) return false
  return parseBackendList(row.supportsBackend).includes(normalizedBackend)
}

export function getAIConfigProviderCatalog(): readonly AIConfigProviderCatalogEntry[] {
  return AI_CONFIG_PROVIDER_CATALOG
}

export function getAIConfigProviderMetadata(providerId: string): AIConfigProviderCatalogEntry {
  const canonicalId = normalizeAIConfigProviderId(providerId)
  return AI_CONFIG_PROVIDER_MAP.get(canonicalId) ?? {
    id: canonicalId,
    displayName: titleizeProviderId(canonicalId),
  }
}

export function getAIConfigProviderCapabilities(
  providerId: string,
  explicitCapabilities?: unknown,
): string[] {
  if (Array.isArray(explicitCapabilities)) {
    return uniqueStrings(explicitCapabilities
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLowerCase()))
  }
  if (normalizeAIConfigProviderId(providerId) === UNDEFINEDS_AI_PROVIDER_ID) {
    return [
      AIConfigRuntimeCapability.chatCompletions,
      AIConfigRuntimeCapability.responses,
      AIConfigRuntimeCapability.responsesWebSearch,
      AIConfigRuntimeCapability.imageInput,
      AIConfigRuntimeCapability.imageGeneration,
      AIConfigRuntimeCapability.imageEditing,
      AIConfigRuntimeCapability.toolCalls,
    ]
  }
  const metadata = getAIConfigProviderMetadata(providerId)
  return metadata.capabilities?.length
    ? [...metadata.capabilities]
    : [AIConfigRuntimeCapability.chatCompletions]
}

export function aiConfigSupportsRuntimeCapability(
  providerId: string,
  capability: AIConfigRuntimeCapabilityType,
  explicitCapabilities?: unknown,
): boolean {
  return getAIConfigProviderCapabilities(providerId, explicitCapabilities).includes(capability)
}

export function normalizeAIConfigResourceId(raw?: string | null): string {
  if (!raw) return ''
  const value = raw.trim()
  if (!value) return ''
  if (value.includes('#')) return value.split('#').pop() || value
  if (!ABSOLUTE_IRI.test(value) && !value.endsWith('.ttl')) {
    return value
  }
  const clean = value.replace(/\/$/, '')
  const tail = clean.split('/').pop() || clean
  return tail.endsWith('.ttl') ? tail.slice(0, -4) : tail
}

function aiConfigResourceRefToProviderId(raw?: string | null): string {
  return normalizeAIConfigProviderId(raw)
}

function aiConfigResourceRefToModelId(raw: string | null | undefined, providerId: string): string {
  return normalizeAIConfigModelId(raw, providerId)
}

export function normalizeAIConfigModelId(raw?: string | null, providerId?: string | null): string {
  const modelId = normalizeAIConfigResourceId(raw)
  if (!modelId.includes('/')) return modelId

  const [prefix, ...rest] = modelId.split('/')
  if (rest.length === 0) return modelId

  if (!providerId) return modelId

  return normalizeAIConfigProviderId(prefix) === normalizeAIConfigProviderId(providerId)
    ? rest.join('/')
    : modelId
}

export function normalizeAIConfigProviderId(raw?: string | null): string {
  const normalized = normalizeText(normalizeAIConfigResourceId(raw))
  if (!normalized) return ''

  for (const entry of AI_CONFIG_PROVIDER_CATALOG) {
    if (entry.id === normalized || (entry.aliases ?? []).includes(normalized)) {
      return entry.id
    }
  }

  return normalized
}

function aiConfigProviderRowId(row: Partial<AIProviderRow> & Record<string, unknown>): string {
  return aiConfigResourceRefToProviderId(String(row.id ?? row['@id'] ?? ''))
}

function aiConfigCredentialProviderId(row: Partial<CredentialRow> & Record<string, unknown>): string {
  return aiConfigResourceRefToProviderId(String(row.provider ?? row.id ?? ''))
}

function aiConfigModelProviderId(row: Partial<AIModelRow> & Record<string, unknown>): string {
  return aiConfigResourceRefToProviderId(String(row.isProvidedBy ?? ''))
}

function normalizeAIConfigModelStorageId(raw: string | null | undefined, providerId: string): string {
  return aiConfigResourceRefToModelId(raw, providerId)
}

function buildAIConfigModelStorageId(providerId: string, modelId: string): string {
  return aiModelResource.buildId({
    id: modelId,
    isProvidedBy: aiConfigProviderRef(providerId),
  })
}

export function sameAIConfigProviderFamily(left?: string | null, right?: string | null): boolean {
  const normalizedLeft = normalizeAIConfigProviderId(left)
  const normalizedRight = normalizeAIConfigProviderId(right)
  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight
}

export function getAIConfigProviderFamilyIds(providerId: string): string[] {
  const metadata = getAIConfigProviderMetadata(providerId)
  return [metadata.id, ...(metadata.aliases ?? [])]
}

export function getAIConfigProviderIdsForBackend(backend: string): string[] {
  return getAIConfigProviderFamilyIds(backend)
}

export function getAIConfigDefaultBaseUrl(providerId: string): string | undefined {
  return getAIConfigProviderMetadata(providerId).defaultBaseUrl
}

export function getDefaultAIConfigCredentialId(providerId: string): string {
  return `${normalizeAIConfigProviderId(providerId)}-default`
}

export function createAIConfigCredentialId(): string {
  const random = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 18)
  return `cred_${random}`
}

export function aiConfigProviderRef(providerId: string): string {
  const provider = normalizeAIConfigProviderId(providerId)
  return provider ? aiProviderResource.buildId({ id: provider }) : provider
}

export function aiConfigModelRef(providerId: string, modelId?: string): string {
  if (modelId === undefined) {
    return normalizeAIConfigResourceId(providerId)
  }

  const provider = normalizeAIConfigProviderId(providerId)
  const model = normalizeAIConfigModelStorageId(modelId, provider)
  return provider && model ? buildAIConfigModelStorageId(provider, model) : model
}

export function selectAIConfigCredential(
  providerId: string,
  credentialRows: Array<Partial<CredentialRow> & Record<string, unknown>>,
  providerRows: Array<Partial<AIProviderRow> & Record<string, unknown>> = [],
  options: { rotationPolicy?: string } = {},
): AIConfigCredentialSelection | undefined {
  const provider = normalizeAIConfigProviderId(providerId)
  if (!provider) return undefined

  const candidates = credentialRows.filter((row) => {
    const rowProvider = normalizeOptionalText(row.provider) ?? normalizeOptionalText(row.id)
    return sameAIConfigProviderFamily(rowProvider, provider)
      && (normalizeOptionalText(row.service)?.toLowerCase() ?? 'ai') === 'ai'
      && (normalizeOptionalText(row.status)?.toLowerCase() ?? 'active') === 'active'
      && Boolean(normalizeOptionalText(row.apiKey))
  })

  if (candidates.length === 0) return undefined

  const sortByRotation = (
    left: Partial<CredentialRow> & Record<string, unknown>,
    right: Partial<CredentialRow> & Record<string, unknown>,
  ) => {
    const leftLastUsed = normalizeOptionalTimestamp(left.lastUsedAt)
    const rightLastUsed = normalizeOptionalTimestamp(right.lastUsedAt)
    if (leftLastUsed !== rightLastUsed) return leftLastUsed - rightLastUsed

    const leftFailCount = normalizeOptionalInteger(left.failCount)
    const rightFailCount = normalizeOptionalInteger(right.failCount)
    if (leftFailCount !== rightFailCount) return leftFailCount - rightFailCount

    return normalizeAIConfigResourceId(String(left.id ?? left['@id'] ?? ''))
      .localeCompare(normalizeAIConfigResourceId(String(right.id ?? right['@id'] ?? '')))
  }

  const providerRow = providerRows.find((row) => sameAIConfigProviderFamily(aiConfigProviderRowId(row), provider))
  const rotationPolicy = normalizeRotationPolicy(options.rotationPolicy ?? providerRow?.rotationPolicy)
  const defaults = rotationPolicy === 'round_robin'
    ? []
    : candidates.filter((row) => normalizeOptionalBoolean(row.isDefault))
  const credential = [...(defaults.length > 0 ? defaults : candidates)].sort(sortByRotation)[0]
  const apiKey = normalizeOptionalText(credential.apiKey)
  if (!apiKey) return undefined

  return {
    providerId: provider,
    credential,
    credentialId: normalizeAIConfigResourceId(
      normalizeOptionalText(credential.id) ?? normalizeOptionalText(credential['@id']),
    ),
    credentialResourceId: credentialStorageId(credential),
    credentialLabel: normalizeOptionalText(credential.label),
    apiKey,
    baseUrl:
      normalizeOptionalText(credential.baseUrl)
      ?? normalizeOptionalText(providerRow?.baseUrl)
      ?? getAIConfigDefaultBaseUrl(provider),
    proxyUrl: normalizeOptionalText(credential.proxyUrl) ?? normalizeOptionalText(providerRow?.proxyUrl),
    isDefault: normalizeOptionalBoolean(credential.isDefault),
  }
}

export function selectAIConfigCredentialForBackend(
  backend: string,
  credentialRows: Array<Partial<CredentialRow> & Record<string, unknown>>,
  providerRows: Array<Partial<AIProviderRow> & Record<string, unknown>> = [],
): AIConfigBackendCredentialSelection | undefined {
  const normalizedBackend = normalizeBackendId(backend)
  if (!normalizedBackend) return undefined

  const explicitProviderIds = providerRows
    .filter((row) => aiConfigProviderSupportsBackend(row, normalizedBackend))
    .map(aiConfigProviderRowId)
    .filter(Boolean)

  const familyProviderIds = getAIConfigProviderIdsForBackend(normalizedBackend)
  const providerIds = uniqueStrings([...explicitProviderIds, ...familyProviderIds])

  for (const providerId of providerIds) {
    const providerRow = providerRows.find((row) => sameAIConfigProviderFamily(aiConfigProviderRowId(row), providerId))
    const selected = selectAIConfigCredential(providerId, credentialRows, providerRows, {
      rotationPolicy: normalizeOptionalText(providerRow?.rotationPolicy),
    })
    if (!selected) continue
    return {
      ...selected,
      backend: normalizedBackend,
    }
  }

  return undefined
}

async function listAIConfigCredentialRows(
  db: AIConfigRepositoryDb,
): Promise<Array<Partial<CredentialRow> & Record<string, unknown>>> {
  return await db.select().from(credentialResource).execute() as Array<Partial<CredentialRow> & Record<string, unknown>>
}

async function findAIConfigProviderRows(
  db: AIConfigRepositoryDb,
  providerIds: string[],
): Promise<Array<Partial<AIProviderRow> & Record<string, unknown>>> {
  const rows: Array<Partial<AIProviderRow> & Record<string, unknown>> = []
  const seen = new Set<string>()

  for (const providerId of providerIds) {
    for (const candidate of aiConfigProviderIdCandidates(providerId)) {
      if (!candidate || seen.has(candidate)) continue
      seen.add(candidate)
      const row = await db.findById<Partial<AIProviderRow> & Record<string, unknown>>(aiProviderResource, candidate)
        .catch((error) => {
          if (isMissingAIConfigExactReadError(error)) {
            return null
          }
          throw error
        })
      if (row) {
        rows.push(row)
        break
      }
    }
  }

  return rows
}

function collectAIConfigProviderIdsForBackend(
  backend: string,
  credentialRows: Array<Partial<CredentialRow> & Record<string, unknown>>,
): string[] {
  const ids = new Set(getAIConfigProviderIdsForBackend(backend))

  for (const row of credentialRows) {
    const providerId = aiConfigCredentialProviderId(row)
    if (providerId) ids.add(providerId)
  }

  return Array.from(ids)
}

function aiConfigProviderIdCandidates(providerId: string): string[] {
  const normalized = normalizeAIConfigResourceId(providerId) || providerId
  return uniqueStrings([
    aiProviderResource.buildId({ id: normalized }),
    normalized,
  ])
}

function isMissingAIConfigExactReadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const message = 'message' in error && typeof error.message === 'string' ? error.message : ''
  return /404|not found|missing/i.test(message)
}

export const aiConfigRepository = {
  async loadCredentialForBackend(
    db: AIConfigRepositoryDb,
    backend: string,
  ): Promise<AIConfigBackendCredentialSelection | undefined> {
    const credentialRows = await listAIConfigCredentialRows(db)
    const providerRows = await findAIConfigProviderRows(
      db,
      collectAIConfigProviderIdsForBackend(backend, credentialRows),
    )
    return selectAIConfigCredentialForBackend(backend, credentialRows, providerRows)
  },

  async markCredentialUsed(
    db: AIConfigRepositoryDb,
    selection: Pick<AIConfigCredentialSelection, 'credentialId' | 'credentialResourceId'> | undefined,
    usedAt = new Date(),
  ): Promise<void> {
    const resourceId = selection?.credentialResourceId ?? selection?.credentialId
    if (!resourceId) return
    await db.updateById(credentialResource, resourceId, { lastUsedAt: usedAt })
  },
}

// Compatibility aliases for older app/CLI call sites. New code should prefer
// `aiConfigProviderRef` / `aiConfigModelRef`, which match current resource schemas.
export function aiConfigProviderUri(providerId: string): string {
  return aiConfigProviderRef(providerId)
}

export function aiConfigModelUri(modelId: string, providerId?: string): string {
  return providerId
    ? aiConfigModelRef(providerId, modelId)
    : normalizeAIConfigResourceId(modelId)
}

export function buildAIConfigProviderStateMap(options: BuildAIConfigProviderStateMapOptions): Record<string, AIConfigProviderState> {
  const catalog = options.catalog ?? AI_CONFIG_PROVIDER_CATALOG
  const fallbackToCatalogModels = options.fallbackToCatalogModels ?? true
  const states: Record<string, AIConfigProviderState> = {}
  const knownIds = collectKnownProviderIds(catalog)

  const providerMap = new Map<string, Partial<AIProviderRow> & Record<string, unknown>>()
  for (const row of options.providerRows) {
    const providerId = aiConfigProviderRowId(row)
    if (!providerId) continue
    const previous = providerMap.get(providerId) ?? {}
    providerMap.set(providerId, { ...previous, ...row })
  }

  const credentialProviderIds = new Set<string>()
  for (const row of options.credentialRows) {
    const providerId = aiConfigCredentialProviderId(row)
    if (!providerId) continue
    credentialProviderIds.add(providerId)
  }

  const modelMap = new Map<string, AIConfigModel[]>()
  for (const row of options.modelRows) {
    const providerId = aiConfigModelProviderId(row)
    if (!providerId) continue

    const modelId = normalizeAIConfigModelStorageId(String(row.id ?? row['@id'] ?? ''), providerId)
    if (!modelId) continue

    const list = modelMap.get(providerId) ?? []
    const runtimeCapabilities = filterAIConfigRuntimeCapabilities([
      ...(Array.isArray(row.runtimeCapabilities) ? row.runtimeCapabilities : []),
      ...(Array.isArray(row.capabilities) ? row.capabilities : []),
    ])
    const semanticCapabilities = filterAIModelCapabilityUris(row.capabilities)
      .map(toAIModelCapabilityName)
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    list.push({
      id: modelId,
      name: typeof row.displayName === 'string' && row.displayName.trim() ? row.displayName : modelId,
      enabled: (typeof row.status === 'string' ? row.status : 'active') !== 'inactive',
      capabilities: runtimeCapabilities.length > 0 ? runtimeCapabilities : semanticCapabilities,
      modelType: row.rdfType
        ? toAIModelClassName(row.rdfType)
        : normalizeAIConfigModelType(row.modelType),
      isCustom: !(resolveCatalogEntry(providerId, catalog)?.defaultModels ?? []).includes(modelId),
    })
    modelMap.set(providerId, list)
  }

  const providerIds = new Set<string>()
  for (const entry of catalog) providerIds.add(entry.id)
  for (const providerId of providerMap.keys()) providerIds.add(providerId)
  for (const providerId of credentialProviderIds) providerIds.add(providerId)
  for (const providerId of modelMap.keys()) providerIds.add(providerId)

  for (const providerId of providerIds) {
    if (!knownIds.has(providerId) && !providerMap.has(providerId) && !credentialProviderIds.has(providerId) && !modelMap.has(providerId)) {
      continue
    }

    const metadata = resolveCatalogEntry(providerId, catalog) ?? getAIConfigProviderMetadata(providerId)
    const providerRow = providerMap.get(providerId)
    const credentialSelection = selectAIConfigCredential(providerId, options.credentialRows, options.providerRows)
    const persistedModels = modelMap.get(providerId) ?? []
    const models = persistedModels.length > 0 || !fallbackToCatalogModels
      ? persistedModels
      : (metadata.defaultModels ?? []).map((modelId) => ({
          id: modelId,
          name: modelId,
          enabled: true,
          capabilities: [],
          modelType: metadata.defaultModelType ?? 'chat',
        }))

    const selectedModelIds = normalizeAIConfigModelStorageIds(providerRow?.hasModel, providerId)
    const resolvedSelectedModelIds = selectedModelIds.length > 0
      ? selectedModelIds
      : preferredSelectedModelIds(models)
    const selectedModelId = resolvedSelectedModelIds[0]

    states[providerId] = {
      id: providerId,
      enabled: Boolean(credentialSelection),
      apiKey: credentialSelection?.apiKey,
      baseUrl: credentialSelection?.baseUrl || (typeof providerRow?.baseUrl === 'string' && providerRow.baseUrl) || metadata.defaultBaseUrl,
      credentialId: credentialSelection?.credentialId,
      credentialLabel: credentialSelection?.credentialLabel,
      credentialIsDefault: credentialSelection?.isDefault,
      models,
      selectedModelIds: resolvedSelectedModelIds.length > 0 ? resolvedSelectedModelIds : undefined,
      selectedModelId: selectedModelId || undefined,
      capabilities: getAIConfigProviderCapabilities(providerId, providerRow?.capabilities),
    }
  }

  return states
}

export function buildAIConfigMutationPlan(input: {
  providerId: string
  currentProviderRows: Array<Partial<AIProviderRow> & Record<string, unknown>>
  currentCredentialRows: Array<Partial<CredentialRow> & Record<string, unknown>>
  currentModelRows: Array<Partial<AIModelRow> & Record<string, unknown>>
  updates: AIConfigUpdate
}): AIConfigMutationPlan {
  const providerId = normalizeAIConfigProviderId(input.providerId)
  const metadata = getAIConfigProviderMetadata(providerId)
  const existingProvider = input.currentProviderRows.find((row) => sameAIConfigProviderFamily(aiConfigProviderRowId(row), providerId))
  const existingCredential =
    (input.updates.credentialId
      ? input.currentCredentialRows.find((row) =>
          normalizeAIConfigResourceId(String(row.id ?? row['@id'] ?? '')) === normalizeAIConfigResourceId(input.updates.credentialId),
        )
      : undefined)
    ?? selectAIConfigCredential(providerId, input.currentCredentialRows, input.currentProviderRows)?.credential
    ?? input.currentCredentialRows.find((row) => sameAIConfigProviderFamily(aiConfigCredentialProviderId(row), providerId))
  const existingModels = input.currentModelRows.filter((row) => sameAIConfigProviderFamily(aiConfigModelProviderId(row), providerId))
  const hasProviderUpdate =
    input.updates.enabled !== undefined ||
    input.updates.apiKey !== undefined ||
    input.updates.baseUrl !== undefined ||
    input.updates.supportsBackend !== undefined ||
    input.updates.rotationPolicy !== undefined ||
    input.updates.capabilities !== undefined ||
    input.updates.models !== undefined
  const hasCredentialUpdate =
    input.updates.enabled !== undefined ||
    input.updates.apiKey !== undefined ||
    input.updates.credentialId !== undefined ||
    input.updates.credentialLabel !== undefined ||
    input.updates.credentialBaseUrl !== undefined ||
    input.updates.baseUrl !== undefined

  let providerPayload: AIProviderInsert | undefined
  let credentialPayload: CredentialInsert | undefined
  const modelUpserts: AIModelInsert[] = []
  const modelDeleteIds: string[] = []

  if (hasProviderUpdate) {
    const selectedModelIds = input.updates.models !== undefined
      ? uniqueStrings(input.updates.models.filter((model) => model.enabled).map((model) => model.id))
          .map((modelId) => normalizeAIConfigModelStorageId(modelId, providerId))
          .filter(Boolean)
      : normalizeAIConfigModelStorageIds(existingProvider?.hasModel, providerId)

    providerPayload = {
      id: providerStorageId(existingProvider, providerId),
      baseUrl:
        input.updates.baseUrl ??
        (typeof existingProvider?.baseUrl === 'string' ? existingProvider.baseUrl : undefined) ??
        metadata.defaultBaseUrl,
      proxyUrl: typeof existingProvider?.proxyUrl === 'string' ? existingProvider.proxyUrl : undefined,
      hasModel: selectedModelIds.length > 0
        ? selectedModelIds.map((modelId) => aiConfigModelRef(providerId, modelId))
        : undefined,
      supportsBackend:
        input.updates.supportsBackend ??
        (typeof existingProvider?.supportsBackend === 'string' ? existingProvider.supportsBackend : undefined),
      rotationPolicy:
        input.updates.rotationPolicy ??
        (typeof existingProvider?.rotationPolicy === 'string' ? existingProvider.rotationPolicy : undefined),
      capabilities:
        input.updates.capabilities ??
        (Array.isArray(existingProvider?.capabilities)
          ? existingProvider.capabilities.filter((value): value is string => typeof value === 'string')
          : undefined),
    }
  }

  if (hasCredentialUpdate) {
    credentialPayload = {
      id:
        (input.updates.credentialId
          ? inputResourceId(input.updates.credentialId, (id) => credentialResource.buildId({ id }))
          : '') ||
        credentialStorageId(existingCredential) ||
        credentialResource.buildId({ id: getDefaultAIConfigCredentialId(providerId) }),
      provider: aiConfigProviderRef(providerId),
      service: typeof existingCredential?.service === 'string' && existingCredential.service ? existingCredential.service : 'ai',
      status:
        input.updates.enabled !== undefined
          ? input.updates.enabled
            ? 'active'
            : 'inactive'
          : typeof existingCredential?.status === 'string' && existingCredential.status
            ? existingCredential.status
            : 'active',
      apiKey:
        input.updates.apiKey ??
        (typeof existingCredential?.apiKey === 'string' ? existingCredential.apiKey : undefined),
      baseUrl:
        input.updates.credentialBaseUrl ??
        (input.updates.baseUrl !== undefined ? undefined : typeof existingCredential?.baseUrl === 'string' ? existingCredential.baseUrl : undefined),
      label:
        input.updates.credentialLabel ??
        (typeof existingCredential?.label === 'string' && existingCredential.label
          ? existingCredential.label
          : `${metadata.displayName} Key`),
      isDefault: existingCredential?.isDefault === undefined ? true : Boolean(existingCredential.isDefault),
    }
  }

  if (input.updates.models !== undefined) {
    const existingById = new Map(
      existingModels.map((row) => [
        normalizeAIConfigModelStorageId(String(row.id ?? row['@id'] ?? ''), providerId),
        row,
      ] as const),
    )
    const nextIds = new Set<string>()

    for (const model of input.updates.models) {
      const modelId = normalizeAIConfigModelStorageId(model.id, providerId)
      if (!modelId) continue
      nextIds.add(modelId)
      const existing = existingById.get(modelId)
      const now = new Date()
      const modelClass = toAIModelClassUri(model.modelType)
      if (!modelClass) {
        throw new Error(`Unsupported AI model class: ${String(model.modelType)}`)
      }
      const capabilities = [...new Set([
        AI_MODEL_CLASS_DEFAULT_CAPABILITY[modelClass],
        ...filterAIModelCapabilityUris(model.capabilities),
      ])]
      modelUpserts.push({
        id: modelStorageId(existing, providerId, modelId),
        displayName: model.name || modelId,
        rdfType: [modelClass],
        capabilities,
        runtimeCapabilities: filterAIConfigRuntimeCapabilities(model.capabilities),
        isProvidedBy: aiConfigProviderRef(providerId),
        status: model.enabled ? 'active' : 'inactive',
        createdAt: existingDate(existing?.createdAt) ?? now,
        updatedAt: now,
      })
    }

    for (const modelId of existingById.keys()) {
      if (!nextIds.has(modelId)) {
        modelDeleteIds.push(modelStorageId(existingById.get(modelId), providerId, modelId))
      }
    }
  }

  return {
    providerId,
    providerPayload,
    credentialPayload,
    modelUpserts,
    modelDeleteIds,
  }
}

export function buildAIConfigDisconnectPlan(input: {
  providerId: string
  currentCredentialRows: Array<Partial<CredentialRow> & Record<string, unknown>>
}): AIConfigDisconnectPlan {
  const providerId = normalizeAIConfigProviderId(input.providerId)
  const credentialDeleteIds: string[] = []
  const seen = new Set<string>()

  for (const row of input.currentCredentialRows) {
    const rowProvider = normalizeOptionalText(row.provider) ?? normalizeOptionalText(row.id)
    if (!sameAIConfigProviderFamily(rowProvider, providerId)) {
      continue
    }

    const id = credentialStorageId(row)
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    credentialDeleteIds.push(id)
  }

  return {
    providerId,
    credentialDeleteIds,
  }
}
