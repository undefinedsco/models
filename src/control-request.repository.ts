import type { approvalResource, ApprovalRow, ApprovalUpdate } from './approval.schema'
import type { inputRequestResource, InputRequestRow, InputRequestUpdate } from './input-request.schema'

export type ControlRequestClaimStatus = 'claimed' | 'lost' | 'not_found' | 'not_actionable'

export interface ClaimableControlRequestRow {
  status?: string | null
  leaseOwner?: string | null
  leaseExpiresAt?: Date | string | null
  expiresAt?: Date | string | null
}

export interface ControlRequestClaimOptions {
  leaseOwner: string
  leaseDurationMs?: number
  now?: Date | string | number
}

export interface ControlRequestClaimResult<TRow extends ClaimableControlRequestRow> {
  status: ControlRequestClaimStatus
  resource: TRow | null
  leaseOwner: string
  leaseExpiresAt: string
  reason?: string
}

export type ControlRequestClaimResource = typeof approvalResource | typeof inputRequestResource
export type ControlRequestClaimRow<TResource extends ControlRequestClaimResource> =
  TResource extends typeof approvalResource ? ApprovalRow : InputRequestRow
export type ControlRequestClaimUpdate<TResource extends ControlRequestClaimResource> =
  TResource extends typeof approvalResource ? ApprovalUpdate : InputRequestUpdate

export interface ControlRequestClaimDatabase<TResource extends ControlRequestClaimResource> {
  findByIri<TRow = ControlRequestClaimRow<TResource>>(resource: TResource, iri: string): Promise<TRow | null>
  updateByIri<TRow = ControlRequestClaimRow<TResource>>(
    resource: TResource,
    iri: string,
    data: ControlRequestClaimUpdate<TResource>,
  ): Promise<TRow | null>
}

const DEFAULT_CONTROL_REQUEST_LEASE_MS = 60_000
const ACTIONABLE_CONTROL_REQUEST_STATUSES = new Set(['pending', 'handling'])

export async function claimControlRequest<TResource extends ControlRequestClaimResource>(
  db: ControlRequestClaimDatabase<TResource>,
  resource: TResource,
  iri: string,
  input: ControlRequestClaimOptions,
): Promise<ControlRequestClaimResult<ControlRequestClaimRow<TResource>>> {
  const now = normalizeClaimDate(input.now)
  const leaseDurationMs = normalizeLeaseDurationMs(input.leaseDurationMs)
  const leaseExpiresAtDate = new Date(now.getTime() + leaseDurationMs)
  const leaseExpiresAt = leaseExpiresAtDate.toISOString()
  const baseResult = {
    resource: null,
    leaseOwner: input.leaseOwner,
    leaseExpiresAt,
  }

  const current = await db.findByIri<ControlRequestClaimRow<TResource>>(resource, iri)
  if (!current) {
    return {
      ...baseResult,
      status: 'not_found',
      reason: 'Control request was not found.',
    }
  }

  if (!isControlRequestStatusClaimable(current.status)) {
    return {
      ...baseResult,
      resource: current,
      status: 'not_actionable',
      reason: `Control request status is ${String(current.status || 'empty')}.`,
    }
  }

  if (isControlRequestBusinessExpired(current, now)) {
    return {
      ...baseResult,
      resource: current,
      status: 'not_actionable',
      reason: 'Control request is past expiresAt.',
    }
  }

  if (hasActiveForeignControlRequestLease(current, input.leaseOwner, now)) {
    return {
      ...baseResult,
      resource: current,
      status: 'lost',
      reason: 'Control request is leased by another client.',
    }
  }

  const patch = {
    status: 'handling',
    leaseOwner: input.leaseOwner,
    leaseExpiresAt: leaseExpiresAtDate,
  } as ControlRequestClaimUpdate<TResource>
  const updated = await db.updateByIri<ControlRequestClaimRow<TResource>>(resource, iri, patch)
  const claimed = updated ?? await db.findByIri<ControlRequestClaimRow<TResource>>(resource, iri)

  if (claimed && controlRequestLeaseBelongsTo(claimed, input.leaseOwner, now)) {
    return {
      status: 'claimed',
      resource: claimed,
      leaseOwner: input.leaseOwner,
      leaseExpiresAt,
    }
  }

  return {
    status: 'lost',
    resource: claimed ?? current,
    leaseOwner: input.leaseOwner,
    leaseExpiresAt,
    reason: 'Control request lease was not retained after update.',
  }
}

export function isControlRequestStatusClaimable(status: unknown): boolean {
  if (typeof status !== 'string' || !status.trim()) {
    return true
  }
  return ACTIONABLE_CONTROL_REQUEST_STATUSES.has(status.trim())
}

function normalizeClaimDate(value: Date | string | number | undefined): Date {
  const date = value instanceof Date ? value : new Date(value ?? Date.now())
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid control request claim timestamp.')
  }
  return date
}

function normalizeLeaseDurationMs(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_CONTROL_REQUEST_LEASE_MS
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Control request claim leaseDurationMs must be a positive finite number.')
  }
  return value
}

function isControlRequestBusinessExpired(resource: ClaimableControlRequestRow, now: Date): boolean {
  const expiresAt = parseOptionalDate(resource.expiresAt)
  return expiresAt !== null && expiresAt.getTime() <= now.getTime()
}

function hasActiveForeignControlRequestLease(
  resource: ClaimableControlRequestRow,
  leaseOwner: string,
  now: Date,
): boolean {
  if (resource.leaseOwner === leaseOwner) {
    return false
  }
  const currentOwner = typeof resource.leaseOwner === 'string' ? resource.leaseOwner.trim() : ''
  if (!currentOwner) {
    return false
  }
  const leaseExpiresAt = parseOptionalDate(resource.leaseExpiresAt)
  return leaseExpiresAt !== null && leaseExpiresAt.getTime() > now.getTime()
}

function controlRequestLeaseBelongsTo(
  resource: ClaimableControlRequestRow,
  leaseOwner: string,
  now: Date,
): boolean {
  if (resource.leaseOwner !== leaseOwner) {
    return false
  }
  if (!isControlRequestStatusClaimable(resource.status)) {
    return false
  }
  const leaseExpiresAt = parseOptionalDate(resource.leaseExpiresAt)
  return leaseExpiresAt === null || leaseExpiresAt.getTime() > now.getTime()
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value) {
    return null
  }
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}
