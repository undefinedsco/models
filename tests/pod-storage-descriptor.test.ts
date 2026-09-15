import { describe, expect, it } from 'vitest'
import {
  aiModelDescriptor,
  aiModelResource,
  aiProviderDescriptor,
  aiProviderResource,
  approvalDescriptor,
  captureCandidateDescriptor,
  captureEventDescriptor,
  chatDescriptor,
  contactDescriptor,
  credentialDescriptor,
  credentialResource,
  createPodModelDescriptorRegistry,
  createPodSchema,
  createPodStorage,
  issueDescriptor,
  inputRequestDescriptor,
  messageDescriptor,
  officialPodModelDescriptors,
  RDF,
  runStepDescriptor,
  solidResources,
  threadDescriptor,
  DCTerms,
  SIOC,
  UDFS,
  type PodModelDescriptor,
} from '../src'

function columnsOf(resource: unknown): Record<string, any> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, any>
}

function resourceConfigOf(resource: unknown): { base?: string; type?: string; namespace?: unknown } {
  return ((resource as any)?._?.config ?? (resource as any)?.config) as {
    base?: string
    type?: string
    namespace?: unknown
  }
}

function resourceNameOf(resource: unknown): string {
  return String((resource as any)?._?.name ?? (resource as any)?.config?.name ?? '')
}

function predicateOf(resource: unknown, field: string): string {
  const column = columnsOf(resource)[field]
  return column?.getPredicate?.(resourceConfigOf(resource).namespace)
    ?? (typeof column?.options?.predicate === 'string' ? column.options.predicate : '')
}

function idDefaultOf(resource: unknown): string {
  const value = columnsOf(resource).id?.options?.defaultValue
  return typeof value === 'string' ? value : ''
}

/** Descriptor `type` follows the column's element type, including array columns. */
function allowedDescriptorTypes(column: Record<string, any>): string[] {
  const dataType = column?.dataType === 'array' ? column?.options?.baseType : column?.dataType
  switch (dataType) {
    case 'string':
      // drizzle-solid models `string()` and `text()` columns with the same
      // dataType; the descriptor type picks literal repeatability instead.
      return ['string', 'text']
    case 'datetime':
      return ['timestamp']
    case 'integer':
    case 'real':
      return ['number']
    default:
      return [String(dataType)]
  }
}

const tableBackedDescriptors: ReadonlyArray<{
  name: string
  descriptor: PodModelDescriptor
  resource: unknown
}> = [
  { name: 'credential', descriptor: credentialDescriptor, resource: credentialResource },
  { name: 'provider', descriptor: aiProviderDescriptor, resource: aiProviderResource },
  { name: 'model', descriptor: aiModelDescriptor, resource: aiModelResource },
]

