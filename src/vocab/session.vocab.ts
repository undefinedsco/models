import { DCTerms, UDFS } from '../namespaces'

export const SessionVocab = {
  owner: UDFS.actor,
  chat: UDFS.conversation,
  thread: UDFS.inThread,
  sessionType: UDFS.conversationType,
  status: UDFS.sessionStatus,
  tool: UDFS.sessionTool,
  tokenUsage: UDFS.tokenUsage,
  messages: UDFS.message,
  policy: UDFS.policy,
  policyVersion: UDFS.policyVersion,
  metadata: UDFS.metadata,
  createdAt: DCTerms.created,
  updatedAt: DCTerms.modified,
  archivedAt: UDFS.archivedAt,
} as const
