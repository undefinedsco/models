import { describe, expect, it } from 'vitest'
import {
  approvalResource,
  auditResource,
  automationRuleResource,
  AS,
  DCTerms,
  deliveryResource,
  evidenceResource,
  grantResource,
  ideaResource,
  issueResource,
  reportResource,
  SCHEMA,
  taskResource,
  UDFS,
  GrantReadVocab,
  GrantVocab,
  LegacyGrantVocab,
} from '../src'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
}

function resourceConfigOf(resource: unknown): { namespace?: unknown } {
  return ((resource as any)?._?.config ?? (resource as any)?.config) as { namespace?: unknown }
}

function predicateOf(resource: unknown, field: string): string {
  const column = columnsOf(resource)[field] as { getPredicate?: (namespace?: unknown) => string }
  return column.getPredicate?.(resourceConfigOf(resource).namespace) ?? ''
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
    expect(ideaResource.getSubjectTemplate()).toBeUndefined()
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

  it('models evidence and report as file-backed conclusion support metadata', () => {
    const evidenceColumns = columnsOf(evidenceResource)
    const reportColumns = columnsOf(reportResource)

    expect(evidenceColumns.evidenceKind).toBeDefined()
    expect(evidenceColumns.about).toBeDefined()
    expect(evidenceColumns.issue).toBeDefined()
    expect(evidenceColumns.task).toBeDefined()
    expect(evidenceColumns.delivery).toBeDefined()
    expect(evidenceColumns.run).toBeDefined()
    expect(evidenceColumns.summary).toBeDefined()
    expect(evidenceColumns.outcome).toBeDefined()

    expect(reportColumns.reportKind).toBeDefined()
    expect(reportColumns.about).toBeDefined()
    expect(reportColumns.evidence).toBeDefined()
    expect(reportColumns.summary).toBeDefined()
    expect(reportColumns.outcome).toBeDefined()
    expect(reportColumns.metricFacts).toBeDefined()
    expect(reportColumns.publishedAt).toBeDefined()

    expect(evidenceColumns.title).toBeUndefined()
    expect(evidenceColumns.content).toBeUndefined()
    expect(reportColumns.title).toBeUndefined()
    expect(reportColumns.content).toBeUndefined()
    expect(evidenceColumns.artifact).toBeUndefined()
    expect(reportColumns.artifact).toBeUndefined()
    expect(evidenceColumns.subject).toBeUndefined()
    expect(reportColumns.subject).toBeUndefined()
    expect(evidenceColumns.subjectId).toBeUndefined()
    expect(reportColumns.subjectId).toBeUndefined()
    expect(reportColumns.evidenceIds).toBeUndefined()
  })

  it('uses community vocabularies for common issue/evidence/report predicates', () => {
    expect(predicateOf(ideaResource, 'summary')).toBe(DCTerms.abstract)
    expect(predicateOf(ideaResource, 'input')).toBe(DCTerms.description)
    expect(predicateOf(ideaResource, 'related')).toBe(DCTerms.relation)
    expect(predicateOf(ideaResource, 'sourceMessages')).toBe(DCTerms.source)

    expect(predicateOf(evidenceResource, 'about')).toBe(SCHEMA.about)
    expect(predicateOf(evidenceResource, 'summary')).toBe(DCTerms.abstract)
    expect(predicateOf(evidenceResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(evidenceResource, 'actor')).toBe(DCTerms.creator)
    expect(predicateOf(evidenceResource, 'outcome')).toBe(UDFS.outcome)

    expect(predicateOf(reportResource, 'about')).toBe(SCHEMA.about)
    expect(predicateOf(reportResource, 'summary')).toBe(DCTerms.abstract)
    expect(predicateOf(reportResource, 'reviewer')).toBe(SCHEMA.reviewedBy)
    expect(predicateOf(reportResource, 'actor')).toBe(DCTerms.creator)
    expect(predicateOf(reportResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(reportResource, 'publishedAt')).toBe(DCTerms.issued)

    expect(predicateOf(taskResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(deliveryResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(deliveryResource, 'target')).toBe(AS.target)
    expect(predicateOf(automationRuleResource, 'source')).toBe(DCTerms.source)
    expect(predicateOf(automationRuleResource, 'target')).toBe(AS.target)
  })

  it('keeps grant prose as description and reserves long content for linked files', () => {
    expect(predicateOf(grantResource, 'summary')).toBe(DCTerms.abstract)
    expect(predicateOf(grantResource, 'description')).toBe(DCTerms.description)
    expect(predicateOf(grantResource, 'related')).toBe(DCTerms.relation)
    expect(predicateOf(grantResource, 'source')).toBe(UDFS.sourceKind)
    expect((grantResource.columns as Record<string, unknown>).body).toBeUndefined()
    expect((grantResource.columns as Record<string, unknown>).content).toBeUndefined()
    expect(GrantVocab.description).toBe(DCTerms.description)
    expect(LegacyGrantVocab.body).toBe(UDFS.body)
    expect(GrantReadVocab.description).toEqual([DCTerms.description, UDFS.body])
    expect(GrantReadVocab.summary).toEqual([DCTerms.abstract, UDFS.summary])
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
