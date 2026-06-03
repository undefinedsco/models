import { AS, DCTerms, ODRL, UDFS } from '../namespaces'

export const ApprovalVocab = {
  session: UDFS.session,
  toolCallId: UDFS.toolCallId,
  toolName: UDFS.toolName,
  target: ODRL.target,
  action: ODRL.action,
  risk: UDFS.risk,
  status: UDFS.status,
  assignedTo: UDFS.assignedTo,
  decisionBy: UDFS.decisionBy,
  decisionRole: UDFS.decisionRole,
  onBehalfOf: UDFS.onBehalfOf,
  reason: UDFS.reason,
  context: UDFS.context,
  approvalOptions: UDFS.approvalOptions,
  policyVersion: UDFS.policyVersion,
  createdAt: DCTerms.created,
  expiresAt: UDFS.expiresAt,
  resolvedAt: UDFS.resolvedAt,
} as const

export const AuditVocab = {
  action: UDFS.action,
  actor: UDFS.actor,
  actorRole: UDFS.actorRole,
  onBehalfOf: UDFS.onBehalfOf,
  session: UDFS.session,
  entry: UDFS.entry,
  toolCallId: UDFS.toolCallId,
  toolName: UDFS.toolName,
  approval: UDFS.approval,
  policy: UDFS.policy,
  policyVersion: UDFS.policyVersion,
  createdAt: DCTerms.created,
} as const

export const GrantVocab = {
  target: ODRL.target,
  action: ODRL.action,
  title: DCTerms.title,
  summary: DCTerms.abstract,
  description: DCTerms.description,
  schema: DCTerms.conformsTo,
  pageKind: UDFS.pageKind,
  wikiStatus: UDFS.status,
  tags: UDFS.tags,
  source: UDFS.sourceKind,
  sourceHash: UDFS.sourceHash,
  compiledAt: UDFS.compiledAt,
  compiledFrom: UDFS.compiledFrom,
  related: DCTerms.relation,
  effect: UDFS.effect,
  riskCeiling: UDFS.riskCeiling,
  policy: UDFS.policy,
  context: UDFS.context,
  decisionBy: UDFS.decisionBy,
  decisionRole: UDFS.decisionRole,
  onBehalfOf: UDFS.onBehalfOf,
  createdAt: DCTerms.created,
  revokedAt: UDFS.revokedAt,
} as const

/**
 * Legacy predicates written by @undefineds.co/models <= 0.2.33.
 *
 * Keep this small compatibility surface so readers can accept old Pod grants
 * while new writers use `GrantVocab`.
 */
export const LegacyGrantVocab = {
  summary: UDFS.summary,
  body: UDFS.body,
  source: UDFS.source,
  related: UDFS.related,
} as const

export const GrantReadVocab = {
  summary: [GrantVocab.summary, LegacyGrantVocab.summary],
  description: [GrantVocab.description, LegacyGrantVocab.body],
  source: [GrantVocab.source, LegacyGrantVocab.source],
  related: [GrantVocab.related, LegacyGrantVocab.related],
} as const

export const InboxNotificationVocab = {
  actor: AS.actor,
  object: AS.object,
  createdAt: DCTerms.created,
} as const
