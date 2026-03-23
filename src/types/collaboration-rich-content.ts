/**
 * Wave A CP0: collaboration-related rich content items.
 *
 * These are data contracts stored in `MessageRow.richContent.items`.
 * They intentionally omit presentation/runtime wrapper fields.
 */

export type ToolRisk = 'low' | 'medium' | 'high'
export type ToolApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved'

export interface ToolApprovalRichContentItem {
  type: 'tool_approval'

  toolCallId: string
  toolName: string
  toolDescription: string
  arguments: Record<string, unknown>

  risk: ToolRisk
  status: ToolApprovalStatus

  approvedBy?: string
  approvedAt?: string

  // Audit fields
  decisionBy?: string
  decisionRole?: 'human' | 'secretary' | 'system'
  onBehalfOf?: string
  reason?: string
  policyVersion?: string
  inboxItemId?: string
}

export type TaskProgressStepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped'

export interface TaskProgressRichContentItem {
  type: 'task_progress'

  taskId: string
  title: string
  steps: Array<{
    id: string
    label: string
    status: TaskProgressStepStatus
    detail?: string
    duration?: number
  }>

  currentStep: number
  totalSteps: number
}

export type ToolCallStatus = 'calling' | 'waiting_approval' | 'running' | 'done' | 'error'

export interface ToolCallRichContentItem {
  type: 'tool'

  toolCallId: string
  toolName: string
  arguments: Record<string, unknown>

  status: ToolCallStatus
  result?: unknown
  error?: string
  duration?: number
}

export type CollaborationRichContentItem =
  | ToolApprovalRichContentItem
  | TaskProgressRichContentItem
  | ToolCallRichContentItem
