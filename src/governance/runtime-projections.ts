import type { ApprovalInsert, ApprovalUpdate } from '../approval.schema.js'
import type { AuditInsert } from '../audit.schema.js'
import type { GrantInsert } from '../grant.schema.js'
import type { InboxNotificationInsert } from '../inbox-notification.schema.js'
import type { InboxApprovalEvent, SessionStateEvent, ToolCallEvent } from '../protocols/runtime-events.js'

// ============================================
// Runtime Event -> Governance Projection Helpers
//
// This module is SDK-level shared logic, similar to favorite sync:
// - It defines stable projections from normalized runtime events into Pod rows.
// - It does NOT assume xpod, linx, server processes, or any transport.
// - Callers remain responsible for executing writes with their own runtime/policy layer.
// ============================================

export type ChatSessionProjection = {
  chatId: string
  sessionStatus: 'active' | 'paused' | 'completed' | 'error'
  policy?: string
  policyVersion?: string
}

export type ApprovalProjectionInsert = Pick<
  ApprovalInsert,
  'session' | 'toolCallId' | 'toolName' | 'target' | 'action' | 'risk' | 'status' | 'policyVersion'
>

export type ApprovalProjectionUpdate = Partial<
  Pick<
    ApprovalUpdate,
    'status' | 'assignedTo' | 'decisionBy' | 'decisionRole' | 'onBehalfOf' | 'reason' | 'policyVersion' | 'resolvedAt'
  >
>

export type AuditProjectionInsert = Pick<
  AuditInsert,
  'action' | 'actor' | 'actorRole' | 'onBehalfOf' | 'session' | 'toolCallId' | 'approval' | 'context' | 'policy' | 'policyVersion'
>

export type GrantProjectionInsert = Pick<
  GrantInsert,
  'target' | 'action' | 'effect' | 'riskCeiling' | 'decisionBy' | 'decisionRole' | 'onBehalfOf'
>

export type InboxNotificationProjectionInsert = Pick<
  InboxNotificationInsert,
  'actor' | 'object'
>

export const RuntimeEventProjectionRules = {
  tool_call_waiting_approval: {
    approval: 'insert' as const,
    inboxNotification: 'insert' as const,
    audit: null,
    grant: null,
  },
  tool_call_approved_or_rejected: {
    approval: 'update' as const,
    inboxNotification: 'insert' as const,
    audit: 'insert' as const,
    grant: null,
  },
  inbox_approval_resolved: {
    approval: 'update' as const,
    inboxNotification: 'insert' as const,
    audit: null,
    grant: null,
  },
  session_state_terminal: {
    chat: 'update' as const,
  },
} as const

export type RuntimeEventProjectionRuleKey = keyof typeof RuntimeEventProjectionRules

export function hasPodScope(scope: { target?: string; action?: string }): scope is { target: string; action: string } {
  return typeof scope.target === 'string' && scope.target.length > 0 && typeof scope.action === 'string' && scope.action.length > 0
}

export function isToolWaitingApproval(event: ToolCallEvent): boolean {
  return event.type === 'tool.call' && event.status === 'waiting_approval'
}

export function isToolDecisionEvent(event: ToolCallEvent): boolean {
  return event.type === 'tool.call' && (event.status === 'approved' || event.status === 'rejected')
}

export function isInboxResolved(event: InboxApprovalEvent): boolean {
  return event.type === 'inbox.approval' && event.status !== 'pending'
}

export function isSessionTerminal(event: SessionStateEvent): boolean {
  return event.type === 'session.state' && (event.status === 'completed' || event.status === 'error')
}
