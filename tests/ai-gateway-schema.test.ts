import { describe, expect, it } from 'vitest'
import {
  aiGatewayRepository,
  gatewayAccessKeyResource,
  quotaSnapshotResource,
  solidResources,
  solidSchema,
  UDFS,
  type GatewayAccessKeyRow,
  type GatewayAccessKeyUpdate,
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
  const column = columnsOf(resource)[field] as { getPredicate?: (namespace?: unknown) => string }
  return column.getPredicate?.(resourceConfigOf(resource).namespace) ?? ''
}

describe('AI Gateway shared resources', () => {
  it('models gateway access keys as control-primary Linked Data resources', () => {
    expect(gatewayAccessKeyResource.buildId({ id: 'key_1' })).toBe('ai/gateway/access-keys.ttl#key_1')
    expect(gatewayAccessKeyResource.resolveUri('ai/gateway/access-keys.ttl#key_1')).toBe('/.data/ai/gateway/access-keys.ttl#key_1')
    expect(resourceConfigOf(gatewayAccessKeyResource)).toMatchObject({
      type: UDFS.GatewayAccessKey,
      namespace: UDFS,
    })

    expect(columnsOf(gatewayAccessKeyResource)).toMatchObject({
      owner: expect.anything(),
      secretHash: expect.anything(),
      deployment: expect.anything(),
      scopes: expect.anything(),
      createdAt: expect.anything(),
      expiresAt: expect.anything(),
      lastUsedAt: expect.anything(),
      revokedAt: expect.anything(),
    })
    expect(columnsOf(gatewayAccessKeyResource).ownerId).toBeUndefined()
    expect(predicateOf(gatewayAccessKeyResource, 'owner')).toBe(UDFS.owner)
    expect(predicateOf(gatewayAccessKeyResource, 'secretHash')).toBe(UDFS.secretHash)
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

    expect(columnsOf(quotaSnapshotResource)).toMatchObject({
      credential: expect.anything(),
      status: expect.anything(),
      balance: expect.anything(),
      windows: expect.anything(),
      observedAt: expect.anything(),
      expiresAt: expect.anything(),
      source: expect.anything(),
    })
    expect(columnsOf(quotaSnapshotResource).credentialId).toBeUndefined()
    expect(predicateOf(quotaSnapshotResource, 'credential')).toBe(UDFS.credential)
    expect(predicateOf(quotaSnapshotResource, 'status')).toBe(UDFS.status)
    expect(predicateOf(quotaSnapshotResource, 'balance')).toBe(UDFS.balance)
    expect(predicateOf(quotaSnapshotResource, 'windows')).toBe(UDFS.windows)
    expect(predicateOf(quotaSnapshotResource, 'observedAt')).toBe(UDFS.observedAt)
    expect(predicateOf(quotaSnapshotResource, 'source')).toBe(UDFS.source)
  })

  it('registers gateway resources in Resource and compatibility schema registries', () => {
    expect((solidResources as any).gatewayAccessKeyResource).toBe(gatewayAccessKeyResource)
    expect((solidResources as any).quotaSnapshotResource).toBe(quotaSnapshotResource)
    expect((solidSchema as any).gatewayAccessKeyTable).toBe(gatewayAccessKeyResource)
    expect((solidSchema as any).quotaSnapshotTable).toBe(quotaSnapshotResource)
  })

  it('exposes repository helpers that hide exact resource ids from callers', async () => {
    const now = new Date('2026-07-01T00:00:00.000Z')
    const accessKey: GatewayAccessKeyRow = {
      id: 'ai/gateway/access-keys.ttl#key_1',
      owner: 'https://pod.example/profile/card#me',
      secretHash: 'sha256:abc',
      deployment: 'cloud',
      scopes: ['gateway:invoke'],
      createdAt: now,
    } as GatewayAccessKeyRow
    const quota: QuotaSnapshotRow = {
      id: 'ai/gateway/quota.ttl#quota_1',
      credential: 'https://pod.example/settings/credentials.ttl#cred_1',
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
      credential: 'https://pod.example/settings/credentials.ttl#cred_1',
      status: 'available',
      balance: 1200,
      windows: '[{"unit":"day","remaining":1200}]',
      observedAt: now,
      expiresAt: new Date('2026-07-01T01:00:00.000Z'),
      source: 'provider',
    })).resolves.toMatchObject({ id: 'quota_1' })
    await expect(aiGatewayRepository.findFreshQuotaSnapshot(db as never, {
      credential: 'https://pod.example/settings/credentials.ttl#cred_1',
      now,
    })).resolves.toBe(quota)

    expect(calls).toEqual(expect.arrayContaining([
      ['findById', gatewayAccessKeyResource, 'key_1'],
      ['updateById', gatewayAccessKeyResource, 'key_1', { revokedAt: now }],
      ['findById', quotaSnapshotResource, 'quota_1'],
      ['insert', quotaSnapshotResource],
      ['from', quotaSnapshotResource],
    ]))
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
    expect(quotaSnapshotDescriptor.fields.windows).toMatchObject({ type: 'text', predicate: UDFS.windows })
    expect(quotaSnapshotDescriptor.fields.credentialId).toBeUndefined()

    expect(podSchema.describe(UDFS.GatewayAccessKey)).toBe(gatewayAccessKeyDescriptor)
    expect(podSchema.describe(UDFS.QuotaSnapshot)).toBe(quotaSnapshotDescriptor)
  })
})