describe('pod storage descriptors', () => {
  it('describes the official credential model', () => {
    expect(credentialDescriptor.uri).toBe(UDFS.Credential)
    expect(credentialDescriptor.storage.base).toBe('/settings/credentials.ttl')
    expect(credentialDescriptor.storage.resourceIdPattern).toBe('#{id}')
    expect(credentialDescriptor.uniqueBy).toEqual(['id'])
    expect(credentialDescriptor.fields.apiKey.secret).toBe(true)
    expect(credentialDescriptor.fields.storageMode).toMatchObject({
      type: 'string',
      predicate: UDFS.storageMode,
    })
    expect(credentialDescriptor.fields.storageMode.secret).toBeUndefined()
    expect(credentialDescriptor.fields.secretPayload).toMatchObject({
      type: 'string',
      predicate: UDFS.secretPayload,
      secret: true,
    })
    expect(credentialDescriptor.fields.encryptedSecret).toMatchObject({
      type: 'string',
      predicate: UDFS.encryptedSecret,
      secret: true,
    })
    expect(credentialDescriptor.fields.wrappedDataKey).toMatchObject({
      type: 'string',
      predicate: UDFS.wrappedDataKey,
      secret: true,
    })
    expect(credentialDescriptor.fields.encryptionAlgorithm).toMatchObject({
      type: 'string',
      predicate: UDFS.encryptionAlgorithm,
    })
    expect(credentialDescriptor.fields.keyVersion).toMatchObject({
      type: 'string',
      predicate: UDFS.keyVersion,
    })
    expect(credentialDescriptor.fields.provider).toMatchObject({
      type: 'uri',
      predicate: UDFS.provider,
    })
    expect(credentialDescriptor.fields.scopes).toMatchObject({
      type: 'text',
      predicate: UDFS.scopes,
      array: true,
    })
    expect(credentialDescriptor.fields.metadata).toMatchObject({
      type: 'json',
      predicate: UDFS.metadata,
    })
    expect(credentialDescriptor.fields.oauthAccessToken.secret).toBe(true)
    expect(credentialDescriptor.fields.oauthRefreshToken.secret).toBe(true)
    expect(credentialDescriptor.fields.metadata.secret).toBeUndefined()
  })

  it('lists local descriptors without natural-language matching', () => {
    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    expect(podSchema.list().map((descriptor) => descriptor.uri)).toEqual(
      officialPodModelDescriptors.map((descriptor) => descriptor.uri),
    )
    expect(podSchema.describe({ uri: UDFS.Credential })?.examples[0]).toEqual({
      request: '保存 Cloudflare tunnel token',
      match: {
        id: 'cloudflare-5f2c9a1e',
      },
    })
  })

  it('registers core chat/runtime descriptors as official models', () => {
    expect(officialPodModelDescriptors).toEqual(expect.arrayContaining([
      contactDescriptor,
      chatDescriptor,
      threadDescriptor,
      messageDescriptor,
    ]))
    expect(threadDescriptor.fields.parent.predicate).toBe(SIOC.has_parent)
    expect(messageDescriptor.fields.parent.predicate).toBe(SIOC.has_parent)
    expect(messageDescriptor.fields.chat.predicate).toBeDefined()
    expect((messageDescriptor.fields as Record<string, unknown>).scope).toBeUndefined()
  })


  it('describes approval requests as claimable control resources', () => {
    expect(approvalDescriptor.uri).toBe(UDFS.ApprovalRequest)
    expect(approvalDescriptor.storage.base).toBe('/.data/approvals/')
    expect(approvalDescriptor.storage.resourceIdPattern).toBe('{id}')
    expect(approvalDescriptor.fields.status.predicate).toBe(UDFS.status)
    expect(approvalDescriptor.fields.leaseOwner.predicate).toBe(UDFS.leaseOwner)
    expect(approvalDescriptor.fields.leaseExpiresAt.predicate).toBe(UDFS.leaseExpiresAt)
    expect(approvalDescriptor.writableFields).toContain('leaseOwner')
    expect(approvalDescriptor.writableFields).toContain('leaseExpiresAt')
  })

  it('describes input requests separately from approval requests', () => {
    expect(inputRequestDescriptor.uri).toBe(UDFS.InputRequest)
    expect(inputRequestDescriptor.storage.base).toBe('/.data/input-requests/')
    expect(inputRequestDescriptor.fields.prompt.required).toBe(true)
    expect(inputRequestDescriptor.fields.response.predicate).toBe(UDFS.response)
    expect(inputRequestDescriptor.fields.leaseOwner.predicate).toBe(UDFS.leaseOwner)

    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    const descriptor = podSchema.describe({ uri: UDFS.InputRequest })
    expect(descriptor?.resourceKind).toBe('input-request')
  })

  it('describes capture candidates and events without owning approval state', () => {
    expect(captureCandidateDescriptor.uri).toBe(UDFS.CaptureCandidate)
    expect(captureCandidateDescriptor.storage).toEqual({
      base: '/.data/capture/',
      resourceIdPattern: '{id}',
    })
    expect(captureCandidateDescriptor.fields.source.predicate).toBe(DCTerms.source)
    expect(captureCandidateDescriptor.fields.summary.predicate).toBe(DCTerms.abstract)
    expect(captureCandidateDescriptor.fields.suggestedType.predicate).toBe(UDFS.suggestedType)
    expect(captureCandidateDescriptor.fields.status.predicate).toBe(UDFS.status)
    expect((captureCandidateDescriptor.fields as Record<string, unknown>).approvalStatus).toBeUndefined()

    expect(captureEventDescriptor.uri).toBe(UDFS.CaptureEvent)
    expect(captureEventDescriptor.storage).toEqual({
      base: '/.data/capture/',
      resourceIdPattern: '{id}',
    })
    expect(captureEventDescriptor.fields.decision.predicate).toBe(UDFS.captureDecision)
    expect(captureEventDescriptor.fields.approval.predicate).toBe(UDFS.approval)
    expect(captureEventDescriptor.fields.inputRequest.predicate).toBe(UDFS.inputRequest)
    expect(captureEventDescriptor.mergePolicy).toBe('append')
  })

  it('keeps approval descriptor storage in exact-id mode', () => {
    expect(approvalDescriptor.storage).toEqual({
      base: '/.data/approvals/',
      resourceIdPattern: '{id}',
    })
    expect(inputRequestDescriptor.storage).toEqual({
      base: '/.data/input-requests/',
      resourceIdPattern: '{id}',
    })
  })

  it('keeps descriptors in exact-id mode without legacy subject templates', () => {
    for (const descriptor of officialPodModelDescriptors) {
      expect(descriptor.storage).not.toHaveProperty('subjectTemplate')
    }
    expect(issueDescriptor.storage).toEqual({
      base: '/.data/issues/',
      resourceIdPattern: '{id}',
    })
    expect(runStepDescriptor.fields.payload.predicate).toBe(UDFS.payload)
    expect((runStepDescriptor.fields as Record<string, unknown>).data).toBeUndefined()
  })

  it('queries RDF classes and field predicates deterministically', () => {
    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    expect(podSchema.classes({ uri: UDFS.Credential })).toEqual([
      expect.objectContaining({
        schemaUri: UDFS.Credential,
        resourceKind: 'credential',
        class: UDFS.Credential,
      }),
    ])
    expect(podSchema.predicates({ uri: UDFS.Credential, field: 'apiKey' })).toEqual([
      expect.objectContaining({
        schemaUri: UDFS.Credential,
        field: 'apiKey',
        predicate: UDFS.apiKey,
        secret: true,
      }),
    ])
  })

  it('validates and commits a descriptor-backed Cloudflare tunnel token plan', () => {
    const podStorage = createPodStorage()
    const validation = podStorage.validate({
      schemaUri: UDFS.Credential,
      operation: 'upsert',
      match: {
        id: 'cloudflare-tunnel-token',
      },
      set: {
        provider: 'https://pod.example/settings/providers/cloudflare.ttl',
        service: 'infra',
        offeringId: 'tunnel-token',
        label: 'Cloudflare Tunnel Token',
        status: 'active',
      },
    })

    expect(validation.ok).toBe(true)
    if (!validation.ok) throw new Error(validation.error.message)
    expect(validation.plan.resourceId).toBe('#cloudflare-tunnel-token')
    expect(validation.plan.resourceUri).toBe('/settings/credentials.ttl#cloudflare-tunnel-token')

    const committed = podStorage.commit({ planId: validation.plan.id })
    expect(committed.ok).toBe(true)
    if (!committed.ok) throw new Error(committed.error.message)
    expect(committed.resource).toMatchObject({
      schemaUri: UDFS.Credential,
      id: 'cloudflare-tunnel-token',
      provider: 'https://pod.example/settings/providers/cloudflare.ttl',
      service: 'infra',
      offeringId: 'tunnel-token',
      label: 'Cloudflare Tunnel Token',
      status: 'active',
      resourceId: '#cloudflare-tunnel-token',
      resourceUri: '/settings/credentials.ttl#cloudflare-tunnel-token',
    })
  })

  it('preserves caller-provided exact ids for exact-id descriptor storage', () => {
    const podStorage = createPodStorage()
    const validation = podStorage.validate({
      schemaUri: UDFS.CaptureCandidate,
      operation: 'upsert',
      match: {
        id: 'candidates/2026/06/16.ttl#capture_cli_smoke',
      },
      set: {
        source: 'https://pod.example/.data/chat/default/2026/06/16/messages.ttl#msg_1',
        summary: 'Potential project memory',
        confidence: 'medium',
      },
    })

    expect(validation.ok).toBe(true)
    if (!validation.ok) throw new Error(validation.error.message)
    expect(validation.plan.resourceId).toBe('candidates/2026/06/16.ttl#capture_cli_smoke')
    expect(validation.plan.resourceUri).toBe('/.data/capture/candidates/2026/06/16.ttl#capture_cli_smoke')
  })

  it('uses UDFS predicates as the primary credential contract', () => {
    expect(credentialDescriptor.uri).toBe(UDFS.Credential)
    expect(credentialDescriptor.fields.apiKey.predicate).toBe(UDFS.apiKey)
    expect(credentialDescriptor.fields.storageMode.predicate).toBe(UDFS.storageMode)
    expect(credentialDescriptor.fields.secretPayload.predicate).toBe(UDFS.secretPayload)
    expect(credentialDescriptor.fields.provider.predicate).toBe(UDFS.provider)
    expect(credentialDescriptor.fields.offeringId.predicate).toBe(UDFS.offeringId)
    expect(credentialDescriptor.fields.metadata.predicate).toBe(UDFS.metadata)
  })

  it('describes provider and model rows inside the provider document', () => {
    expect(aiProviderDescriptor.uri).toBe(UDFS.Provider)
    expect(aiProviderDescriptor.resourceKind).toBe('provider')
    expect(aiProviderDescriptor.storage).toEqual({
      base: '/settings/providers/',
      resourceIdPattern: '{key}.ttl',
    })
    expect(aiProviderDescriptor.uniqueBy).toEqual(['id'])
    expect(aiProviderDescriptor.fields.hasModel).toMatchObject({
      type: 'uri',
      predicate: UDFS.hasModel,
      array: true,
    })
    expect(aiProviderDescriptor.fields.defaultModel).toMatchObject({
      type: 'uri',
      predicate: UDFS.defaultModel,
    })

    expect(aiModelDescriptor.uri).toBe(UDFS.AIModel)
    expect(aiModelDescriptor.resourceKind).toBe('ai-model')
    expect(aiModelDescriptor.storage).toEqual({
      base: '/settings/providers/',
      resourceIdPattern: '{isProvidedBy.doc}#{key}',
    })
    expect(aiModelDescriptor.uniqueBy).toEqual(['id'])
    expect(aiModelDescriptor.fields.isProvidedBy).toMatchObject({
      type: 'uri',
      predicate: UDFS.isProvidedBy,
    })
    expect(aiModelDescriptor.fields.rdfType).toMatchObject({
      type: 'uri',
      predicate: RDF.type,
      array: true,
    })
    expect(aiModelDescriptor.fields.capabilities).toMatchObject({
      type: 'uri',
      predicate: UDFS.hasCapability,
      array: true,
    })
    expect(aiModelDescriptor.fields.runtimeCapabilities).toMatchObject({
      type: 'string',
      predicate: UDFS.capability,
      array: true,
    })

    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    expect(podSchema.describe(UDFS.Provider)).toBe(aiProviderDescriptor)
    expect(podSchema.describe(UDFS.AIModel)).toBe(aiModelDescriptor)
  })

  it('matches the provider document ids the products write for provider and model rows', () => {
    const providerId = aiProviderResource.buildId({ id: 'openai' })
    expect(`${aiProviderDescriptor.storage.base}${providerId}`).toBe('/settings/providers/openai.ttl')

    const providerIri = aiProviderResource.buildIri('https://pod.example/', { id: 'openai' })
    expect(`${aiModelDescriptor.storage.base}${aiModelResource.buildId({
      id: 'gpt-4o',
      isProvidedBy: providerIri,
    } as never)}`).toBe('/settings/providers/openai.ttl#gpt-4o')
  })
})

