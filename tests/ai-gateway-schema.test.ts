import { describe, expect, it } from 'vitest'
import {
  aiGatewayRepository,
  gatewayAccessKeyResource,
  quotaSnapshotId,
  quotaSnapshotResource,
  solidResources,
  solidSchema,
  UDFS,
  type GatewayAccessKeyRow,
  type GatewayAccessKeyUpdate,
  type QuotaSnapshotStatusType,
  type QuotaSnapshotInsert,
  type QuotaSnapshotRow,
  type QuotaSnapshotUpdate,
} from '../src'
import {
  credentialDescriptor,
  gatewayAccessKeyDescriptor,
  podSchema,
  quotaSnapshotDescriptor,
} from '../src/pod-storage-descriptor'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
}

function resourceConfigOf(resource: unknown): { type?: string; namespace?: unknown } {
  return ((resource as any)?._?.config ?? (resource as any)?.config) as { type?: string; namespace?: unknown }
}

function predicateOf(resource: unknown, field: string): string {
  const column = columnsOf(resource)[field] as {
    getPredicate?: (namespace?: unknown) => string
    options?: { predicate?: unknown }
  }
  return column.getPredicate?.(resourceConfigOf(resource).namespace) ??
    (typeof column.options?.predicate === 'string' ? column.options.predicate : '')
}

function expectColumns(resource: unknown, fields: string[]): void {
  expect(Object.keys(columnsOf(resource))).toEqual(expect.arrayContaining(fields))
}

