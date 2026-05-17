import { describe, expect, it } from 'vitest'
import {
  approvalResource,
  auditResource,
  issueResource,
} from '../src'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
}

describe('issue schema', () => {
  it('models issue as the user-facing work item linked to chat process', () => {
    const issueColumns = columnsOf(issueResource)

    expect(issueColumns.title).toBeDefined()
    expect(issueColumns.description).toBeDefined()
    expect(issueColumns.status).toBeDefined()
    expect(issueColumns.priority).toBeDefined()
    expect(issueColumns.chat).toBeDefined()
    expect(issueColumns.thread).toBeDefined()
    expect(issueColumns.tasks).toBeDefined()
    expect(issueColumns.taskRefs).toBeUndefined()
  })

  it('keeps approval and audit process links explicit instead of overloading ODRL target', () => {
    const approvalColumns = columnsOf(approvalResource)
    const auditColumns = columnsOf(auditResource)

    expect(approvalColumns.target).toBeDefined()
    expect(approvalColumns.action).toBeDefined()
    expect(approvalColumns.chat).toBeDefined()
    expect(approvalColumns.thread).toBeDefined()

    expect(auditColumns.entry).toBeDefined()
    expect(auditColumns.chat).toBeDefined()
    expect(auditColumns.thread).toBeDefined()
  })
})