describe('pod storage descriptor column contracts', () => {
  it.each(tableBackedDescriptors)('covers every $name column and no invented field', ({ descriptor, resource }) => {
    expect(Object.keys(descriptor.fields).sort()).toEqual(Object.keys(columnsOf(resource)).sort())
  })

  it.each(tableBackedDescriptors)('keys $name rows on real columns only', ({ descriptor, resource }) => {
    const columns = columnsOf(resource)
    expect(descriptor.uniqueBy.length).toBeGreaterThan(0)
    for (const field of descriptor.uniqueBy) {
      expect(Object.keys(columns)).toContain(field)
    }
  })

  it.each(tableBackedDescriptors)('keeps $name writableFields inside fields without the row id', ({ descriptor }) => {
    const fields = Object.keys(descriptor.fields)
    expect(descriptor.writableFields.length).toBeGreaterThan(0)
    for (const field of descriptor.writableFields) {
      expect(fields).toContain(field)
    }
    expect(descriptor.writableFields).not.toContain('id')
    expect(descriptor.writableFields).not.toContain('createdAt')
  })

  it.each(tableBackedDescriptors)('maps $name predicates to the table columns', ({ descriptor, resource }) => {
    for (const [field, fieldDescriptor] of Object.entries(descriptor.fields)) {
      // The row id is the RDF subject, so the descriptor keeps the UDFS id term
      // while the column predicate is the internal `@id` marker.
      if (field === 'id') continue
      expect(fieldDescriptor.predicate).toBe(predicateOf(resource, field))
    }
  })

  it.each(tableBackedDescriptors)('maps $name field types and array flags to the table columns', ({ descriptor, resource }) => {
    for (const [field, fieldDescriptor] of Object.entries(descriptor.fields)) {
      const column = columnsOf(resource)[field]
      expect(allowedDescriptorTypes(column)).toContain(fieldDescriptor.type)
      expect(Boolean(column?.options?.isArray)).toBe(Boolean(fieldDescriptor.array))
    }
  })

  it.each(tableBackedDescriptors)('derives $name storage from the table base and id default', ({ descriptor, resource }) => {
    const expected = `${resourceConfigOf(resource).base}${idDefaultOf(resource)}`.replace(/\{key\}/gu, '{id}')
    const actual = `${descriptor.storage.base}${descriptor.storage.resourceIdPattern}`.replace(/\{key\}/gu, '{id}')
    expect(actual).toBe(expected)
  })

  it('keys credentials by row id because a provider pool repeats providers', () => {
    expect(credentialDescriptor.uniqueBy).toEqual(['id'])
    expect(Object.keys(credentialDescriptor.fields)).not.toContain('providerId')
    expect(Object.keys(credentialDescriptor.fields)).not.toContain('secretType')
  })
})

