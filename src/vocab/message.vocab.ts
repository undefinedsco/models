import { DCTerms, FOAF, SCHEMA, SIOC, UDFS, WF } from '../namespaces'

export const MessageVocab = {
  // Existing
  thread: SIOC.has_member,
  chat: WF.message,
  maker: FOAF.maker,
  role: UDFS.messageType,
  content: SIOC.content,
  richContent: SIOC.richContent,
  status: UDFS.messageStatus,
  replacedBy: DCTerms.isReplacedBy,
  deletedAt: SCHEMA.dateDeleted,
  createdAt: DCTerms.created,
  updatedAt: DCTerms.modified,

  // Group message extensions
  senderName: UDFS.senderName,
  senderAvatarUrl: UDFS.senderAvatarUrl,
  mentions: UDFS.mentions,
  replyTo: UDFS.replyTo,

  // Multi-AI routing
  routedBy: UDFS.routedBy,
  routeTargetAgent: UDFS.routeTargetAgent,
  coordinationId: UDFS.coordinationId,
} as const
