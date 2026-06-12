import {
  claimControlRequest,
  isControlRequestStatusClaimable,
  type ControlRequestClaimDatabase,
  type ControlRequestClaimStatus,
} from './control-request.repository'
import { approvalResource, type ApprovalRow, type ApprovalUpdate } from './approval.schema'

export type ApprovalClaimStatus = ControlRequestClaimStatus

export interface ApprovalClaimRequest {
  /** Full ApprovalRequest IRI. Subscribe/watch envelopes should pass as:object. */
  approval: string
  leaseOwner: string
  leaseDurationMs?: number
  now?: Date | string | number
}

export interface ApprovalClaimResult {
  status: ApprovalClaimStatus
  approval: ApprovalRow | null
  leaseOwner: string
  leaseExpiresAt: string
  reason?: string
}

export type ApprovalClaimDatabase = ControlRequestClaimDatabase<typeof approvalResource>

export async function claimApprovalRequest(
  db: ApprovalClaimDatabase,
  input: ApprovalClaimRequest,
): Promise<ApprovalClaimResult> {
  const result = await claimControlRequest(db, approvalResource, input.approval, {
    leaseOwner: input.leaseOwner,
    leaseDurationMs: input.leaseDurationMs,
    now: input.now,
  })
  return {
    status: result.status,
    approval: result.resource,
    leaseOwner: result.leaseOwner,
    leaseExpiresAt: result.leaseExpiresAt,
    ...(result.reason ? { reason: result.reason } : {}),
  }
}

export function isApprovalStatusClaimable(status: unknown): boolean {
  return isControlRequestStatusClaimable(status)
}
