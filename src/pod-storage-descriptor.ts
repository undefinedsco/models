import { XPOD_CREDENTIAL } from './namespaces'

export type PodModelDescriptorSource = 'official' | 'verified-community' | 'developer' | 'user'
export type PodModelDescriptorTrustLevel = 'high' | 'medium' | 'low'
export type PodModelFieldType = 'string' | 'text' | 'number' | 'boolean' | 'timestamp' | 'uri' | 'json'
export type PodModelMergePolicy = 'create-only' | 'upsert' | 'patch' | 'append'

export interface PodModelFieldDescriptor {
  type: PodModelFieldType
  predicate: string
  required?: boolean
  secret?: boolean
  array?: boolean
  description?: string
}

export interface PodModelDescriptor {
  uri: string
  version: string
  source: PodModelDescriptorSource
  trustLevel: PodModelDescriptorTrustLevel
  namespace: string
  class: string
  resourceKind: string
  description: string
  storage: {
    base: string
    resourceIdPattern: string
    /**
     * @deprecated subjectTemplate exists only for legacy fragment layouts.
     * New descriptors should express exact base-relative ids through
     * resourceIdPattern and store those ids directly.
     */
    subjectTemplate?: string
  }
  fields: Record<string, PodModelFieldDescriptor>
  uniqueBy: string[]
  writableFields: string[]
  mergePolicy: PodModelMergePolicy
  examples: Array<{
    request: string
    match: Record<string, unknown>
  }>
}

export interface PodStorageMutationPlan {
  id: string
  schemaUri: string
  operation: 'upsert'
  resourceId: string
  resourceUri: string
  match: Record<string, unknown>
  set: Record<string, unknown>
  summary: string
}

export type PodStorageValidationResult =
  | { ok: true; plan: PodStorageMutationPlan }
  | { ok: false; error: { code: string; message: string } }

export type PodStorageCommitResult =
  | { ok: true; resource: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string } }

export interface PodSchemaClassEntry {
  schemaUri: string
  resourceKind: string
  class: string
  namespace: string
  source: PodModelDescriptorSource
  trustLevel: PodModelDescriptorTrustLevel
  description: string
}

export interface PodSchemaPredicateEntry {
  schemaUri: string
  field: string
  predicate: string
  type: PodModelFieldType
  required: boolean
  secret: boolean
  array: boolean
  description?: string
}

export interface PodSchemaSearchEntry {
  uri: string
  resourceKind: string
  class: string
  namespace: string
  source: PodModelDescriptorSource
  trustLevel: PodModelDescriptorTrustLevel
  description: string
  score: number
  matchedFields: string[]
}

export const credentialDescriptor: PodModelDescriptor = {
  uri: XPOD_CREDENTIAL.Credential,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: XPOD_CREDENTIAL.NAMESPACE,
  class: XPOD_CREDENTIAL.Credential,
  resourceKind: 'credential',
  description: 'Generic credential material required by runtimes, tools, MCP servers, and providers.',
  storage: {
    base: '/settings/credentials.ttl',
    resourceIdPattern: '#{id}',
    subjectTemplate: '#{id}',
  },
  fields: {
    id: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.term('id'),
      required: true,
      description: 'Local credential id.',
    },
    service: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.service,
      required: true,
      description: 'Credential service grouping, for example ai or infra.',
    },
    providerId: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.provider,
      required: true,
      description: 'Provider identifier such as openai or cloudflare.',
    },
    secretType: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.term('secretType'),
      required: true,
      description: 'Provider-specific secret kind such as api-key or tunnel-token.',
    },
    label: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.label,
      description: 'User-facing credential label.',
    },
    apiKey: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.apiKey,
      secret: true,
      description: 'Secret token or API key material.',
    },
    status: {
      type: 'string',
      predicate: XPOD_CREDENTIAL.status,
      description: 'Credential health status.',
    },
  },
  uniqueBy: ['service', 'providerId', 'secretType'],
  writableFields: ['label', 'apiKey', 'status'],
  mergePolicy: 'upsert',
  examples: [
    {
      request: '保存 Cloudflare tunnel token',
      match: {
        service: 'infra',
        providerId: 'cloudflare',
        secretType: 'tunnel-token',
      },
    },
    {
      request: '保存 OpenAI API key',
      match: {
        service: 'ai',
        providerId: 'openai',
        secretType: 'api-key',
      },
    },
  ],
}

