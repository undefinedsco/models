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

export interface ApprovalDecisionRequest {
  /** Exact Approval IRI, including its fragment when present. */
  approval: string
  decision: 'approved' | 'rejected'
  decisionBy: string
  authenticatedFetch: typeof fetch
  /** Guards a shell/session switch before the one conditional write. */
  isCurrent?: () => boolean
  now?: () => Date
}

export interface ApprovalDecisionResult {
  status: 'decided' | 'conflict' | 'not_found' | 'not_actionable' | 'unavailable'
  reason?: string
}

/**
 * Temporary protocol adapter until drizzle-solid offers exact conditional writes.
 * The decision is based on the same document version passed to If-Match. Never
 * retry 412: doing so would overwrite a competing client's terminal decision.
 */
export async function decideApprovalRequest(input: ApprovalDecisionRequest): Promise<ApprovalDecisionResult> {
  const { Parser, Writer, DataFactory } = await import('n3')
  const { UDFS, RDF } = await import('./namespaces')
  const approval = new URL(input.approval)
  const decisionBy = new URL(input.decisionBy)
  if (![approval, decisionBy].every(url => ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password)) {
    throw new Error('Approval and decision identity must be HTTP(S) IRIs without credentials.')
  }
  if (!['approved', 'rejected'].includes(input.decision)) throw new Error('Invalid approval decision.')
  const subject = approval.href
  approval.hash = ''
  const documentUrl = approval.href
  const response = await input.authenticatedFetch(documentUrl, {
    headers: { accept: 'text/turtle' }, cache: 'no-store', redirect: 'error',
  })
  if (response.status === 404) return { status: 'not_found' }
  if (!response.ok) throw new Error(`Approval read failed: HTTP ${response.status}`)
  const etag = response.headers.get('etag')
  const text = await response.text()
  if (!etag || !/^"[^"\r\n]+"$/.test(etag)) return { status: 'unavailable', reason: 'A strong ETag is required for approval decisions.' }
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/turtle')) {
    return { status: 'unavailable', reason: 'The approval document must be served as Turtle.' }
  }
  const quads = new Parser({ baseIRI: documentUrl }).parse(text) as import('n3').Quad[]
  const values = (predicate: string) => quads.filter(quad => quad.subject.termType === 'NamedNode' && quad.subject.value === subject && quad.predicate.value === predicate).map(quad => quad.object)
  if (!values(RDF.type).some(term => term.termType === 'NamedNode' && term.value === UDFS.ApprovalRequest)) return { status: 'not_found' }
  const statuses = values(UDFS.status)
  if (statuses.length !== 1 || statuses[0].termType !== 'Literal' || !['pending', 'handling'].includes(statuses[0].value) || values(UDFS.resolvedAt).length) {
    return { status: 'not_actionable', reason: 'Approval is already decided or has ambiguous state.' }
  }
  const assigned = values(UDFS.assignedTo)
  if (assigned.some(term => term.termType !== 'NamedNode' || term.value !== decisionBy.href)) return { status: 'not_actionable', reason: 'Approval belongs to another decision maker.' }
  const now = input.now ?? (() => new Date())
  const expired = () => values(UDFS.expiresAt).some(term => {
    const expires = Date.parse(term.value)
    return !Number.isFinite(expires) || expires <= now().getTime()
  })
  if (expired()) return { status: 'not_actionable', reason: 'Approval has expired.' }
  const leaseOwners = values(UDFS.leaseOwner)
  const leaseExpirations = values(UDFS.leaseExpiresAt)
  if ((leaseOwners.length || leaseExpirations.length) && (
    leaseOwners.length !== 1 || leaseOwners[0].termType !== 'Literal'
    || leaseExpirations.length !== 1 || leaseExpirations[0].termType !== 'Literal'
    || !Number.isFinite(Date.parse(leaseExpirations[0].value))
    || Date.parse(leaseExpirations[0].value) > now().getTime()
  )) {
    return { status: 'conflict', reason: 'Approval is being handled by another client.' }
  }
  const changed = new Set([UDFS.status, UDFS.decisionBy, UDFS.resolvedAt])
  const preserved = quads.filter(quad => quad.subject.value !== subject || !changed.has(quad.predicate.value))
  const node = DataFactory.namedNode(subject)
  preserved.push(
    DataFactory.quad(node, DataFactory.namedNode(UDFS.status), DataFactory.literal(input.decision)),
    DataFactory.quad(node, DataFactory.namedNode(UDFS.decisionBy), DataFactory.namedNode(decisionBy.href)),
    DataFactory.quad(node, DataFactory.namedNode(UDFS.resolvedAt), DataFactory.literal(now().toISOString(), DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))),
  )
  const body = await new Promise<string>((resolve, reject) => {
    const writer = new Writer({ format: 'Turtle' })
    writer.addQuads(preserved)
    writer.end((error, result) => error ? reject(error) : resolve(result))
  })
  if (input.isCurrent && !input.isCurrent()) return { status: 'not_actionable', reason: 'The current session changed.' }
  if (expired()) return { status: 'not_actionable', reason: 'Approval has expired.' }
  const result = await input.authenticatedFetch(documentUrl, {
    method: 'PUT', headers: { 'content-type': 'text/turtle', 'if-match': etag }, body, redirect: 'error',
  })
  await result.arrayBuffer()
  if (result.status === 412) return { status: 'conflict', reason: 'Another client changed the approval. Refresh before deciding again.' }
  if (!result.ok) throw new Error(`Approval decision failed: HTTP ${result.status}`)
  return { status: 'decided' }
}