describe('AI Gateway shared resources', () => {
  it('models gateway access keys as control-primary Linked Data resources', () => {
    expect(gatewayAccessKeyResource.buildId({ id: 'key_1' })).toBe('ai/gateway/access-keys.ttl#key_1')
    expect(gatewayAccessKeyResource.resolveUri('ai/gateway/access-keys.ttl#key_1')).toBe('/.data/ai/gateway/access-keys.ttl#key_1')
    expect(resourceConfigOf(gatewayAccessKeyResource)).toMatchObject({
      type: UDFS.GatewayAccessKey,
      namespace: UDFS,
    })

    expectColumns(gatewayAccessKeyResource, [
      'owner',
      'secretHash',
      'name',
      'deployment',
      'scopes',
      'createdAt',
      'expiresAt',
      'lastUsedAt',
      'revokedAt',
    ])
    expect(columnsOf(gatewayAccessKeyResource).ownerId).toBeUndefined()
    expect(predicateOf(gatewayAccessKeyResource, 'owner')).toBe(UDFS.owner)
    expect(predicateOf(gatewayAccessKeyResource, 'secretHash')).toBe(UDFS.secretHash)
    expect(predicateOf(gatewayAccessKeyResource, 'name')).toBe(UDFS.name)
    expect(predicateOf(gatewayAccessKeyResource, 'deployment')).toBe(UDFS.deployment)
    expect(predicateOf(gatewayAccessKeyResource, 'scopes')).toBe(UDFS.scopes)
    expect(predicateOf(gatewayAccessKeyResource, 'revokedAt')).toBe(UDFS.revokedAt)
  })

  it('models quota snapshots with semantic credential relations and serialized windows', () => {
    expect(quotaSnapshotResource.buildId({ id: 'quota_1' })).toBe('ai/gateway/quota.ttl#quota_1')
    expect(quotaSnapshotResource.resolveUri('ai/gateway/quota.ttl#quota_1')).toBe('/.data/ai/gateway/quota.ttl#quota_1')
    expect(resourceConfigOf(quotaSnapshotResource)).toMatchObject({
      type: UDFS.QuotaSnapshot,
      namespace: UDFS,
    })

    expectColumns(quotaSnapshotResource, [
      'owner',
      'deployment',
      'provider',
      'credential',
      'status',
      'balance',
      'windows',
      'observedAt',
      'expiresAt',
      'source',
    ])
    expect(columnsOf(quotaSnapshotResource).ownerId).toBeUndefined()
    expect(columnsOf(quotaSnapshotResource).credentialId).toBeUndefined()
    expect(predicateOf(quotaSnapshotResource, 'owner')).toBe(UDFS.owner)
    expect(predicateOf(quotaSnapshotResource, 'deployment')).toBe(UDFS.deployment)
    expect(predicateOf(quotaSnapshotResource, 'provider')).toBe(UDFS.provider)
    expect(predicateOf(quotaSnapshotResource, 'credential')).toBe(UDFS.credential)
    expect(predicateOf(quotaSnapshotResource, 'status')).toBe(UDFS.status)
    expect(predicateOf(quotaSnapshotResource, 'balance')).toBe(UDFS.balance)
    expect(predicateOf(quotaSnapshotResource, 'windows')).toBe(UDFS.windows)
    expect(predicateOf(quotaSnapshotResource, 'observedAt')).toBe(UDFS.observedAt)
    expect(predicateOf(quotaSnapshotResource, 'source')).toBe(UDFS.source)
  })

  it('builds stable quota snapshot ids from a hash without requiring scope to be decoded from ids', () => {
    const longOwner = `https://pod.example/${'very-long-owner-segment/'.repeat(12)}profile/card#me`
    const longCredential = `https://pod.example/.data/${'deep/'.repeat(40)}credentials.ttl#${'credential-fragment-'.repeat(20)}a`
    const same = quotaSnapshotId({
      owner: longOwner,
      deployment: 'cloud',
      provider: 'KIMI',
      credential: longCredential,
    })
    const again = quotaSnapshotId({
      owner: longOwner,
      deployment: 'cloud',
      provider: 'kimi',
      credential: longCredential,
    })
    const differentCredential = quotaSnapshotId({
      owner: longOwner,
      deployment: 'cloud',
      provider: 'kimi',
      credential: `${longCredential}-different`,
    })

    expect(same).toBe(again)
    expect(same).toMatch(/^ai\/gateway\/quota\.ttl#kimi-cloud-[a-f0-9]{64}$/)
    expect(same.length).toBeLessThan(110)
    expect(same).not.toContain(longOwner)
    expect(same).not.toContain(longCredential)
    expect(differentCredential).not.toBe(same)
  })

  it('registers gateway resources in Resource and compatibility schema registries', () => {
    expect((solidResources as any).gatewayAccessKeyResource).toBe(gatewayAccessKeyResource)
    expect((solidResources as any).quotaSnapshotResource).toBe(quotaSnapshotResource)
    expect((solidSchema as any).gatewayAccessKeyTable).toBe(gatewayAccessKeyResource)
    expect((solidSchema as any).quotaSnapshotTable).toBe(quotaSnapshotResource)
  })

  it('exposes repository helpers that hide exact resource ids from callers', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z')
    const owner = 'https://pod.example/profile/card#me'
    const credential = 'https://pod.example/settings/credentials.ttl#cred_1'
    const accessKey: GatewayAccessKeyRow = {
      id: 'ai/gateway/access-keys.ttl#key_1',
      owner,
      secretHash: 'sha256:abc',
      name: 'Laptop Codex',
      deployment: 'cloud',
      scopes: ['gateway:invoke'],
      createdAt: now,
    } as GatewayAccessKeyRow
    const quota: QuotaSnapshotRow = {
      id: 'ai/gateway/quota.ttl#quota_1',
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      status: 'available',
      balance: 1200,
      windows: '[{"unit":"day","remaining":1200}]',
      observedAt: now,
      expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      source: 'provider',
    } as QuotaSnapshotRow
    const calls: Array<[string, unknown, unknown?, unknown?]> = []
    const db = {
      async findById(resource: unknown, id: string) {
        calls.push(['findById', resource, id])
        if (resource === gatewayAccessKeyResource) return accessKey
        if (resource === quotaSnapshotResource) return null
        return null
      },
      async updateById(resource: unknown, id: string, data: GatewayAccessKeyUpdate | QuotaSnapshotUpdate) {
        calls.push(['updateById', resource, id, data])
        if (resource === gatewayAccessKeyResource) return { ...accessKey, ...data }
        return { ...quota, ...data }
      },
      async findByIri(resource: unknown, iri: string) {
        calls.push(['findByIri', resource, iri])
        if (resource === gatewayAccessKeyResource) return accessKey
        if (resource === quotaSnapshotResource) return quota
        return null
      },
      async updateByIri(resource: unknown, iri: string, data: GatewayAccessKeyUpdate | QuotaSnapshotUpdate) {
        calls.push(['updateByIri', resource, iri, data])
        if (resource === gatewayAccessKeyResource) return { ...accessKey, ...data }
        return { ...quota, ...data }
      },
      insert(resource: unknown) {
        calls.push(['insert', resource])
        return {
          values(value: QuotaSnapshotInsert) {
            calls.push(['values', resource, value])
            return {
              async execute() {
                calls.push(['execute', resource])
                return [{ ...quota, ...value }]
              },
            }
          },
        }
      },
      select() {
        return {
          from(resource: unknown) {
            calls.push(['from', resource])
            return {
              where(condition: unknown) {
                calls.push(['where', resource, condition])
                return {
                  async execute() {
                    calls.push(['selectExecute', resource])
                    return [
                      { ...quota, id: 'ai/gateway/quota.ttl#stale', observedAt: new Date('2026-06-30T00:00:00.000Z'), expiresAt: new Date('2026-06-30T01:00:00.000Z') },
                      quota,
                    ]
                  },
                }
              },
            }
          },
        }
      },
    }

    await expect(aiGatewayRepository.findAccessKeyById(db as never, 'key_1')).resolves.toBe(accessKey)
    await expect(aiGatewayRepository.revokeAccessKey(db as never, {
      id: 'key_1',
      revokedAt: now,
    })).resolves.toMatchObject({ revokedAt: now })
    await expect(aiGatewayRepository.upsertQuotaSnapshot(db as never, {
      id: 'quota_1',
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      status: 'available',
      balance: 1200,
      windows: '[{"unit":"day","remaining":1200}]',
      observedAt: now,
      expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      source: 'provider',
    })).resolves.toMatchObject({ id: 'quota_1' })
    await expect(aiGatewayRepository.findFreshQuotaSnapshot(db as never, {
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      now,
    })).resolves.toBe(quota)
    await expect(aiGatewayRepository.findLatestQuotaSnapshot(db as never, {
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
    })).resolves.toBe(quota)

    expect(calls).toEqual(expect.arrayContaining([
      ['findById', gatewayAccessKeyResource, 'key_1'],
      ['updateById', gatewayAccessKeyResource, 'key_1', { revokedAt: now }],
      ['findById', quotaSnapshotResource, 'quota_1'],
      ['insert', quotaSnapshotResource],
      ['from', quotaSnapshotResource],
    ]))
  })

  it('dispatches canonical absolute IRIs through IRI repository methods', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z')
    const owner = 'https://pod.example/profile/card#me'
    const credential = 'https://pod.example/settings/credentials.ttl#cred_1'
    const keyIri = 'https://pod.example/.data/ai/gateway/access-keys.ttl#key_1'
    const quotaIri = 'https://pod.example/.data/ai/gateway/quota.ttl#quota_1'
    const calls: Array<[string, unknown, unknown?, unknown?]> = []
    const accessKey = {
      id: 'ai/gateway/access-keys.ttl#key_1',
      owner,
      secretHash: 'sha256:abc',
      deployment: 'cloud',
    } as GatewayAccessKeyRow
    const quota = {
      id: 'ai/gateway/quota.ttl#quota_1',
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      status: 'available',
      expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      observedAt: now,
    } as QuotaSnapshotRow
    const db = {
      async findById(resource: unknown, id: string) {
        calls.push(['findById', resource, id])
        return null
      },
      async findByIri(resource: unknown, iri: string) {
        calls.push(['findByIri', resource, iri])
        return resource === gatewayAccessKeyResource ? accessKey : quota
      },
      async updateById(resource: unknown, id: string, data: GatewayAccessKeyUpdate | QuotaSnapshotUpdate) {
        calls.push(['updateById', resource, id, data])
        return null
      },
      async updateByIri(resource: unknown, iri: string, data: GatewayAccessKeyUpdate | QuotaSnapshotUpdate) {
        calls.push(['updateByIri', resource, iri, data])
        return resource === gatewayAccessKeyResource ? { ...accessKey, ...data } : { ...quota, ...data }
      },
      insert(resource: unknown) {
        calls.push(['insert', resource])
        return {
          values(value: QuotaSnapshotInsert) {
            calls.push(['values', resource, value])
            return { async execute() { return [{ ...quota, ...value }] } }
          },
        }
      },
      select() {
        return {
          from(resource: unknown) {
            return {
              where(condition: unknown) {
                calls.push(['where', resource, condition])
                return { async execute() { return [] } }
              },
            }
          },
        }
      },
    }

    await expect(aiGatewayRepository.findAccessKeyById(db as never, keyIri)).resolves.toBe(accessKey)
    await expect(aiGatewayRepository.revokeAccessKey(db as never, {
      id: keyIri,
      revokedAt: now,
    })).resolves.toMatchObject({ revokedAt: now })
    await expect(aiGatewayRepository.upsertQuotaSnapshot(db as never, {
      id: quotaIri,
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      status: 'available',
      expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      observedAt: now,
    })).resolves.toMatchObject({ id: 'ai/gateway/quota.ttl#quota_1' })

    expect(calls).toEqual(expect.arrayContaining([
      ['findByIri', gatewayAccessKeyResource, keyIri],
      ['updateByIri', gatewayAccessKeyResource, keyIri, { revokedAt: now }],
      ['findByIri', quotaSnapshotResource, quotaIri],
      ['updateByIri', quotaSnapshotResource, quotaIri, {
        owner,
        deployment: 'cloud',
        provider: 'kimi',
        credential,
        status: 'available',
        expiresAt: new Date('2026-07-01T01:00:00.000Z'),
        observedAt: now,
      }],
    ]))
    expect(calls.some(([method]) => method === 'findById' || method === 'updateById')).toBe(false)
  })

  it('keeps quota freshness independent from provider status', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z')
    const owner = 'https://pod.example/profile/card#me'
    const credential = 'https://pod.example/settings/credentials.ttl#cred_1'
    const rows = (['available', 'unsupported', 'error'] as QuotaSnapshotStatusType[]).map((status, index) => ({
      id: `ai/gateway/quota.ttl#quota_${index + 1}`,
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      status,
      observedAt: new Date(`2026-07-01T00:0${index}:00.000Z`),
      expiresAt: new Date('2026-07-01T01:00:00.000Z'),
    })) as QuotaSnapshotRow[]
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return { async execute() { return rows } }
              },
            }
          },
        }
      },
    }

    await expect(aiGatewayRepository.findFreshQuotaSnapshot(db as never, {
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      now,
    })).resolves.toMatchObject({ status: 'error' })
  })

  it('requires persisted quota scope fields and never matches legacy rows missing scope', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z')
    const owner = 'https://pod.example/profile/card#me'
    const credential = 'https://pod.example/settings/credentials.ttl#cred_1'
    const rows = [
      {
        id: 'ai/gateway/quota.ttl#legacy',
        credential,
        status: 'available',
        observedAt: new Date('2026-07-01T00:05:00.000Z'),
        expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      },
      {
        id: quotaSnapshotId({ owner, deployment: 'cloud', provider: 'kimi', credential }),
        owner,
        deployment: 'cloud',
        provider: 'kimi',
        credential,
        status: 'unsupported',
        observedAt: new Date('2026-07-01T00:01:00.000Z'),
        expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      },
    ] as QuotaSnapshotRow[]
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return { async execute() { return rows } }
              },
            }
          },
        }
      },
    }

    await expect(aiGatewayRepository.findFreshQuotaSnapshot(db as never, {
      owner,
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      now,
    })).resolves.toMatchObject({ status: 'unsupported' })
    await expect(aiGatewayRepository.findFreshQuotaSnapshot(db as never, {
      owner: 'https://pod.example/other#me',
      deployment: 'cloud',
      provider: 'kimi',
      credential,
      now,
    })).resolves.toBeNull()
  })

  it('returns null for not-found updates and empty inserts without updating id fields', async () => {
    const calls: Array<[string, unknown, unknown?, unknown?]> = []
    const db = {
      async findById(resource: unknown, id: string) {
        calls.push(['findById', resource, id])
        return resource === quotaSnapshotResource && id === 'quota_1'
          ? { id: 'ai/gateway/quota.ttl#quota_1' }
          : null
      },
      async findByIri(resource: unknown, iri: string) {
        calls.push(['findByIri', resource, iri])
        return null
      },
      async updateById(resource: unknown, id: string, data: QuotaSnapshotUpdate) {
        calls.push(['updateById', resource, id, data])
        return null
      },
      async updateByIri(resource: unknown, iri: string, data: QuotaSnapshotUpdate) {
        calls.push(['updateByIri', resource, iri, data])
        return null
      },
      insert(resource: unknown) {
        calls.push(['insert', resource])
        return {
          values(value: QuotaSnapshotInsert) {
            calls.push(['values', resource, value])
            return { async execute() { return [] } }
          },
        }
      },
    }

    await expect(aiGatewayRepository.revokeAccessKey(db as never, {
      id: 'missing-key',
      revokedAt: '2026-07-01T00:00:00.000Z',
    })).resolves.toBeNull()

    await expect(aiGatewayRepository.upsertQuotaSnapshot(db as never, {
      id: 'quota_1',
      owner: 'https://pod.example/profile/card#me',
      deployment: 'cloud',
      provider: 'kimi',
      credential: 'https://pod.example/settings/credentials.ttl#cred_1',
      status: 'available',
    })).resolves.toBeNull()

    await expect(aiGatewayRepository.upsertQuotaSnapshot(db as never, {
      id: 'quota_empty',
      owner: 'https://pod.example/profile/card#me',
      deployment: 'cloud',
      provider: 'kimi',
      credential: 'https://pod.example/settings/credentials.ttl#cred_1',
      status: 'available',
    })).resolves.toBeNull()

    expect(calls).toEqual(expect.arrayContaining([
      ['updateById', quotaSnapshotResource, 'quota_1', {
        owner: 'https://pod.example/profile/card#me',
        deployment: 'cloud',
        provider: 'kimi',
        credential: 'https://pod.example/settings/credentials.ttl#cred_1',
        status: 'available',
      }],
      ['values', quotaSnapshotResource, {
        id: 'quota_empty',
        owner: 'https://pod.example/profile/card#me',
        deployment: 'cloud',
        provider: 'kimi',
        credential: 'https://pod.example/settings/credentials.ttl#cred_1',
        status: 'available',
      }],
    ]))
    expect(calls.some(([method, resource,, data]) => (
      (method === 'updateById' || method === 'updateByIri') &&
      resource === quotaSnapshotResource &&
      typeof data === 'object' &&
      data !== null &&
      'id' in data
    ))).toBe(false)
  })

  it('rejects invalid Gateway deployment and quota status values at model boundaries', async () => {
    const db = {
      async findById() { return null },
      async findByIri() { return null },
      insert(resource: unknown) {
        return {
          values(value: QuotaSnapshotInsert) {
            return { async execute() { return [{ id: 'ai/gateway/quota.ttl#quota_1', ...value }] } }
          },
        }
      },
    }

    expect(() => aiGatewayRepository.validateAccessKey({
      id: 'key_1',
      owner: 'https://pod.example/profile/card#me',
      secretHash: 'sha256:abc',
      deployment: 'edge',
    })).toThrow('Invalid Gateway access key deployment')
    await expect(aiGatewayRepository.upsertQuotaSnapshot(db as never, {
      id: 'quota_1',
      owner: 'https://pod.example/profile/card#me',
      deployment: 'cloud',
      provider: 'kimi',
      credential: 'https://pod.example/settings/credentials.ttl#cred_1',
      status: 'pending',
    } as never)).rejects.toThrow('Invalid quota snapshot status')
  })

  it('registers descriptors for credential, gateway access key, and quota snapshot discovery', () => {
    expect(credentialDescriptor.fields).toMatchObject({
      authMode: { predicate: UDFS.authMode },
      encryptedSecret: { predicate: UDFS.encryptedSecret, secret: true },
      scopes: { predicate: UDFS.scopes, array: true },
      expiresAt: { predicate: UDFS.expiresAt },
      lastRefreshAt: { predicate: UDFS.lastRefreshAt },
      reauthRequired: { predicate: UDFS.reauthRequired },
    })
    expect(gatewayAccessKeyDescriptor).toMatchObject({
      uri: UDFS.GatewayAccessKey,
      resourceKind: 'gateway-access-key',
      storage: {
        base: '/.data/',
        resourceIdPattern: '{id}',
      },
      uniqueBy: ['id'],
    })
    expect(gatewayAccessKeyDescriptor.fields.owner).toMatchObject({ type: 'uri', predicate: UDFS.owner })
    expect(gatewayAccessKeyDescriptor.fields.secretHash).toMatchObject({ type: 'string', predicate: UDFS.secretHash, secret: true })
    expect(gatewayAccessKeyDescriptor.fields.name).toMatchObject({ type: 'string', predicate: UDFS.name })
    expect(gatewayAccessKeyDescriptor.fields.ownerId).toBeUndefined()

    expect(quotaSnapshotDescriptor).toMatchObject({
      uri: UDFS.QuotaSnapshot,
      resourceKind: 'quota-snapshot',
      storage: {
        base: '/.data/',
        resourceIdPattern: '{id}',
      },
      uniqueBy: ['id'],
    })
    expect(quotaSnapshotDescriptor.fields.credential).toMatchObject({ type: 'uri', predicate: UDFS.credential })
    expect(quotaSnapshotDescriptor.fields.owner).toMatchObject({ type: 'uri', predicate: UDFS.owner })
    expect(quotaSnapshotDescriptor.fields.deployment).toMatchObject({ type: 'string', predicate: UDFS.deployment })
    expect(quotaSnapshotDescriptor.fields.provider).toMatchObject({ type: 'string', predicate: UDFS.provider })
    expect(quotaSnapshotDescriptor.fields.windows).toMatchObject({ type: 'text', predicate: UDFS.windows })
    expect(quotaSnapshotDescriptor.fields.credentialId).toBeUndefined()

    expect(podSchema.describe(UDFS.GatewayAccessKey)).toBe(gatewayAccessKeyDescriptor)
    expect(podSchema.describe(UDFS.QuotaSnapshot)).toBe(quotaSnapshotDescriptor)
  })
})