export const officialPodModelDescriptors = [credentialDescriptor] as const

export function createPodModelDescriptorRegistry(
  descriptors: readonly PodModelDescriptor[] = officialPodModelDescriptors,
) {
  const byUri = new Map(descriptors.map((descriptor) => [descriptor.uri, descriptor]))

  return {
    list(filter: { source?: PodModelDescriptorSource; resourceKind?: string } = {}): PodModelDescriptor[] {
      return descriptors.filter((descriptor) => {
        if (filter.source && descriptor.source !== filter.source) return false
        if (filter.resourceKind && descriptor.resourceKind !== filter.resourceKind) return false
        return true
      })
    },

    describe(uri: string): PodModelDescriptor | null {
      return byUri.get(uri) ?? null
    },
  }
}

export const podSchema = createPodSchema()

export function createPodSchema(
  registry = createPodModelDescriptorRegistry(),
) {
  const resolveDescriptors = (input: { uri?: string; schemaUri?: string } = {}) => {
    const uri = input.uri ?? input.schemaUri
    if (!uri) return registry.list()
    const descriptor = registry.describe(uri)
    return descriptor ? [descriptor] : []
  }

  return {
    list: registry.list,
    describe(uriOrInput: string | { uri: string } | { schemaUri: string }) {
      const uri = typeof uriOrInput === 'string'
        ? uriOrInput
        : 'uri' in uriOrInput
          ? uriOrInput.uri
          : uriOrInput.schemaUri
      return registry.describe(uri)
    },
    classes(input: { uri?: string; schemaUri?: string } = {}): PodSchemaClassEntry[] {
      return resolveDescriptors(input).map((descriptor) => ({
        schemaUri: descriptor.uri,
        resourceKind: descriptor.resourceKind,
        class: descriptor.class,
        namespace: descriptor.namespace,
        source: descriptor.source,
        trustLevel: descriptor.trustLevel,
        description: descriptor.description,
      }))
    },
    search(input: {
      query: string
      source?: PodModelDescriptorSource
      resourceKind?: string
      limit?: number
    }): PodSchemaSearchEntry[] {
      const terms = normalizeSearchTerms(input.query)
      if (terms.length === 0) return []

      return registry.list({
        source: input.source,
        resourceKind: input.resourceKind,
      })
        .map((descriptor) => scoreDescriptorSearch(descriptor, terms))
        .filter((entry): entry is PodSchemaSearchEntry => entry !== null)
        .sort((a, b) => b.score - a.score || a.uri.localeCompare(b.uri))
        .slice(0, Math.max(1, input.limit ?? 10))
    },
    predicates(input: { uri?: string; schemaUri?: string; field?: string } = {}): PodSchemaPredicateEntry[] {
      return resolveDescriptors(input).flatMap((descriptor) => (
        Object.entries(descriptor.fields)
          .filter(([field]) => !input.field || field === input.field)
          .map(([field, descriptorField]) => ({
            schemaUri: descriptor.uri,
            field,
            predicate: descriptorField.predicate,
            type: descriptorField.type,
            required: Boolean(descriptorField.required),
            secret: Boolean(descriptorField.secret),
            array: Boolean(descriptorField.array),
            description: descriptorField.description,
          }))
      ))
    },
  }
}

