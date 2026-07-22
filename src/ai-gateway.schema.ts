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
  name: string('name').predicate(UDFS.name),
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
  owner: uri('owner').predicate(UDFS.owner),
  deployment: string('deployment').predicate(UDFS.deployment),
  provider: string('provider').predicate(UDFS.provider),
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
  owner: string
  deployment: GatewayAccessKeyDeploymentType
  provider: string
  credential: string
  now?: Date | string | number
}

export type FindLatestQuotaSnapshotInput = Omit<FindFreshQuotaSnapshotInput, 'now'>

export interface QuotaSnapshotIdInput {
  owner: string
  deployment: GatewayAccessKeyDeploymentType
  provider: string
  credential: string
}

export type QuotaSnapshotUpsert =
  Omit<QuotaSnapshotInsert, 'id' | 'owner' | 'deployment' | 'provider' | 'credential'> &
  QuotaSnapshotIdInput &
  { id?: string }

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

function normalizeProvider(value: string): string {
  return value.trim().toLowerCase()
}

function quotaScope(input: QuotaSnapshotIdInput): QuotaSnapshotIdInput {
  assertGatewayAccessKeyDeployment(input.deployment)
  if (!input.owner || !input.credential || !input.provider.trim()) {
    throw new Error('Quota snapshot owner, provider, and credential are required')
  }
  return {
    owner: input.owner,
    deployment: input.deployment,
    provider: normalizeProvider(input.provider),
    credential: input.credential,
  }
}

export function quotaSnapshotId(input: QuotaSnapshotIdInput): string {
  const scope = quotaScope(input)
  const digest = sha256Hex(JSON.stringify([
    scope.owner,
    scope.deployment,
    scope.provider,
    scope.credential,
  ]))
  return `ai/gateway/quota.ttl#${scope.provider}-${scope.deployment}-${digest}`
}

function rowMatchesQuotaScope(row: QuotaSnapshotRow, input: FindLatestQuotaSnapshotInput): boolean {
  const scope = quotaScope(input)
  return row.owner === scope.owner &&
    row.deployment === scope.deployment &&
    row.provider === scope.provider &&
    row.credential === scope.credential
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

export function validateQuotaSnapshot(input: QuotaSnapshotUpsert): QuotaSnapshotUpsert & { id: string; status: QuotaSnapshotStatusType } {
  assertQuotaSnapshotStatus(input.status)
  const scope = quotaScope(input)
  return {
    ...input,
    ...scope,
    id: input.id ?? quotaSnapshotId(scope),
    status: input.status,
  }
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
    const rows = await findQuotaSnapshotRows(db, input)

    return rows
      .filter((row) => rowMatchesQuotaScope(row, input) && isFreshQuotaSnapshot(row, now))
      .sort((a, b) => timestampMs(b.observedAt) - timestampMs(a.observedAt))[0] ?? null
  },

  async findLatestQuotaSnapshot(
    db: AIGatewayRepositoryDb,
    input: FindLatestQuotaSnapshotInput,
  ): Promise<QuotaSnapshotRow | null> {
    const rows = await findQuotaSnapshotRows(db, input)

    return rows
      .filter((row) => rowMatchesQuotaScope(row, input))
      .sort((a, b) => timestampMs(b.observedAt) - timestampMs(a.observedAt))[0] ?? null
  },
} as const

async function findQuotaSnapshotRows(
  db: AIGatewayRepositoryDb,
  input: FindLatestQuotaSnapshotInput,
): Promise<QuotaSnapshotRow[]> {
  return db
    .select()
    .from(quotaSnapshotResource)
    .where(eq(quotaSnapshotResource.credential, input.credential))
    .execute()
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

function sha256Hex(input: string): string {
  const bytes = Array.from(new TextEncoder().encode(input))
  const bitLength = bytes.length * 8
  bytes.push(0x80)
  while ((bytes.length % 64) !== 56) bytes.push(0)
  const high = Math.floor(bitLength / 0x100000000)
  const low = bitLength >>> 0
  bytes.push(
    (high >>> 24) & 0xff,
    (high >>> 16) & 0xff,
    (high >>> 8) & 0xff,
    high & 0xff,
    (low >>> 24) & 0xff,
    (low >>> 16) & 0xff,
    (low >>> 8) & 0xff,
    low & 0xff,
  )

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  const words = new Array<number>(64)

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4
      words[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotateRight(words[i - 15], 7) ^ rotateRight(words[i - 15], 18) ^ (words[i - 15] >>> 3)
      const s1 = rotateRight(words[i - 2], 17) ^ rotateRight(words[i - 2], 19) ^ (words[i - 2] >>> 10)
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = hash
    for (let i = 0; i < 64; i++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + s1 + ch + SHA256_K[i] + words[i]) >>> 0
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (s0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    hash[0] = (hash[0] + a) >>> 0
    hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0
    hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0
    hash[5] = (hash[5] + f) >>> 0
    hash[6] = (hash[6] + g) >>> 0
    hash[7] = (hash[7] + h) >>> 0
  }

  return hash.map((word) => word.toString(16).padStart(8, '0')).join('')
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits))
}