describe('pod storage descriptor link relations', () => {
  const schemaResources: unknown[] = Object.values(solidResources)

  /** The one schema resource behind an official descriptor; the RDF class joins them. */
  function schemaResourceOf(descriptor: PodModelDescriptor): unknown {
    const matches = schemaResources.filter((resource) => {
      const type = resourceConfigOf(resource).type
      return type === descriptor.uri || type === descriptor.class
    })
    expect(matches, `${descriptor.resourceKind} matches ${matches.length} schema resources`).toHaveLength(1)
    return matches[0]
  }

  /** RDF class a column's `.link(...)` target declares, read back from the column builder. */
  function linkTargetType(column: Record<string, any>): string {
    const linkedTable = column?.getLinkTable?.()
    if (linkedTable) return resourceConfigOf(linkedTable).type ?? ''

    const linkTableName = column?.getLinkTableName?.()
    if (linkTableName) {
      const target = schemaResources.find((resource) => resourceNameOf(resource) === linkTableName)
      expect(target, `linked table ${linkTableName} is not a schema resource`).toBeDefined()
      return resourceConfigOf(target).type ?? ''
    }

    return column?.getLinkTarget?.() ?? ''
  }

  function descriptorOfType(type: string): PodModelDescriptor {
    const matches = officialPodModelDescriptors.filter((descriptor) => (
      descriptor.uri === type || descriptor.class === type
    ))
    expect(matches, `no official descriptor for ${type}`).toHaveLength(1)
    return matches[0]
  }

  it('describes every official descriptor with exactly one schema resource', () => {
    for (const descriptor of officialPodModelDescriptors) {
      schemaResourceOf(descriptor)
    }
  })

  it('declares the link target on every field whose column declares .link(...)', () => {
    for (const descriptor of officialPodModelDescriptors) {
      const columns = columnsOf(schemaResourceOf(descriptor))
      for (const [field, column] of Object.entries(columns)) {
        if (!column?.isLink?.()) continue

        const location = `${descriptor.resourceKind}.${field}`
        expect(Object.keys(descriptor.fields), `${location} is a linked column but not a descriptor field`).toContain(field)
        const references = descriptor.fields[field].references
        expect(references, `${location} must declare references`).toBeDefined()

        const target = descriptorOfType(linkTargetType(column))
        expect(references?.resource, `${location} target`).toBe(target.resourceKind)
        expect(references?.key, `${location} key`).toBe(target.uniqueBy[0])
        // The declared key must be a real field on the target descriptor.
        expect(Object.keys(target.fields), `${location} key`).toContain(references?.key)
      }
    }
  })

  it('declares references only where the backing column links', () => {
    for (const descriptor of officialPodModelDescriptors) {
      const columns = columnsOf(schemaResourceOf(descriptor))
      for (const [field, fieldDescriptor] of Object.entries(descriptor.fields)) {
        const location = `${descriptor.resourceKind}.${field}`
        const column = columns[field]
        expect(column, `${location} has no schema column`).toBeDefined()
        expect(Boolean(fieldDescriptor.references), `${location} references`).toBe(Boolean(column?.isLink?.()))
      }
    }
  })

  it('points every declared relation at one official descriptor', () => {
    for (const descriptor of officialPodModelDescriptors) {
      for (const [field, fieldDescriptor] of Object.entries(descriptor.fields)) {
        const references = fieldDescriptor.references
        if (!references) continue

        const location = `${descriptor.resourceKind}.${field}`
        const targets = officialPodModelDescriptors.filter((candidate) => (
          candidate.resourceKind === references.resource
        ))
        expect(targets, `${location} -> ${references.resource}`).toHaveLength(1)
        expect(targets[0].uniqueBy[0], `${location} key`).toBe(references.key)
      }
    }
  })

  it('keeps the credential provider edge instead of the retired providerId attribute', () => {
    expect(credentialDescriptor.fields.provider.references).toEqual({
      resource: 'provider',
      key: 'id',
    })
    expect(credentialDescriptor.fields.offeringId.references).toBeUndefined()
  })
})
