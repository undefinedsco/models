import { id, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { chatResource } from './chat.schema'
import {
  buildPersonalLinkedContextFilePath,
  type PersonalLinkedContextPathPolicy,
} from './personal-linked-context-paths'
import { threadResource } from './thread.schema'

export type IssueStatus = 'open' | 'triaging' | 'in_progress' | 'blocked' | 'resolved' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * File-primary user-facing work item.
 *
 * Issue is the product entry for a requirement, bug, support item,
 * investigation, or feature request. The markdown document owns the
 * human-readable problem statement, decision narrative, and acceptance
 * explanation. This resource stores queryable lifecycle and routing metadata.
 * Executable slices live in Task. The visible process remains
 * Chat/Thread/Message through chat/thread links.
 */
export const issueResource = Object.assign(podTable(
  'issue',
  {
    id: id('id').default('{key}.ttl'),

    title: string('title').predicate(DCTerms.title).notNull(),
    document: uri('document').predicate(DCTerms.source),
    description: text('description').predicate(DCTerms.description),
    status: string('status').predicate(UDFS.status).notNull().default('open'),
    priority: string('priority').predicate(UDFS.priority).default('medium'),
    labels: text('labels').array().predicate(UDFS.tags),

    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    parentIssue: uri('parentIssue').predicate(UDFS.parentIssue).link('issue'),
    tasks: uri('tasks').predicate(UDFS.task).array(),

    createdBy: uri('createdBy').predicate(DCTerms.creator),
    assignedTo: uri('assignedTo').predicate(UDFS.assignedTo),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
    closedAt: timestamp('closedAt').predicate(UDFS.closedAt),
    deletedAt: timestamp('deletedAt').predicate(UDFS.deletedAt),
  },
  {
    base: '/.data/issues/',
    sparqlEndpoint: '/.data/issues/-/sparql',
    type: UDFS.Issue,
    namespace: UDFS,
  },
), {
  defaultDocumentPath(
    row?: Record<string, unknown>,
    policy?: PersonalLinkedContextPathPolicy,
  ): string {
    return buildPersonalLinkedContextFilePath('issues', row, policy, {
      defaultExtension: 'md',
      titleFields: ['title', 'description', 'id'],
    })
  },
})

// Compatibility alias. New model code should prefer `issueResource`.
export const issueTable = issueResource

export type IssueRow = typeof issueResource.$inferSelect
export type IssueInsert = typeof issueResource.$inferInsert
export type IssueUpdate = typeof issueResource.$inferUpdate