export function createPodStorage(
  registry = createPodModelDescriptorRegistry(),
  store = new Map<string, Record<string, unknown>>(),
) {
  const plans = new Map<string, PodStorageMutationPlan>()

  return {
    validate(input: {
      schemaUri?: string
      operation: 'upsert'
      match: Record<string, unknown>
      set?: Record<string, unknown>
    }): PodStorageValidationResult {
      const schemaUri = input.schemaUri
      if (!schemaUri) return invalid('schema_uri_required', 'Missing schemaUri')
      const descriptor = registry.describe(schemaUri)
      if (!descriptor) return invalid('descriptor_not_found', `Descriptor not found: ${schemaUri}`)
      if (input.operation !== 'upsert') return invalid('unsupported_operation', `Unsupported operation: ${input.operation}`)

      const missingKeys = descriptor.uniqueBy.filter((field) => !input.match[field])
      if (missingKeys.length > 0) {
        return invalid('missing_match_fields', `Missing match fields: ${missingKeys.join(', ')}`)
      }

      const set = input.set ?? {}
      const invalidSetFields = Object.keys(set).filter((field) => !descriptor.writableFields.includes(field))
      if (invalidSetFields.length > 0) {
        return invalid('invalid_set_fields', `Fields are not writable: ${invalidSetFields.join(', ')}`)
      }

      const resourceId = buildResourceId(descriptor, input.match)
      const plan: PodStorageMutationPlan = {
        id: `plan_${resourceId.replace(/[^a-zA-Z0-9_.-]+/g, '-')}`,
        schemaUri: descriptor.uri,
        operation: input.operation,
        resourceId,
        resourceUri: buildResourceUri(descriptor, resourceId),
        match: input.match,
        set,
        summary: `Upsert ${descriptor.resourceKind} for ${descriptor.uniqueBy.map((field) => input.match[field]).join('/')}`,
      }
      plans.set(plan.id, plan)
      return { ok: true, plan }
    },

    commit(input: { planId: string }): PodStorageCommitResult {
      const plan = plans.get(input.planId)
      if (!plan) return invalid('plan_not_found', `Plan not found: ${input.planId}`)

      const existing = store.get(plan.resourceUri) ?? {}
      const resource = {
        ...existing,
        ...plan.match,
        ...plan.set,
        schemaUri: plan.schemaUri,
        resourceId: plan.resourceId,
        resourceUri: plan.resourceUri,
      }
      store.set(plan.resourceUri, resource)
      return { ok: true, resource }
    },

    read(input: { resourceUri: string }): PodStorageCommitResult {
      const resource = store.get(input.resourceUri)
      if (!resource) return invalid('resource_not_found', `Resource not found: ${input.resourceUri}`)
      return { ok: true, resource }
    },

    store,
    plans,
  }
}

function invalid(code: string, message: string): PodStorageValidationResult & PodStorageCommitResult {
  return {
    ok: false,
    error: { code, message },
  }
}

function buildResourceId(descriptor: PodModelDescriptor, match: Record<string, unknown>): string {
  const raw = descriptor.uniqueBy.map((field) => String(match[field])).join('-')
  const localId = raw.replace(/[^a-zA-Z0-9_.-]+/g, '-')
  return descriptor.storage.resourceIdPattern.replace('{id}', localId)
}

function buildResourceUri(descriptor: PodModelDescriptor, resourceId: string): string {
  return `${descriptor.storage.base}${resourceId}`
}

function normalizeSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;:/#._-]+/u)
    .map((term) => term.trim())
    .filter(Boolean)
}

function scoreDescriptorSearch(
  descriptor: PodModelDescriptor,
  terms: string[],
): PodSchemaSearchEntry | null {
  const matchedFields = new Set<string>()
  let score = 0

  const match = (field: string, value: string | undefined, weight: number) => {
    if (!value) return
    const normalized = value.toLowerCase()
    for (const term of terms) {
      if (!normalized.includes(term)) continue
      matchedFields.add(field)
      score += weight
    }
  }

  match('uri', descriptor.uri, 10)
  match('class', descriptor.class, 10)
  match('namespace', descriptor.namespace, 4)
  match('resourceKind', descriptor.resourceKind, 8)
  match('description', descriptor.description, 4)
  match('storage', `${descriptor.storage.base}${descriptor.storage.resourceIdPattern}`, 3)

  for (const [fieldName, field] of Object.entries(descriptor.fields)) {
    match(`field:${fieldName}`, fieldName, 6)
    match(`predicate:${fieldName}`, field.predicate, 6)
    match(`description:${fieldName}`, field.description, 3)
  }

  for (const example of descriptor.examples) {
    match('example', example.request, 3)
    for (const [fieldName, value] of Object.entries(example.match)) {
      match(`example:${fieldName}`, String(value), 3)
    }
  }

  if (score <= 0) return null
  return {
    uri: descriptor.uri,
    resourceKind: descriptor.resourceKind,
    class: descriptor.class,
    namespace: descriptor.namespace,
    source: descriptor.source,
    trustLevel: descriptor.trustLevel,
    description: descriptor.description,
    score,
    matchedFields: [...matchedFields].sort(),
  }
}
