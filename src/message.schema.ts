import { object, podTable, uri, string, text, timestamp, id, renderDefaultIdTemplate } from '@undefineds.co/drizzle-solid'
import { UDFS, DCTerms, FOAF, MEETING, SCHEMA, SIOC, WF } from './namespaces'
import { chatResource } from './chat.schema'
import { threadResource } from './thread.schema'
import { resourceKey } from './resource-id-defaults'

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
 * - Message belongs to a neutral product scope: usually a Chat, sometimes a
 *   Task/thread execution timeline.
 * - Chat remains the Solid Chat compatibility relation. When present, the
 *   message is written under the Chat message bucket and projected through
 *   wf:message.
 * - Thread is optional and appears when a message participates in an explicit
 *   AI/task/branch timeline.
 *
 * Storage structure:
 * - Location: /.data/chat/{chat|id}/{yyyy}/{MM}/{dd}/messages.ttl#{id}
 * - Date-based path for efficient time-range queries
 * - chat/thread are RDF URI relations. Short ids remain accepted at API/query call sites via ORM URI template resolution.
 */
export const messageResource = podTable(
  'chat_message',
  {
    id: id('id').default((key: string | undefined, row?: Record<string, unknown>) => (
      renderDefaultIdTemplate(
        row?.chat
          ? 'chat/{chat.key}/{yyyy}/{MM}/{dd}/messages.ttl#{key}'
          : row?.thread
          ? '{thread.dir}/{yyyy}/{MM}/{dd}/messages.ttl#{key}'
          : '{scope.dir}/{yyyy}/{MM}/{dd}/messages.ttl#{key}',
        {
          key: resourceKey(key, 'msg'),
          row,
          links: {
            chat: chatResource,
            thread: threadResource,
          },
        },
      )
    )),

    // Canonical product owner scope. The object can be a Chat, Task, Thread, or future command surface.
    scope: uri('scope').predicate(UDFS.inScope),

    // Solid Chat compatibility relation. In RDF this is an inverse link: <chat> wf:message <message>.
    chat: uri('chat').predicate(WF.message).inverse().link(chatResource),

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
