import type { AIModelInsert, AIModelRow } from '../ai-model.schema'
import { aiProviderResource, type AIProviderInsert, type AIProviderRow } from '../ai-provider.schema'
import { credentialResource } from '../credential.schema'
import type { CredentialInsert, CredentialRow } from '../credential.schema'

export interface AIConfigProviderCatalogEntry {
  id: string
  displayName: string
  aliases?: string[]
  defaultBaseUrl?: string
  defaultModels?: string[]
}

export interface AIConfigModel {
  id: string
  name: string
  enabled: boolean
  capabilities: string[]
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
  selectedModelId?: string
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
  updateById?(resource: unknown, id: string, data: Record<string, unknown>): Promise<unknown>
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

function preferredSelectedModelId(models: AIConfigModel[]): string | undefined {
  return models.find((model) => model.enabled)?.id ?? models[0]?.id
}

function existingDate(value: unknown): Date | undefined {
  return value instanceof Date ? value : undefined
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
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

export function aiConfigProviderRef(providerId: string): string {
  const provider = normalizeAIConfigProviderId(providerId)
  return provider ? `/settings/providers/${provider}.ttl` : provider
}

export function aiConfigModelRef(providerId: string, modelId?: string): string {
  if (modelId === undefined) {
    return normalizeAIConfigResourceId(providerId)
  }

  const provider = normalizeAIConfigProviderId(providerId)
  const model = normalizeAIConfigModelStorageId(modelId, provider)
  return provider && model ? `/settings/providers/${provider}.ttl#${model}` : model
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
    normalized,
    `${normalized}.ttl`,
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
    selection: Pick<AIConfigCredentialSelection, 'credentialId'> | undefined,
    usedAt = new Date(),
  ): Promise<void> {
    if (!selection?.credentialId || !db.updateById) return
    await db.updateById(credentialResource, selection.credentialId, { lastUsedAt: usedAt })
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
    list.push({
      id: modelId,
      name: typeof row.displayName === 'string' && row.displayName.trim() ? row.displayName : modelId,
      enabled: (typeof row.status === 'string' ? row.status : 'active') !== 'inactive',
      capabilities: [],
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
        }))

    const selectedModelId = normalizeAIConfigModelStorageId(
      typeof providerRow?.hasModel === 'string' ? providerRow.hasModel : '',
      providerId,
    ) || preferredSelectedModelId(models)

    states[providerId] = {
      id: providerId,
      enabled: Boolean(credentialSelection),
      apiKey: credentialSelection?.apiKey,
      baseUrl: credentialSelection?.baseUrl || (typeof providerRow?.baseUrl === 'string' && providerRow.baseUrl) || metadata.defaultBaseUrl,
      credentialId: credentialSelection?.credentialId,
      credentialLabel: credentialSelection?.credentialLabel,
      credentialIsDefault: credentialSelection?.isDefault,
      models,
      selectedModelId: selectedModelId || undefined,
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
    const selectedModelId = input.updates.models
      ? preferredSelectedModelId(input.updates.models)
      : normalizeAIConfigModelStorageId(typeof existingProvider?.hasModel === 'string' ? existingProvider.hasModel : '', providerId)

    providerPayload = {
      id: providerId,
      baseUrl:
        input.updates.baseUrl ??
        (typeof existingProvider?.baseUrl === 'string' ? existingProvider.baseUrl : undefined) ??
        metadata.defaultBaseUrl,
      proxyUrl: typeof existingProvider?.proxyUrl === 'string' ? existingProvider.proxyUrl : undefined,
      hasModel: selectedModelId ? aiConfigModelRef(providerId, selectedModelId) : undefined,
      supportsBackend:
        input.updates.supportsBackend ??
        (typeof existingProvider?.supportsBackend === 'string' ? existingProvider.supportsBackend : undefined),
      rotationPolicy:
        input.updates.rotationPolicy ??
        (typeof existingProvider?.rotationPolicy === 'string' ? existingProvider.rotationPolicy : undefined),
    }
  }

  if (hasCredentialUpdate) {
    credentialPayload = {
      id:
        normalizeAIConfigResourceId(input.updates.credentialId) ||
        normalizeAIConfigResourceId(typeof existingCredential?.id === 'string' ? existingCredential.id : '') ||
        getDefaultAIConfigCredentialId(providerId),
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
      modelUpserts.push({
        id: modelId,
        displayName: model.name || modelId,
        modelType: 'chat',
        isProvidedBy: aiConfigProviderRef(providerId),
        status: model.enabled ? 'active' : 'inactive',
        createdAt: existingDate(existing?.createdAt) ?? now,
        updatedAt: now,
      })
    }

    for (const modelId of existingById.keys()) {
      if (!nextIds.has(modelId)) {
        modelDeleteIds.push(modelId)
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

    const id = normalizeAIConfigResourceId(
      normalizeOptionalText(row.id) ?? normalizeOptionalText(row['@id']),
    )
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
