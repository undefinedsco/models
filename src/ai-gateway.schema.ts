import { eq, id, integer, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { credentialResource } from './credential.schema'
import { UDFS } from './namespaces'

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

interface InsertExecution<TRow> {
  execute(): Promise<TRow[]>
}

interface InsertValues<TInsert, TRow> {
  values(value: TInsert): InsertExecution<TRow>
}

interface SelectExecution<TRow> {
  execute(): Promise<TRow[]>
}

interface SelectWhere<TRow> {
  where(condition: unknown): SelectExecution<TRow>
}

interface SelectFrom<TRow> {
  from(resource: typeof quotaSnapshotResource): SelectWhere<TRow>
}

interface AIGatewayRepositoryDb {
  findById<TRow>(resource: typeof gatewayAccessKeyResource | typeof quotaSnapshotResource, id: string): Promise<TRow | null>
  findByIri<TRow>(resource: typeof gatewayAccessKeyResource | typeof quotaSnapshotResource, iri: string): Promise<TRow | null>
  updateById<TRow>(
    resource: typeof gatewayAccessKeyResource | typeof quotaSnapshotResource,
    id: string,
    data: GatewayAccessKeyUpdate | QuotaSnapshotUpdate,
  ): Promise<TRow | null>
  updateByIri<TRow>(
    resource: typeof gatewayAccessKeyResource | typeof quotaSnapshotResource,
    iri: string,
    data: GatewayAccessKeyUpdate | QuotaSnapshotUpdate,
  ): Promise<TRow | null>
  insert(resource: typeof quotaSnapshotResource): InsertValues<QuotaSnapshotInsert, QuotaSnapshotRow>
  select(): SelectFrom<QuotaSnapshotRow>
}

const ABSOLUTE_IRI = /^[a-zA-Z][a-zA-Z\d+.-]*:/
const GATEWAY_ACCESS_KEY_DEPLOYMENTS = new Set<string>(Object.values(GatewayAccessKeyDeployment))
const QUOTA_SNAPSHOT_STATUSES = new Set<string>(Object.values(QuotaSnapshotStatus))

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
  const expiresAt = asDate(row.expiresAt)
  return !expiresAt || expiresAt.getTime() > now.getTime()
}

function isAbsoluteIri(value: string): boolean {
  return ABSOLUTE_IRI.test(value)
}

function isGatewayAccessKeyDeployment(value: unknown): value is GatewayAccessKeyDeploymentType {
  return typeof value === 'string' && GATEWAY_ACCESS_KEY_DEPLOYMENTS.has(value)
}

function isQuotaSnapshotStatus(value: unknown): value is QuotaSnapshotStatusType {
  return typeof value === 'string' && QUOTA_SNAPSHOT_STATUSES.has(value)
}

function assertGatewayAccessKeyDeployment(value: unknown): asserts value is GatewayAccessKeyDeploymentType {
  if (!isGatewayAccessKeyDeployment(value)) {
    throw new Error(`Invalid Gateway access key deployment: ${String(value)}`)
  }
}

function assertQuotaSnapshotStatus(value: unknown): asserts value is QuotaSnapshotStatusType {
  if (!isQuotaSnapshotStatus(value)) {
    throw new Error(`Invalid quota snapshot status: ${String(value)}`)
  }
}

function quotaSnapshotUpdate(snapshot: QuotaSnapshotUpsert): QuotaSnapshotUpdate {
  const { id: _id, ...patch } = snapshot
  return patch
}

export function validateGatewayAccessKey(input: GatewayAccessKeyInsert): GatewayAccessKeyInsert & { deployment: GatewayAccessKeyDeploymentType } {
  assertGatewayAccessKeyDeployment(input.deployment)
  return { ...input, deployment: input.deployment }
}

export function validateQuotaSnapshot(input: QuotaSnapshotUpsert): QuotaSnapshotUpsert & { status: QuotaSnapshotStatusType } {
  assertQuotaSnapshotStatus(input.status)
  return { ...input, status: input.status }
}

export const aiGatewayRepository = {
  validateAccessKey: validateGatewayAccessKey,
  validateQuotaSnapshot,

  findAccessKeyById(
    db: AIGatewayRepositoryDb,
    idValue: string,
  ): Promise<GatewayAccessKeyRow | null> {
    if (isAbsoluteIri(idValue)) {
      return db.findByIri<GatewayAccessKeyRow>(gatewayAccessKeyResource, idValue)
    }
    return db.findById<GatewayAccessKeyRow>(gatewayAccessKeyResource, idValue)
  },

  revokeAccessKey(
    db: AIGatewayRepositoryDb,
    input: { id: string; revokedAt?: Date | string | number },
  ): Promise<GatewayAccessKeyRow | null> {
    const patch = {
      revokedAt: asDate(input.revokedAt) ?? new Date(),
    }
    if (isAbsoluteIri(input.id)) {
      return db.updateByIri<GatewayAccessKeyRow>(gatewayAccessKeyResource, input.id, patch)
    }
    return db.updateById<GatewayAccessKeyRow>(gatewayAccessKeyResource, input.id, patch)
  },

  async upsertQuotaSnapshot(
    db: AIGatewayRepositoryDb,
    snapshot: QuotaSnapshotUpsert,
  ): Promise<QuotaSnapshotRow | null> {
    const validSnapshot = validateQuotaSnapshot(snapshot)
    const existing = isAbsoluteIri(validSnapshot.id)
      ? await db.findByIri<QuotaSnapshotRow>(quotaSnapshotResource, validSnapshot.id)
      : await db.findById<QuotaSnapshotRow>(quotaSnapshotResource, validSnapshot.id)

    if (existing) {
      const patch = quotaSnapshotUpdate(validSnapshot)
      return isAbsoluteIri(validSnapshot.id)
        ? db.updateByIri<QuotaSnapshotRow>(quotaSnapshotResource, validSnapshot.id, patch)
        : db.updateById<QuotaSnapshotRow>(quotaSnapshotResource, validSnapshot.id, patch)
    }

    const [created] = await db.insert(quotaSnapshotResource).values(validSnapshot).execute()
    return created ?? null
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
      .execute()

    return rows
      .filter((row) => row.credential === input.credential && isFreshQuotaSnapshot(row, now))
      .sort((a, b) => timestampMs(b.observedAt) - timestampMs(a.observedAt))[0] ?? null
  },
} as const
