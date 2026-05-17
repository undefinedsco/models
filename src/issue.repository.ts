import { definePodRepository } from './repository'
import { issueResource, type IssueInsert, type IssueRow, type IssueUpdate } from './issue.schema'

export const issueRepository = definePodRepository<
  typeof issueResource,
  IssueRow,
  IssueInsert,
  IssueUpdate
>({
  namespace: 'issue',
  table: issueResource,
  searchableFields: ['title', 'description'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
})
