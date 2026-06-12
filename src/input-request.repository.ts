import {
  claimControlRequest,
  isControlRequestStatusClaimable,
  type ControlRequestClaimDatabase,
  type ControlRequestClaimStatus,
} from './control-request.repository'
import { inputRequestResource, type InputRequestRow, type InputRequestUpdate } from './input-request.schema'

export type InputRequestClaimStatus = ControlRequestClaimStatus

export interface InputRequestClaimRequest {
  /** Full InputRequest IRI. Subscribe/watch envelopes should pass as:object. */
  inputRequest: string
  leaseOwner: string
  leaseDurationMs?: number
  now?: Date | string | number
}

export interface InputRequestClaimResult {
  status: InputRequestClaimStatus
  inputRequest: InputRequestRow | null
  leaseOwner: string
  leaseExpiresAt: string
  reason?: string
}

export type InputRequestClaimDatabase = ControlRequestClaimDatabase<typeof inputRequestResource>

export async function claimInputRequest(
  db: InputRequestClaimDatabase,
  input: InputRequestClaimRequest,
): Promise<InputRequestClaimResult> {
  const result = await claimControlRequest(db, inputRequestResource, input.inputRequest, {
    leaseOwner: input.leaseOwner,
    leaseDurationMs: input.leaseDurationMs,
    now: input.now,
  })
  return {
    status: result.status,
    inputRequest: result.resource,
    leaseOwner: result.leaseOwner,
    leaseExpiresAt: result.leaseExpiresAt,
    ...(result.reason ? { reason: result.reason } : {}),
  }
}

export function isInputRequestStatusClaimable(status: unknown): boolean {
  return isControlRequestStatusClaimable(status)
}

export type { InputRequestRow, InputRequestUpdate }
