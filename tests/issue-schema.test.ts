import { describe, expect, it } from 'vitest'
import {
  approvalResource,
  auditResource,
  evidenceResource,
  ideaResource,
  issueResource,
  reportResource,
} from '../src'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
}

describe('issue schema', () => {
  it('models idea as an uncommitted candidate linked to source conversation', () => {
    const ideaColumns = columnsOf(ideaResource)

    expect(ideaColumns.summary).toBeDefined()
    expect(ideaColumns.input).toBeDefined()
    expect(ideaColumns.status).toBeDefined()
    expect(ideaColumns.commitment).toBeDefined()
    expect(ideaColumns.currentUnderstanding).toBeDefined()
    expect(ideaColumns.openQuestions).toBeDefined()
    expect(ideaColumns.related).toBeDefined()
    expect(ideaColumns.promotedTo).toBeDefined()
    expect(ideaColumns.chat).toBeDefined()
    expect(ideaColumns.thread).toBeDefined()
    expect(ideaColumns.sourceMessages).toBeDefined()
    expect(ideaColumns.sourceId).toBeUndefined()
    expect(ideaColumns.sourceUri).toBeUndefined()
  })

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

  it('models evidence and report as conclusion support records, not opaque files', () => {
    const evidenceColumns = columnsOf(evidenceResource)
    const reportColumns = columnsOf(reportResource)

    expect(evidenceColumns.evidenceKind).toBeDefined()
    expect(evidenceColumns.subject).toBeDefined()
    expect(evidenceColumns.issue).toBeDefined()
    expect(evidenceColumns.task).toBeDefined()
    expect(evidenceColumns.delivery).toBeDefined()
    expect(evidenceColumns.run).toBeDefined()
    expect(evidenceColumns.artifact).toBeDefined()
    expect(evidenceColumns.outcome).toBeDefined()

    expect(reportColumns.reportKind).toBeDefined()
    expect(reportColumns.subject).toBeDefined()
    expect(reportColumns.evidence).toBeDefined()
    expect(reportColumns.summary).toBeDefined()
    expect(reportColumns.outcome).toBeDefined()
    expect(reportColumns.metricFacts).toBeDefined()
    expect(reportColumns.publishedAt).toBeDefined()

    expect(evidenceColumns.subjectId).toBeUndefined()
    expect(reportColumns.subjectId).toBeUndefined()
    expect(reportColumns.evidenceIds).toBeUndefined()
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
