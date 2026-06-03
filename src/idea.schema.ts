import { id, object, podTable, string, text, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, UDFS } from './namespaces'
import { chatResource } from './chat.schema'
import { threadResource } from './thread.schema'

export type IdeaStatus = 'captured' | 'exploring' | 'candidate' | 'promoted' | 'deferred' | 'rejected' | 'superseded'
export type IdeaCommitment = 'thought' | 'direction' | 'tentative_decision' | 'committed'

/**
 * Lightweight candidate extracted from conversation.
 *
 * Idea is the buffer before committed work. It can reference source Messages
 * and related records, but it is not an Issue or Task until promoted.
 */
export const ideaResource = podTable(
  'idea',
  {
    id: id('id').default('{yyyy}/{MM}/{dd}.ttl#{key}'),

    summary: string('summary').predicate(DCTerms.abstract).notNull(),
    input: text('input').predicate(DCTerms.description),
    status: string('status').predicate(UDFS.status).notNull().default('captured'),
    commitment: string('commitment').predicate(UDFS.commitment).notNull().default('thought'),
    affectedArea: string('affectedArea').predicate(UDFS.affectedArea),
    currentUnderstanding: text('currentUnderstanding').predicate(UDFS.currentUnderstanding),
    openQuestions: text('openQuestions').array().predicate(UDFS.openQuestions),
    related: uri('related').array().predicate(DCTerms.relation),
    conflicts: text('conflicts').array().predicate(UDFS.conflicts),
    nextStep: text('nextStep').predicate(UDFS.nextStep),
    promotedTo: uri('promotedTo').predicate(UDFS.promotedTo),

    chat: uri('chat').predicate(UDFS.conversation).link(chatResource),
    thread: uri('thread').predicate(UDFS.inThread).link(threadResource),
    sourceMessages: uri('sourceMessages').array().predicate(DCTerms.source),
    createdBy: uri('createdBy').predicate(DCTerms.creator),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/.data/ideas/',
    sparqlEndpoint: '/.data/ideas/-/sparql',
    type: UDFS.Idea,
    namespace: UDFS,
  },
)

export type IdeaRow = typeof ideaResource.$inferSelect
export type IdeaInsert = typeof ideaResource.$inferInsert
export type IdeaUpdate = typeof ideaResource.$inferUpdate
