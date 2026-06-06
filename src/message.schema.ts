import { object, podTable, uri, string, text, timestamp, id } from '@undefineds.co/drizzle-solid'
import { UDFS, DCTerms, FOAF, MEETING, SCHEMA, SIOC, WF } from './namespaces'
import { chatResource } from './chat.schema'
import { threadResource } from './thread.schema'

export type MessageRoleType = 'user' | 'assistant' | 'system'
export type MessageStatusType = 'in_progress' | 'completed' | 'incomplete' | 'sent'

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export const MessageStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  INCOMPLETE: 'incomplete',
  SENT: 'sent',
} as const


/**
 * Message resource (aligned with xpod).
 *
 * Product semantics:
 * - Message belongs to a Chat counterpart.
 * - Thread is optional and appears only when a message participates in an
 *   explicit AI/task/branch timeline.
 *
 * Storage structure:
 * - Location: /.data/chat/{chat|id}/{yyyy}/{MM}/{dd}/messages.ttl#{id}
 * - Date-based path for efficient time-range queries
 * - chat/thread are RDF URI relations. Short ids remain accepted at API/query call sites via ORM URI template resolution.
 */
export const messageResource = podTable(
  'chat_message',
  {
    id: id('id').default('chat/{chat.key}/{yyyy}/{MM}/{dd}/messages.ttl#{key}'),

    // Chat relation. In RDF this is an inverse Solid Chat link: <chat> wf:message <message>.
    chat: uri('chat').predicate(WF.message).inverse().notNull().link(chatResource),

    // Optional Thread relation. In RDF this is an inverse Solid Chat/SIOC link: <thread> sioc:has_member <message>.
    thread: uri('thread').predicate(SIOC.has_member).inverse().link(threadResource),

    // maker is the entity URI of the message author:
    // - User: their WebID (https://user.pod/profile/card#me)
    // - AI: Agent URI (/agents/{id}/)
    // - External: Contact URI (/.data/contacts/{id}.ttl#this)
    // No reference() constraint - accepts any valid URI.
    maker: uri('maker').predicate(FOAF.maker),

    role: string('role').predicate(UDFS.messageType).notNull().default(MessageRole.USER),
    content: text('content').predicate(SIOC.content).notNull(),
    richContent: text('richContent').predicate(SIOC.richContent),


    status: string('status').predicate(UDFS.messageStatus).notNull().default(MessageStatus.COMPLETED),
    toolName: string('toolName').predicate(UDFS.toolName),
    toolCallId: string('toolCallId').predicate(UDFS.toolCallId),
    // Opaque protocol/local/UI metadata only. Shared relations must be explicit URI fields.
    metadata: object('metadata').predicate(UDFS.metadata),
    replacedBy: string('replacedBy').predicate(DCTerms.isReplacedBy),
    deletedAt: timestamp('deletedAt').predicate(SCHEMA.dateDeleted),

    // Group message extensions
    senderName: string('senderName').predicate(UDFS.senderName),
    senderAvatarUrl: uri('senderAvatarUrl').predicate(UDFS.senderAvatarUrl),
    mentions: uri('mentions').array().predicate(UDFS.mentions),
    replyTo: uri('replyTo').predicate(UDFS.replyTo),

    // Multi-AI routing
    routedBy: uri('routedBy').predicate(UDFS.routedBy),
    routeTargetAgent: uri('routeTargetAgent').predicate(UDFS.routeTargetAgent),
    coordinationId: string('coordinationId').predicate(UDFS.coordinationId),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified),
  },
  {
    base: '/.data/',
    sparqlEndpoint: '/.data/-/sparql',
    type: MEETING.Message,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `messageResource`.
export const messageTable = messageResource

export type MessageRow = typeof messageResource.$inferSelect
export type MessageInsert = typeof messageResource.$inferInsert
export type MessageUpdate = typeof messageResource.$inferUpdate
