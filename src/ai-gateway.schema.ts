import { eq, id, integer, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { credentialResource } from './credential.schema'
import { UDFS } from './namespaces'
import type { SolidDatabase } from './repository'

export const GatewayAccessKeyDeployment = {
  local: 'local',
  cloud: 'cloud',
} as const

export type GatewayAccessKeyDeploymentType =
  typeof GatewayAccessKeyDeployment[keyof typeof GatewayAccessKeyDeployment]

export const QuotaSnapshotStatus = {
  available: 'available',
  unsupported: 'unsupported',
  error: 'error',
} as const

export type QuotaSnapshotStatusType =
  typeof QuotaSnapshotStatus[keyof typeof QuotaSnapshotStatus]

export const gatewayAccessKeyResource = podTable('gatewayAccessKey', {
  id: id('id').default('ai/gateway/access-keys.ttl#{key}'),
  owner: uri('owner').predicate(UDFS.owner),
  secretHash: string('secretHash').predicate(UDFS.secretHash),
  deployment: string('deployment').predicate(UDFS.deployment),
  scopes: text('scopes').array().predicate(UDFS.scopes),
  createdAt: timestamp('createdAt').predicate(UDFS.createdAt),
  expiresAt: timestamp('expiresAt').predicate(UDFS.expiresAt),
  lastUsedAt: timestamp('lastUsedAt').predicate(UDFS.lastUsedAt),
  revokedAt: timestamp('revokedAt').predicate(UDFS.revokedAt),
}, {
  base: '/.data/',
  type: UDFS.GatewayAccessKey,
  namespace: UDFS,
})

export const quotaSnapshotResource = podTable('quotaSnapshot', {
  id: id('id').default('ai/gateway/quota.ttl#{key}'),
  credential: uri('credential').predicate(UDFS.credential).link(credentialResource),
  status: string('status').predicate(UDFS.status),
  balance: integer('balance').predicate(UDFS.balance),
  windows: text('windows').predicate(UDFS.windows),
  observedAt: timestamp('observedAt').predicate(UDFS.observedAt),
  expiresAt: timestamp('expiresAt').predicate(UDFS.expiresAt),
  source: string('source').predicate(UDFS.source),
}, {
  base: '/.data/',
  type: UDFS.QuotaSnapshot,
  namespace: UDFS,
})

// Compatibility aliases. New model code should prefer `*Resource`.
export const gatewayAccessKeyTable = gatewayAccessKeyResource
export const quotaSnapshotTable = quotaSnapshotResource

export type GatewayAccessKeyRow = typeof gatewayAccessKeyResource.$inferSelect
export type GatewayAccessKeyInsert = typeof gatewayAccessKeyResource.$inferInsert
export type GatewayAccessKeyUpdate = typeof gatewayAccessKeyResource.$inferUpdate

export type QuotaSnapshotRow = typeof quotaSnapshotResource.$inferSelect
export type QuotaSnapshotInsert = typeof quotaSnapshotResource.$inferInsert
export type QuotaSnapshotUpdate = typeof quotaSnapshotResource.$inferUpdate

export interface FindFreshQuotaSnapshotInput {
  credential: string
  now?: Date | string | number
}

export type QuotaSnapshotUpsert = QuotaSnapshotInsert & { id: string }

type AIGatewayRepositoryDb = Pick<
  SolidDatabase,
  'findById' | 'updateById' | 'insert' | 'select'
>

function asDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

function timestampMs(value: unknown): number {
  return asDate(value)?.getTime() ?? 0
}

function isFreshQuotaSnapshot(row: QuotaSnapshotRow, now: Date): boolean {
  if (row.status !== QuotaSnapshotStatus.available) return false
  const expiresAt = asDate(row.expiresAt)
  return !expiresAt || expiresAt.getTime() > now.getTime()
}

export const aiGatewayRepository = {
  findAccessKeyById(
    db: AIGatewayRepositoryDb,
    idValue: string,
  ): Promise<GatewayAccessKeyRow | null> {
    return db.findById<GatewayAccessKeyRow>(gatewayAccessKeyResource, idValue)
  },

  revokeAccessKey(
    db: AIGatewayRepositoryDb,
    input: { id: string; revokedAt?: Date | string | number },
  ): Promise<GatewayAccessKeyRow> {
    return db.updateById(gatewayAccessKeyResource, input.id, {
      revokedAt: asDate(input.revokedAt) ?? new Date(),
    }) as Promise<GatewayAccessKeyRow>
  },

  async upsertQuotaSnapshot(
    db: AIGatewayRepositoryDb,
    snapshot: QuotaSnapshotUpsert,
  ): Promise<QuotaSnapshotRow> {
    const existing = await db.findById<QuotaSnapshotRow>(quotaSnapshotResource, snapshot.id)
    if (existing) {
      return db.updateById(quotaSnapshotResource, snapshot.id, snapshot) as Promise<QuotaSnapshotRow>
    }
    const [created] = await db.insert(quotaSnapshotResource).values(snapshot).execute() as QuotaSnapshotRow[]
    return created
  },

  async findFreshQuotaSnapshot(
    db: AIGatewayRepositoryDb,
    input: FindFreshQuotaSnapshotInput,
  ): Promise<QuotaSnapshotRow | null> {
    const now = asDate(input.now) ?? new Date()
    const rows = await db
      .select()
      .from(quotaSnapshotResource)
      .where(eq(quotaSnapshotResource.credential, input.credential))
      .execute() as QuotaSnapshotRow[]

    return rows
      .filter((row) => row.credential === input.credential && isFreshQuotaSnapshot(row, now))
      .sort((a, b) => timestampMs(b.observedAt) - timestampMs(a.observedAt))[0] ?? null
  },
} as const
