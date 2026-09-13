import { AS, DCTerms, FOAF, MEETING, ODRL, RDF, SCHEMA, SIOC, UDFS, VCARD, WF } from './namespaces'

export type PodModelDescriptorSource = 'official' | 'verified-community' | 'developer' | 'user'
export type PodModelDescriptorTrustLevel = 'high' | 'medium' | 'low'
export type PodModelFieldType = 'string' | 'text' | 'number' | 'boolean' | 'timestamp' | 'uri' | 'json'
export type PodModelMergePolicy = 'create-only' | 'upsert' | 'patch' | 'append'

export interface PodModelFieldDescriptor {
  type: PodModelFieldType
  predicate: string
  required?: boolean
  secret?: boolean
  array?: boolean
  description?: string
}

export interface PodModelDescriptor {
  uri: string
  version: string
  source: PodModelDescriptorSource
  trustLevel: PodModelDescriptorTrustLevel
  namespace: string
  class: string
  resourceKind: string
  description: string
  storage: {
    base: string
    resourceIdPattern: string
  }
  fields: Record<string, PodModelFieldDescriptor>
  uniqueBy: string[]
  writableFields: string[]
  mergePolicy: PodModelMergePolicy
  examples: Array<{
    request: string
    match: Record<string, unknown>
  }>
}

export interface PodStorageMutationPlan {
  id: string
  schemaUri: string
  operation: 'upsert'
  resourceId: string
  resourceUri: string
  match: Record<string, unknown>
  set: Record<string, unknown>
  summary: string
}

export type PodStorageValidationResult =
  | { ok: true; plan: PodStorageMutationPlan }
  | { ok: false; error: { code: string; message: string } }

export type PodStorageCommitResult =
  | { ok: true; resource: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string } }

export interface PodSchemaClassEntry {
  schemaUri: string
  resourceKind: string
  class: string
  namespace: string
  source: PodModelDescriptorSource
  trustLevel: PodModelDescriptorTrustLevel
  description: string
}

export interface PodSchemaPredicateEntry {
  schemaUri: string
  field: string
  predicate: string
  type: PodModelFieldType
  required: boolean
  secret: boolean
  array: boolean
  description?: string
}

export interface PodSchemaSearchEntry {
  uri: string
  resourceKind: string
  class: string
  namespace: string
  source: PodModelDescriptorSource
  trustLevel: PodModelDescriptorTrustLevel
  description: string
  score: number
  matchedFields: string[]
}

export const credentialDescriptor: PodModelDescriptor = {
  uri: UDFS.Credential,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Credential,
  resourceKind: 'credential',
  description: 'Generic credential material required by runtimes, tools, MCP servers, and providers.',
  storage: {
    base: '/settings/credentials.ttl',
    resourceIdPattern: '#{id}',
  },
  fields: {
    id: {
      type: 'string',
      predicate: UDFS.term('id'),
      required: true,
      description: 'Local credential id.',
    },
    service: {
      type: 'string',
      predicate: UDFS.service,
      required: true,
      description: 'Credential service grouping, for example ai or infra.',
    },
    providerId: {
      type: 'string',
      predicate: UDFS.provider,
      required: true,
      description: 'Provider identifier such as openai or cloudflare.',
    },
    secretType: {
      type: 'string',
      predicate: UDFS.secretType,
      required: true,
      description: 'Provider-specific secret kind such as api-key or tunnel-token.',
    },
    label: {
      type: 'string',
      predicate: UDFS.label,
      description: 'User-facing credential label.',
    },
    apiKey: {
      type: 'string',
      predicate: UDFS.apiKey,
      secret: true,
      description: 'Secret token or API key material.',
    },
    authMode: {
      type: 'string',
      predicate: UDFS.authMode,
      description: 'Authentication mode such as apiKey, oauth, deviceCode, or console.',
    },
    storageMode: {
      type: 'string',
      predicate: UDFS.storageMode,
      description: 'Credential storage format, for example plaintext-v1 or secret-cell-v1.',
    },
    secretPayload: {
      type: 'string',
      predicate: UDFS.secretPayload,
      secret: true,
      description: 'Storage-mode-specific credential payload. plaintext-v1 stores a JSON payload here.',
    },
    encryptedSecret: {
      type: 'string',
      predicate: UDFS.encryptedSecret,
      secret: true,
      description: 'Encrypted credential payload stored in the Pod.',
    },
    wrappedDataKey: {
      type: 'string',
      predicate: UDFS.wrappedDataKey,
      secret: true,
      description: 'Wrapped data-encryption key for encrypted credential payloads.',
    },
    encryptionAlgorithm: {
      type: 'string',
      predicate: UDFS.encryptionAlgorithm,
      description: 'Credential encryption algorithm identifier.',
    },
    keyVersion: {
      type: 'string',
      predicate: UDFS.keyVersion,
      description: 'Key-management version used to encrypt the credential.',
    },
    scopes: {
      type: 'text',
      predicate: UDFS.scopes,
      array: true,
      description: 'Credential scopes granted by the provider.',
    },
    expiresAt: {
      type: 'timestamp',
      predicate: UDFS.expiresAt,
      description: 'Credential expiry timestamp.',
    },
    accountLabel: {
      type: 'string',
      predicate: UDFS.accountLabel,
      description: 'Provider account label associated with the credential.',
    },
    lastRefreshAt: {
      type: 'timestamp',
      predicate: UDFS.lastRefreshAt,
      description: 'Last successful credential refresh timestamp.',
    },
    reauthRequired: {
      type: 'boolean',
      predicate: UDFS.reauthRequired,
      description: 'Whether this credential requires user reauthentication.',
    },
    status: {
      type: 'string',
      predicate: UDFS.status,
      description: 'Credential health status.',
    },
  },
  uniqueBy: ['service', 'providerId', 'secretType'],
  writableFields: [
    'label',
    'apiKey',
    'authMode',
    'storageMode',
    'secretPayload',
    'encryptedSecret',
    'wrappedDataKey',
    'encryptionAlgorithm',
    'keyVersion',
    'scopes',
    'expiresAt',
    'accountLabel',
    'lastRefreshAt',
    'reauthRequired',
    'status',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: '保存 Cloudflare tunnel token',
      match: {
        service: 'infra',
        providerId: 'cloudflare',
        secretType: 'tunnel-token',
      },
    },
    {
      request: '保存 OpenAI API key',
      match: {
        service: 'ai',
        providerId: 'openai',
        secretType: 'api-key',
      },
    },
  ],
}

export const gatewayAccessKeyDescriptor: PodModelDescriptor = {
  uri: UDFS.GatewayAccessKey,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.GatewayAccessKey,
  resourceKind: 'gateway-access-key',
  description: 'Control-primary Pod AI Gateway access key. The key owner is a semantic WebID/URI relation, while the secret itself is represented only by a hash.',
  storage: exactIdStorage(),
  fields: {
    id: {
      type: 'string',
      predicate: UDFS.term('id'),
      required: true,
      description: 'Base-relative resource id, for example ai/gateway/access-keys.ttl#key_1.',
    },
    owner: {
      type: 'uri',
      predicate: UDFS.owner,
      required: true,
      description: 'WebID or principal URI that owns this Gateway access key.',
    },
    secretHash: {
      type: 'string',
      predicate: UDFS.secretHash,
      required: true,
      secret: true,
      description: 'Hash of the Gateway secret. Raw access key material must not be stored here.',
    },
    name: {
      type: 'string',
      predicate: UDFS.name,
      description: 'User-visible label for distinguishing this Gateway access key.',
    },
    deployment: {
      type: 'string',
      predicate: UDFS.deployment,
      required: true,
      description: 'Gateway deployment target: local or cloud.',
    },
    scopes: {
      type: 'text',
      predicate: UDFS.scopes,
      array: true,
      description: 'Gateway scopes granted to this key.',
    },
    createdAt: {
      type: 'timestamp',
      predicate: UDFS.createdAt,
      description: 'Creation timestamp.',
    },
    expiresAt: {
      type: 'timestamp',
      predicate: UDFS.expiresAt,
      description: 'Key expiry timestamp.',
    },
    lastUsedAt: {
      type: 'timestamp',
      predicate: UDFS.lastUsedAt,
      description: 'Last successful Gateway use timestamp.',
    },
    revokedAt: {
      type: 'timestamp',
      predicate: UDFS.revokedAt,
      description: 'Revocation timestamp. Presence means the key is no longer valid.',
    },
  },
  uniqueBy: ['id'],
  writableFields: [
    'owner',
    'secretHash',
    'name',
    'deployment',
    'scopes',
    'createdAt',
    'expiresAt',
    'lastUsedAt',
    'revokedAt',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Create a local Gateway access key for a user',
      match: { id: 'ai/gateway/access-keys.ttl#key_1' },
    },
  ],
}

export const quotaSnapshotDescriptor: PodModelDescriptor = {
  uri: UDFS.QuotaSnapshot,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.QuotaSnapshot,
  resourceKind: 'quota-snapshot',
  description: 'Observed Pod AI Gateway quota state for a provider credential. The credential field is a semantic URI relation, and normalized windows are stored as a serialized literal.',
  storage: exactIdStorage(),
  fields: {
    id: {
      type: 'string',
      predicate: UDFS.term('id'),
      required: true,
      description: 'Base-relative resource id, for example ai/gateway/quota.ttl#quota_1.',
    },
    credential: {
      type: 'uri',
      predicate: UDFS.credential,
      required: true,
      description: 'Credential resource URI this quota snapshot describes.',
    },
    owner: {
      type: 'uri',
      predicate: UDFS.owner,
      required: true,
      description: 'WebID that owns the credential and quota snapshot.',
    },
    deployment: {
      type: 'string',
      predicate: UDFS.deployment,
      required: true,
      description: 'Gateway deployment scope: local or cloud.',
    },
    provider: {
      type: 'string',
      predicate: UDFS.provider,
      required: true,
      description: 'Normalized provider id for the quota snapshot.',
    },
    status: {
      type: 'string',
      predicate: UDFS.status,
      required: true,
      description: 'Quota availability status: available, unsupported, or error.',
    },
    balance: {
      type: 'number',
      predicate: UDFS.balance,
      description: 'Normalized remaining quota balance when the provider exposes one.',
    },
    windows: {
      type: 'text',
      predicate: UDFS.windows,
      description: 'Serialized normalized quota windows literal, for example JSON produced by Gateway normalization.',
    },
    observedAt: {
      type: 'timestamp',
      predicate: UDFS.observedAt,
      description: 'Observation timestamp.',
    },
    expiresAt: {
      type: 'timestamp',
      predicate: UDFS.expiresAt,
      description: 'Snapshot freshness expiry timestamp.',
    },
    source: {
      type: 'string',
      predicate: UDFS.source,
      description: 'Observation source such as provider, gateway-cache, or manual.',
    },
  },
  uniqueBy: ['id'],
  writableFields: [
    'credential',
    'status',
    'balance',
    'windows',
    'observedAt',
    'expiresAt',
    'source',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Record a fresh quota snapshot for a provider credential',
      match: { id: 'ai/gateway/quota.ttl#quota_1' },
    },
  ],
}

export const approvalDescriptor: PodModelDescriptor = {
  uri: UDFS.ApprovalRequest,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.ApprovalRequest,
  resourceKind: 'approval',
  description: 'Durable approval request control item. Solid inbox notifications may point at this resource, but lifecycle and claim state live here.',
  storage: {
    base: '/.data/approvals/',
    resourceIdPattern: '{id}',
  },
  fields: {
    id: {
      type: 'string',
      predicate: UDFS.term('id'),
      required: true,
      description: 'Approval request resource id, including date bucket and fragment when materialized.',
    },
    session: {
      type: 'uri',
      predicate: UDFS.session,
      required: true,
      description: 'Runtime/session resource that requested approval.',
    },
    chat: {
      type: 'uri',
      predicate: UDFS.conversation,
      description: 'Related chat command surface.',
    },
    thread: {
      type: 'uri',
      predicate: UDFS.inThread,
      description: 'Related concrete thread/work site.',
    },
    toolCallId: {
      type: 'string',
      predicate: UDFS.toolCallId,
      required: true,
      description: 'Opaque runtime tool-call identifier; not an RDF resource link.',
    },
    toolName: {
      type: 'string',
      predicate: UDFS.toolName,
      required: true,
      description: 'Runtime tool name that requires approval.',
    },
    target: {
      type: 'uri',
      predicate: ODRL.target,
      required: true,
      description: 'Target resource for the requested action. Schema field uses ODRL target in the executable resource.',
    },
    action: {
      type: 'uri',
      predicate: ODRL.action,
      required: true,
      description: 'Requested action URI. Schema field uses ODRL action in the executable resource.',
    },
    risk: {
      type: 'string',
      predicate: UDFS.risk,
      required: true,
      description: 'Risk level assigned by the runtime or policy layer.',
    },
    status: {
      type: 'string',
      predicate: UDFS.status,
      description: 'Approval lifecycle status such as pending, handling, approved, rejected, resolved, or expired.',
    },
    leaseOwner: {
      type: 'string',
      predicate: UDFS.leaseOwner,
      description: 'Client/runtime id that currently owns the Inbox/approval handling lease.',
    },
    leaseExpiresAt: {
      type: 'timestamp',
      predicate: UDFS.leaseExpiresAt,
      description: 'Expiration timestamp for the handling lease.',
    },
    assignedTo: {
      type: 'uri',
      predicate: UDFS.assignedTo,
      description: 'WebID or agent resource assigned to decide the request.',
    },
    decisionBy: {
      type: 'uri',
      predicate: UDFS.decisionBy,
      description: 'WebID or agent resource that made the decision.',
    },
    decisionRole: {
      type: 'string',
      predicate: UDFS.decisionRole,
      description: 'Role of the decision maker, for example human or secretary.',
    },
    onBehalfOf: {
      type: 'uri',
      predicate: UDFS.onBehalfOf,
      description: 'User WebID or principal on whose behalf the decision applies.',
    },
    reason: {
      type: 'text',
      predicate: UDFS.reason,
      description: 'Decision reason or policy explanation.',
    },
    context: {
      type: 'text',
      predicate: UDFS.context,
      description: 'Concise request context. Long evidence belongs in linked files/resources.',
    },
    approvalOptions: {
      type: 'text',
      predicate: UDFS.approvalOptions,
      description: 'Serialized approval options offered by the runtime.',
    },
    policyVersion: {
      type: 'string',
      predicate: UDFS.policyVersion,
      description: 'Policy version used to create or resolve this approval.',
    },
    createdAt: {
      type: 'timestamp',
      predicate: DCTerms.created,
      description: 'Creation timestamp.',
    },
    expiresAt: {
      type: 'timestamp',
      predicate: UDFS.expiresAt,
      description: 'Business deadline after which the request should no longer be acted on.',
    },
    resolvedAt: {
      type: 'timestamp',
      predicate: UDFS.resolvedAt,
      description: 'Decision timestamp.',
    },
  },
  uniqueBy: ['id'],
  writableFields: [
    'session',
    'chat',
    'thread',
    'toolCallId',
    'toolName',
    'target',
    'action',
    'risk',
    'status',
    'leaseOwner',
    'leaseExpiresAt',
    'assignedTo',
    'decisionBy',
    'decisionRole',
    'onBehalfOf',
    'reason',
    'context',
    'approvalOptions',
    'policyVersion',
    'expiresAt',
    'resolvedAt',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Claim a pending approval from Inbox subscription',
      match: {
        id: '2026/06/12.ttl#approval_1',
      },
    },
  ],
}

export const inputRequestDescriptor: PodModelDescriptor = {
  uri: UDFS.InputRequest,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.InputRequest,
  resourceKind: 'input-request',
  description: 'Durable input request control item. It asks for missing information or a choice; approval/authority decisions remain ApprovalRequest.',
  storage: {
    base: '/.data/input-requests/',
    resourceIdPattern: '{id}',
  },
  fields: {
    id: {
      type: 'string',
      predicate: UDFS.term('id'),
      required: true,
      description: 'Input request resource id, including date bucket and fragment when materialized.',
    },
    session: {
      type: 'uri',
      predicate: UDFS.session,
      required: true,
      description: 'Runtime/session resource waiting for input.',
    },
    chat: {
      type: 'uri',
      predicate: UDFS.conversation,
      description: 'Related chat command surface.',
    },
    thread: {
      type: 'uri',
      predicate: UDFS.inThread,
      description: 'Related concrete thread/work site.',
    },
    run: {
      type: 'uri',
      predicate: UDFS.run,
      description: 'Run waiting for input.',
    },
    task: {
      type: 'uri',
      predicate: UDFS.task,
      description: 'Task whose execution requires input.',
    },
    requester: {
      type: 'uri',
      predicate: UDFS.requester,
      description: 'Runtime, worker, or Secretary resource that requested input.',
    },
    requestKind: {
      type: 'string',
      predicate: UDFS.requestKind,
      required: true,
      description: 'Input request category such as user-input, clarification, binding, or selection.',
    },
    prompt: {
      type: 'text',
      predicate: UDFS.prompt,
      required: true,
      description: 'Question or missing-information prompt.',
    },
    context: {
      type: 'text',
      predicate: UDFS.context,
      description: 'Concise request context. Long evidence belongs in linked files/resources.',
    },
    inputOptions: {
      type: 'text',
      predicate: UDFS.inputOptions,
      description: 'Serialized options offered for the input request.',
    },
    status: {
      type: 'string',
      predicate: UDFS.status,
      description: 'Input request lifecycle status such as pending, handling, resolved, expired, or cancelled.',
    },
    leaseOwner: {
      type: 'string',
      predicate: UDFS.leaseOwner,
      description: 'Client/runtime id that currently owns the Inbox/input handling lease.',
    },
    leaseExpiresAt: {
      type: 'timestamp',
      predicate: UDFS.leaseExpiresAt,
      description: 'Expiration timestamp for the handling lease.',
    },
    assignedTo: {
      type: 'uri',
      predicate: UDFS.assignedTo,
      description: 'WebID or agent resource assigned to answer the request.',
    },
    response: {
      type: 'text',
      predicate: UDFS.response,
      description: 'Answer, selected option, or input supplied to unblock the run.',
    },
    answeredBy: {
      type: 'uri',
      predicate: UDFS.answeredBy,
      description: 'WebID or agent resource that supplied the response.',
    },
    onBehalfOf: {
      type: 'uri',
      predicate: UDFS.onBehalfOf,
      description: 'User WebID or principal on whose behalf the response applies.',
    },
    reason: {
      type: 'text',
      predicate: UDFS.reason,
      description: 'Reason or explanation for the response.',
    },
    metadata: {
      type: 'json',
      predicate: UDFS.metadata,
      description: 'Opaque protocol-local metadata; shared relations must be explicit fields.',
    },
    createdAt: {
      type: 'timestamp',
      predicate: DCTerms.created,
      description: 'Creation timestamp.',
    },
    expiresAt: {
      type: 'timestamp',
      predicate: UDFS.expiresAt,
      description: 'Business deadline after which the request should no longer be acted on.',
    },
    resolvedAt: {
      type: 'timestamp',
      predicate: UDFS.resolvedAt,
      description: 'Resolution timestamp.',
    },
  },
  uniqueBy: ['id'],
  writableFields: [
    'session',
    'chat',
    'thread',
    'run',
    'task',
    'requester',
    'requestKind',
    'prompt',
    'context',
    'inputOptions',
    'status',
    'leaseOwner',
    'leaseExpiresAt',
    'assignedTo',
    'response',
    'answeredBy',
    'onBehalfOf',
    'reason',
    'metadata',
    'expiresAt',
    'resolvedAt',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Claim a pending input request from Inbox subscription',
      match: {
        id: '2026/06/12.ttl#input_1',
      },
    },
  ],
}


function exactIdStorage(base = '/.data/'): PodModelDescriptor['storage'] {
  return {
    base,
    resourceIdPattern: '{id}',
  }
}

const idField: PodModelFieldDescriptor = {
  type: 'string',
  predicate: UDFS.term('id'),
  required: true,
  description: 'Base-relative resource id. For exact-id descriptors this includes the full document path and optional fragment.',
}

export const captureCandidateDescriptor: PodModelDescriptor = {
  uri: UDFS.CaptureCandidate,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.CaptureCandidate,
  resourceKind: 'capture-candidate',
  description: 'Temporary capture suggestion created from observed or ambiguous content. It is not formal memory until promoted through the appropriate typed resource and control flow.',
  storage: exactIdStorage('/.data/capture/'),
  fields: {
    id: idField,
    source: { type: 'uri', predicate: DCTerms.source, required: true, description: 'Original message, file, URL, fetched document, or resource being considered.' },
    summary: { type: 'text', predicate: DCTerms.abstract, required: true, description: 'Concise statement of what might be worth saving.' },
    suggestedType: { type: 'uri', predicate: UDFS.suggestedType, description: 'Proposed formal resource class such as Idea, Evidence, Note, Decision, Preference, Link, or ContactInfo.' },
    suggestedTarget: { type: 'uri', predicate: UDFS.suggestedTarget, description: 'Proposed folder, collection, project, task, issue, chat, or other scope.' },
    confidence: { type: 'string', predicate: UDFS.confidence, description: 'Classifier confidence: high, medium, or low.' },
    reason: { type: 'text', predicate: UDFS.reason, description: 'Short rationale for why this source might be worth capturing.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Candidate lifecycle status such as candidate, promoted, rejected, duplicate, ignored, or superseded.' },
    sourceHash: { type: 'string', predicate: UDFS.sourceHash, description: 'Optional source digest for duplicate detection.' },
    chat: { type: 'uri', predicate: UDFS.conversation, description: 'Related chat command surface.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Related concrete thread/work site.' },
    task: { type: 'uri', predicate: UDFS.task, description: 'Related task.' },
    run: { type: 'uri', predicate: UDFS.run, description: 'Related run.' },
    actor: { type: 'uri', predicate: DCTerms.creator, description: 'Secretary, user, or worker that created the candidate.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter-local metadata; shared relations must be explicit fields.' },
    createdAt: { type: 'timestamp', predicate: DCTerms.created, description: 'Creation timestamp.' },
    updatedAt: { type: 'timestamp', predicate: DCTerms.modified, description: 'Last update timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'source',
    'summary',
    'suggestedType',
    'suggestedTarget',
    'confidence',
    'reason',
    'status',
    'sourceHash',
    'chat',
    'thread',
    'task',
    'run',
    'actor',
    'metadata',
    'updatedAt',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Create a capture candidate from an observed chat message',
      match: {
        id: 'candidates/2026/06/16.ttl#candidate_1',
      },
    },
  ],
}

export const captureEventDescriptor: PodModelDescriptor = {
  uri: UDFS.CaptureEvent,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.CaptureEvent,
  resourceKind: 'capture-event',
  description: 'Append-only capture decision ledger. It records direct commits, optimistic commits, candidate creation, promotion, rejection, correction, rollback, duplicate detection, and ignored decisions.',
  storage: exactIdStorage('/.data/capture/'),
  fields: {
    id: idField,
    source: { type: 'uri', predicate: DCTerms.source, required: true, description: 'Original message, file, URL, fetched document, or resource considered by capture.' },
    captureCandidate: { type: 'uri', predicate: UDFS.captureCandidate, description: 'Candidate resource involved in this event, when applicable.' },
    targetResource: { type: 'uri', predicate: UDFS.targetResource, description: 'Formal resource affected by this capture decision.' },
    decision: { type: 'string', predicate: UDFS.captureDecision, required: true, description: 'Decision such as direct_commit, optimistic_commit, candidate_created, promoted, rejected, corrected, rollback, duplicate, or ignored.' },
    suggestedType: { type: 'uri', predicate: UDFS.suggestedType, description: 'Type suggested at decision time.' },
    suggestedTarget: { type: 'uri', predicate: UDFS.suggestedTarget, description: 'Target suggested at decision time.' },
    confidence: { type: 'string', predicate: UDFS.confidence, description: 'Classifier confidence at decision time.' },
    reason: { type: 'text', predicate: UDFS.reason, description: 'Explanation for the capture decision.' },
    userCorrection: { type: 'text', predicate: UDFS.userCorrection, description: 'User correction to type, target, title, summary, or content.' },
    approval: { type: 'uri', predicate: UDFS.approval, description: 'ApprovalRequest controlling an authority gate, if any.' },
    inputRequest: { type: 'uri', predicate: UDFS.inputRequest, description: 'InputRequest controlling missing information, if any.' },
    chat: { type: 'uri', predicate: UDFS.conversation, description: 'Related chat command surface.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Related concrete thread/work site.' },
    task: { type: 'uri', predicate: UDFS.task, description: 'Related task.' },
    run: { type: 'uri', predicate: UDFS.run, description: 'Related run.' },
    actor: { type: 'uri', predicate: DCTerms.creator, description: 'Secretary, user, or worker that made or recorded the decision.' },
    about: { type: 'uri', predicate: SCHEMA.about, description: 'Control object or semantic subject the event is about.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter-local metadata; shared relations must be explicit fields.' },
    createdAt: { type: 'timestamp', predicate: DCTerms.created, description: 'Creation timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'source',
    'captureCandidate',
    'targetResource',
    'decision',
    'suggestedType',
    'suggestedTarget',
    'confidence',
    'reason',
    'userCorrection',
    'approval',
    'inputRequest',
    'chat',
    'thread',
    'task',
    'run',
    'actor',
    'about',
    'metadata',
  ],
  mergePolicy: 'append',
  examples: [
    {
      request: 'Record that a chat message became a capture candidate',
      match: {
        id: 'events/2026/06/16.ttl#event_1',
      },
    },
  ],
}

export const contactDescriptor: PodModelDescriptor = {
  uri: UDFS.Contact,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: VCARD.Individual,
  resourceKind: 'contact',
  description: 'Unified address-book projection for Solid users, external users, groups, and AI agents.',
  storage: exactIdStorage('/.data/contacts/'),
  fields: {
    id: idField,
    name: { type: 'string', predicate: VCARD.fn, required: true, description: 'Display name.' },
    avatarUrl: { type: 'uri', predicate: VCARD.hasPhoto, description: 'Avatar image URI.' },
    about: { type: 'uri', predicate: SCHEMA.about, required: true, description: 'Person, Agent, Chat, or external resource this contact card is about.' },
    rdfType: { type: 'uri', predicate: RDF.type, required: true, description: 'Semantic classifier for the represented resource.' },
    contactType: { type: 'string', predicate: UDFS.contactType, required: true, description: 'Runtime/source hint for handler selection.' },
    isPublic: { type: 'boolean', predicate: AS.audience, description: 'Whether the contact is public.' },
    externalPlatform: { type: 'string', predicate: UDFS.externalPlatform, description: 'External platform namespace.' },
    externalId: { type: 'string', predicate: UDFS.externalId, description: 'Opaque external platform id; not a resource relation.' },
    alias: { type: 'string', predicate: UDFS.alias, description: 'Private display alias.' },
    starred: { type: 'boolean', predicate: UDFS.favorite, description: 'Favorite flag.' },
    note: { type: 'text', predicate: VCARD.note, description: 'Private note.' },
    sortKey: { type: 'string', predicate: UDFS.sortKey, description: 'Stable sort key.' },
    gender: { type: 'string', predicate: VCARD.hasGender, description: 'Demographic hint.' },
    province: { type: 'string', predicate: VCARD.region, description: 'Region.' },
    city: { type: 'string', predicate: VCARD.locality, description: 'Locality.' },
    deletedAt: { type: 'timestamp', predicate: UDFS.deletedAt, description: 'Deletion timestamp.' },
    lastSyncedAt: { type: 'timestamp', predicate: UDFS.lastSyncedAt, description: 'Last sync timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'name', 'avatarUrl', 'about', 'rdfType', 'contactType', 'isPublic',
    'externalPlatform', 'externalId', 'alias', 'starred', 'note', 'sortKey',
    'gender', 'province', 'city', 'deletedAt', 'lastSyncedAt',
  ],
  mergePolicy: 'upsert',
  examples: [{ request: 'Create an AI agent contact projection', match: { id: 'agent-secretary.ttl' } }],
}

export const chatDescriptor: PodModelDescriptor = {
  uri: MEETING.LongChat,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: MEETING.LongChat,
  resourceKind: 'chat',
  description: 'Interactive command surface/counterpart: who or what the user is talking with.',
  storage: exactIdStorage('/.data/chat/'),
  fields: {
    id: idField,
    title: { type: 'string', predicate: DCTerms.title, required: true, description: 'Chat title.' },
    description: { type: 'string', predicate: DCTerms.description, description: 'Chat description.' },
    avatarUrl: { type: 'uri', predicate: SCHEMA.image, description: 'Avatar image URI.' },
    author: { type: 'uri', predicate: DCTerms.creator, description: 'Creator WebID or agent URI.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Chat lifecycle status.' },
    starred: { type: 'boolean', predicate: UDFS.favorite, description: 'Favorite flag.' },
    muted: { type: 'boolean', predicate: UDFS.muted, description: 'Muted flag.' },
    unreadCount: { type: 'number', predicate: UDFS.unreadCount, description: 'Unread message count.' },
    contact: { type: 'uri', predicate: UDFS.hasContact, description: 'Optional counterpart/contact represented by this channel.' },
    participants: { type: 'uri', predicate: WF.participant, array: true, description: 'Participant resource URIs.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter/UI metadata.' },
    lastActiveAt: { type: 'timestamp', predicate: UDFS.lastActiveAt, description: 'Last activity timestamp.' },
    lastMessage: { type: 'uri', predicate: UDFS.lastMessage, description: 'Latest message pointer.' },
    lastMessagePreview: { type: 'text', predicate: SCHEMA.text, description: 'Latest message preview.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'title', 'description', 'avatarUrl', 'author', 'status', 'starred', 'muted',
    'unreadCount', 'contact', 'participants', 'metadata', 'lastActiveAt',
    'lastMessage', 'lastMessagePreview',
  ],
  mergePolicy: 'upsert',
  examples: [{ request: 'Create a team chat surface', match: { id: 'team/index.ttl#this' } }],
}

export const threadDescriptor: PodModelDescriptor = {
  uri: SIOC.Thread,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: SIOC.Thread,
  resourceKind: 'thread',
  description: 'Concrete timeline/place under one parent command surface. Ownership is thread.parent via sioc:has_parent.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    parent: { type: 'uri', predicate: SIOC.has_parent, required: true, description: 'Parent command surface/container.' },
    title: { type: 'string', predicate: DCTerms.title, description: 'Thread title.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Thread lifecycle status.' },
    starred: { type: 'boolean', predicate: UDFS.favorite, description: 'Favorite flag.' },
    workspace: { type: 'uri', predicate: UDFS.workspace, description: 'Storage-layer workspace/container URI.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter/UI metadata.' },
  },
  uniqueBy: ['id'],
  writableFields: ['parent', 'title', 'status', 'starred', 'workspace', 'metadata'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Create a thread under a chat surface', match: { id: 'chat/team/index.ttl#thread' } }],
}

export const messageDescriptor: PodModelDescriptor = {
  uri: MEETING.Message,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: MEETING.Message,
  resourceKind: 'message',
  description: 'Human/runtime communication item under one parent command surface and optionally a concrete thread timeline.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    parent: { type: 'uri', predicate: SIOC.has_parent, required: true, description: 'Parent command surface/container URI.' },
    chat: { type: 'uri', predicate: WF.message, description: 'Solid Chat compatibility containment relation.' },
    thread: { type: 'uri', predicate: SIOC.has_member, description: 'Thread containment relation.' },
    maker: { type: 'uri', predicate: FOAF.maker, description: 'Author resource IRI.' },
    role: { type: 'string', predicate: UDFS.messageType, description: 'Message role.' },
    content: { type: 'text', predicate: SIOC.content, required: true, description: 'Plain text content.' },
    richContent: { type: 'text', predicate: SIOC.richContent, description: 'Structured/rich content payload.' },
    status: { type: 'string', predicate: UDFS.messageStatus, description: 'Message lifecycle status.' },
    toolName: { type: 'string', predicate: UDFS.toolName, description: 'Tool name for tool messages.' },
    toolCallId: { type: 'string', predicate: UDFS.toolCallId, description: 'Opaque tool call id; not a resource relation.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter/UI metadata.' },
    replacedBy: { type: 'string', predicate: DCTerms.isReplacedBy, description: 'Replacement message reference.' },
    deletedAt: { type: 'timestamp', predicate: SCHEMA.dateDeleted, description: 'Deletion timestamp.' },
    senderName: { type: 'string', predicate: UDFS.senderName, description: 'Display sender name.' },
    senderAvatarUrl: { type: 'uri', predicate: UDFS.senderAvatarUrl, description: 'Display sender avatar.' },
    mentions: { type: 'uri', predicate: UDFS.mentions, array: true, description: 'Mentioned resource URIs.' },
    replyTo: { type: 'uri', predicate: UDFS.replyTo, description: 'Original message URI.' },
    routedBy: { type: 'uri', predicate: UDFS.routedBy, description: 'Routing agent URI.' },
    routeTargetAgent: { type: 'uri', predicate: UDFS.routeTargetAgent, description: 'Target agent URI.' },
    coordinationId: { type: 'string', predicate: UDFS.coordinationId, description: 'Opaque multi-agent coordination id.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'parent', 'chat', 'thread', 'maker', 'role', 'content', 'richContent',
    'status', 'toolName', 'toolCallId', 'metadata', 'replacedBy', 'deletedAt',
    'senderName', 'senderAvatarUrl', 'mentions', 'replyTo', 'routedBy',
    'routeTargetAgent', 'coordinationId',
  ],
  mergePolicy: 'append',
  examples: [{ request: 'Append a message under a team chat', match: { id: 'chat/team/2026/06/14/messages.ttl#msg_1' } }],
}

export const chatProjectContextDescriptor: PodModelDescriptor = {
  uri: UDFS.ChatProjectContext,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.ChatProjectContext,
  resourceKind: 'chat-project-context',
  description: 'Workspace-scoped instructions and explicit memory-use preference shared by related chat threads.',
  storage: exactIdStorage('/.data/chat-projects/'),
  fields: {
    id: idField,
    workspace: { type: 'uri', predicate: UDFS.workspace, required: true, description: 'Workspace URI that owns this context.' },
    instructions: { type: 'text', predicate: UDFS.systemMessage, description: 'User-maintained project instructions.' },
    memoryEnabled: { type: 'boolean', predicate: UDFS.memoryEnabled, description: 'Whether explicit project memories may be injected into model context.' },
    createdAt: { type: 'timestamp', predicate: DCTerms.created, description: 'Creation timestamp.' },
    updatedAt: { type: 'timestamp', predicate: DCTerms.modified, description: 'Last modification timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: ['workspace', 'instructions', 'memoryEnabled', 'createdAt', 'updatedAt'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Save shared instructions for a workspace', match: { id: 'workspace-key.ttl' } }],
}

export const chatProjectMemoryDescriptor: PodModelDescriptor = {
  uri: UDFS.ProjectMemory,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.ProjectMemory,
  resourceKind: 'chat-project-memory',
  description: 'One user-approved, workspace-scoped memory entry with optional message provenance.',
  storage: exactIdStorage('/.data/chat-project-memories/'),
  fields: {
    id: idField,
    workspace: { type: 'uri', predicate: UDFS.workspace, required: true, description: 'Workspace URI that owns this memory.' },
    text: { type: 'text', predicate: SCHEMA.text, required: true, description: 'Explicit memory text.' },
    sourceMessage: { type: 'uri', predicate: UDFS.sourceMessage, description: 'Optional source message URI.' },
    createdAt: { type: 'timestamp', predicate: DCTerms.created, description: 'Creation timestamp.' },
    updatedAt: { type: 'timestamp', predicate: DCTerms.modified, description: 'Last modification timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: ['workspace', 'text', 'sourceMessage', 'createdAt', 'updatedAt'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Remember an explicit project fact', match: { id: 'memory-id.ttl' } }],
}

export const conversationShareDescriptor: PodModelDescriptor = {
  uri: UDFS.ConversationShare,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.ConversationShare,
  resourceKind: 'conversation-share',
  description: 'Revocable metadata record for a sanitized, read-only conversation export.',
  storage: exactIdStorage('/.data/chat-shares/'),
  fields: {
    id: idField,
    thread: { type: 'uri', predicate: UDFS.targetThread, required: true, description: 'Shared thread URI.' },
    resourceUrl: { type: 'uri', predicate: SCHEMA.url, required: true, description: 'Public read-only HTML resource URL.' },
    includeToolDetails: { type: 'boolean', predicate: UDFS.includeToolDetails, description: 'Whether sanitized tool details were included.' },
    excludedMessageIds: { type: 'string', predicate: UDFS.excludedMessage, array: true, description: 'Messages excluded by the user before sharing.' },
    createdAt: { type: 'timestamp', predicate: DCTerms.created, description: 'Creation timestamp.' },
    revokedAt: { type: 'timestamp', predicate: UDFS.revokedAt, description: 'Revocation timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: ['thread', 'resourceUrl', 'includeToolDetails', 'excludedMessageIds', 'createdAt', 'revokedAt'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Record a read-only conversation share', match: { id: 'share-id.ttl' } }],
}

export const ideaDescriptor: PodModelDescriptor = {
  uri: UDFS.Idea,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Idea,
  resourceKind: 'idea',
  description: 'File-primary candidate extracted from conversation before it is promoted to committed work. The document owns human-readable content; meta owns status and routing facts.',
  storage: exactIdStorage('/.data/ideas/'),
  fields: {
    id: idField,
    summary: { type: 'string', predicate: DCTerms.abstract, required: true, description: 'Short summary of the idea.' },
    document: { type: 'uri', predicate: DCTerms.source, description: 'Pod file that owns the idea body.' },
    input: { type: 'text', predicate: DCTerms.description, description: 'Original or synthesized input text.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Idea lifecycle status.' },
    commitment: { type: 'string', predicate: UDFS.commitment, description: 'Commitment level such as thought, direction, tentative_decision, or committed.' },
    affectedArea: { type: 'string', predicate: UDFS.affectedArea, description: 'System or product area the idea may affect.' },
    currentUnderstanding: { type: 'text', predicate: UDFS.currentUnderstanding, description: 'Current synthesized understanding.' },
    openQuestions: { type: 'text', predicate: UDFS.openQuestions, array: true, description: 'Open questions before promotion.' },
    related: { type: 'uri', predicate: DCTerms.relation, array: true, description: 'Related control records or resources.' },
    conflicts: { type: 'text', predicate: UDFS.conflicts, array: true, description: 'Potential semantic conflicts.' },
    nextStep: { type: 'text', predicate: UDFS.nextStep, description: 'Suggested next action.' },
    promotedTo: { type: 'uri', predicate: UDFS.promotedTo, description: 'Committed resource created from the idea.' },
    chat: { type: 'uri', predicate: UDFS.conversation, description: 'Source chat.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Source thread.' },
    sourceMessages: { type: 'uri', predicate: DCTerms.source, array: true, description: 'Source messages.' },
    createdBy: { type: 'uri', predicate: DCTerms.creator, description: 'Creator WebID or agent URI.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'summary', 'document', 'input', 'status', 'commitment', 'affectedArea', 'currentUnderstanding',
    'openQuestions', 'related', 'conflicts', 'nextStep', 'promotedTo', 'chat',
    'thread', 'sourceMessages', 'createdBy', 'metadata',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Capture a fragmented product idea for later triage',
      match: { id: '2026/05/28.ttl#idea_symphony_quality_metrics' },
    },
  ],
}

export const issueDescriptor: PodModelDescriptor = {
  uri: UDFS.Issue,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Issue,
  resourceKind: 'issue',
  description: 'File-primary user-facing work item for a requirement, bug, support item, investigation, or feature request. The document owns human-readable content; meta owns status and routing facts.',
  storage: {
    base: '/.data/issues/',
    resourceIdPattern: '{id}',
  },
  fields: {
    id: idField,
    title: { type: 'string', predicate: DCTerms.title, required: true, description: 'Compact issue label for list/search surfaces; the file owns the full title/body.' },
    document: { type: 'uri', predicate: DCTerms.source, description: 'Pod file that owns the issue body.' },
    description: { type: 'text', predicate: DCTerms.description, description: 'Issue description.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Issue lifecycle status.' },
    priority: { type: 'string', predicate: UDFS.priority, description: 'Issue priority.' },
    labels: { type: 'text', predicate: UDFS.tags, array: true, description: 'Tags or labels.' },
    chat: { type: 'uri', predicate: UDFS.conversation, description: 'Owning or source chat.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Owning or source thread.' },
    parentIssue: { type: 'uri', predicate: UDFS.parentIssue, description: 'Parent issue.' },
    tasks: { type: 'uri', predicate: UDFS.task, array: true, description: 'Executable task slices.' },
    createdBy: { type: 'uri', predicate: DCTerms.creator, description: 'Creator WebID or agent URI.' },
    assignedTo: { type: 'uri', predicate: UDFS.assignedTo, description: 'Assignee WebID or agent URI.' },
    closedAt: { type: 'timestamp', predicate: UDFS.closedAt, description: 'Closure timestamp.' },
    deletedAt: { type: 'timestamp', predicate: UDFS.deletedAt, description: 'Deletion timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'title', 'document', 'description', 'status', 'priority', 'labels', 'chat', 'thread',
    'parentIssue', 'tasks', 'createdBy', 'assignedTo', 'closedAt', 'deletedAt',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Create a Symphony issue for a delegated implementation slice',
      match: { id: 'issue_symphony_runtime_projection.ttl' },
    },
  ],
}

export const taskDescriptor: PodModelDescriptor = {
  uri: UDFS.Task,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Task,
  resourceKind: 'task',
  description: 'Durable executable work unit. Scheduling, runner selection, and concrete attempts live outside Task.',
  storage: exactIdStorage('/.data/task/'),
  fields: {
    id: idField,
    title: { type: 'string', predicate: DCTerms.title, description: 'Task title.' },
    instruction: { type: 'text', predicate: UDFS.instruction, required: true, description: 'Executable instruction.' },
    prompt: { type: 'text', predicate: UDFS.prompt, description: 'Runtime prompt projection.' },
    issue: { type: 'uri', predicate: UDFS.issue, description: 'Originating issue.' },
    message: { type: 'uri', predicate: UDFS.message, description: 'Message that produced this task.' },
    workspace: { type: 'uri', predicate: UDFS.workspace, required: true, description: 'Workspace URI.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Task lifecycle status.' },
    priority: { type: 'string', predicate: UDFS.priority, description: 'Priority.' },
    assignedTo: { type: 'uri', predicate: UDFS.assignedTo, description: 'Assignee WebID or agent URI.' },
    source: { type: 'uri', predicate: DCTerms.source, description: 'Source resource.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'title', 'instruction', 'prompt', 'issue', 'message', 'workspace',
    'status', 'priority', 'assignedTo', 'source', 'metadata',
  ],
  mergePolicy: 'upsert',
  examples: [
    {
      request: 'Create an executable task under an issue',
      match: { id: 'task_symphony_worker_projection' },
    },
  ],
}

export const scheduleDescriptor: PodModelDescriptor = {
  uri: UDFS.Schedule,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Schedule,
  resourceKind: 'schedule',
  description: 'Time-based trigger configuration for a Task.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    task: { type: 'uri', predicate: UDFS.task, required: true, description: 'Scheduled task.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Schedule lifecycle status.' },
    scheduleKind: { type: 'string', predicate: UDFS.scheduleKind, description: 'Schedule kind: once, interval, or cron.' },
    cron: { type: 'string', predicate: UDFS.cron, description: 'Cron expression.' },
    intervalSeconds: { type: 'number', predicate: UDFS.intervalSeconds, description: 'Interval in seconds.' },
    timezone: { type: 'string', predicate: UDFS.timezone, description: 'Timezone.' },
    startsAt: { type: 'timestamp', predicate: UDFS.startsAt, description: 'Start timestamp.' },
    nextRunAt: { type: 'timestamp', predicate: UDFS.nextRunAt, description: 'Next run timestamp.' },
    lastRunAt: { type: 'timestamp', predicate: UDFS.lastRunAt, description: 'Last run timestamp.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
  },
  uniqueBy: ['id'],
  writableFields: ['task', 'status', 'scheduleKind', 'cron', 'intervalSeconds', 'timezone', 'startsAt', 'nextRunAt', 'lastRunAt', 'metadata'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Create a time trigger for a task', match: { id: 'schedules/schedule_1.ttl' } }],
}

export const automationRuleDescriptor: PodModelDescriptor = {
  uri: UDFS.AutomationRule,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.AutomationRule,
  resourceKind: 'automation_rule',
  description: 'Policy, condition, and action wiring that can dispatch tasks or scheduled work.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    title: { type: 'string', predicate: DCTerms.title, required: true, description: 'Rule title.' },
    description: { type: 'text', predicate: DCTerms.description, description: 'Rule description.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Rule lifecycle status.' },
    ruleKind: { type: 'string', predicate: UDFS.ruleKind, description: 'Rule kind: event, schedule, or manual.' },
    task: { type: 'uri', predicate: UDFS.task, description: 'Task dispatched by this rule.' },
    schedule: { type: 'uri', predicate: UDFS.schedule, description: 'Schedule that triggers this rule.' },
    source: { type: 'uri', predicate: DCTerms.source, description: 'Source resource.' },
    target: { type: 'uri', predicate: AS.target, description: 'Target resource.' },
    condition: { type: 'json', predicate: UDFS.condition, description: 'Structured condition.' },
    actions: { type: 'json', predicate: UDFS.actions, description: 'Structured actions.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
    lastTriggeredAt: { type: 'timestamp', predicate: UDFS.lastTriggeredAt, description: 'Last trigger timestamp.' },
    lastRunStatus: { type: 'string', predicate: UDFS.lastRunStatus, description: 'Last run status.' },
  },
  uniqueBy: ['id'],
  writableFields: ['title', 'description', 'status', 'ruleKind', 'task', 'schedule', 'source', 'target', 'condition', 'actions', 'metadata', 'lastTriggeredAt', 'lastRunStatus'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Create an automation rule that dispatches a task', match: { id: 'automation/rule_1.ttl' } }],
}

export const deliveryDescriptor: PodModelDescriptor = {
  uri: UDFS.Delivery,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Delivery,
  resourceKind: 'delivery',
  description: 'Internal handoff envelope between threads, sessions, agents, and runtimes.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    kind: { type: 'string', predicate: UDFS.deliveryKind, description: 'Delivery kind.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Delivery lifecycle status.' },
    task: { type: 'uri', predicate: UDFS.task, description: 'Task being delivered.' },
    source: { type: 'uri', predicate: DCTerms.source, description: 'Source resource.' },
    target: { type: 'uri', predicate: AS.target, description: 'Target resource.' },
    chat: { type: 'uri', predicate: UDFS.conversation, description: 'Related chat.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Source thread.' },
    targetThread: { type: 'uri', predicate: UDFS.targetThread, description: 'Target thread.' },
    targetSession: { type: 'uri', predicate: UDFS.targetSession, description: 'Target session.' },
    actor: { type: 'uri', predicate: AS.actor, description: 'Actor.' },
    object: { type: 'uri', predicate: AS.object, description: 'Object resource.' },
    objective: { type: 'text', predicate: UDFS.objective, description: 'Short objective.' },
    payload: { type: 'json', predicate: UDFS.payload, description: 'Structured payload.' },
    projection: { type: 'json', predicate: UDFS.projection, description: 'Runtime projection.' },
    projectedRole: { type: 'string', predicate: UDFS.projectedRole, description: 'Projected runtime role.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
    error: { type: 'text', predicate: UDFS.error, description: 'Failure detail.' },
    dispatchedAt: { type: 'timestamp', predicate: UDFS.startedAt, description: 'Dispatch timestamp.' },
    consumedAt: { type: 'timestamp', predicate: UDFS.consumedAt, description: 'Consumption timestamp.' },
    completedAt: { type: 'timestamp', predicate: UDFS.completedAt, description: 'Completion timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'kind', 'status', 'task', 'source', 'target', 'chat', 'thread', 'targetThread',
    'targetSession', 'actor', 'object', 'objective', 'payload', 'projection',
    'projectedRole', 'metadata', 'error', 'dispatchedAt', 'consumedAt', 'completedAt',
  ],
  mergePolicy: 'upsert',
  examples: [{ request: 'Create a worker delivery package', match: { id: 'task/symphony/2026/05/28/deliveries.ttl#delivery_1' } }],
}

export const runDescriptor: PodModelDescriptor = {
  uri: UDFS.Run,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Run,
  resourceKind: 'run',
  description: 'One concrete execution attempt by an agent runtime.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    task: { type: 'uri', predicate: UDFS.task, description: 'Task being executed.' },
    delivery: { type: 'uri', predicate: UDFS.delivery, description: 'Delivery that caused or carries this run.' },
    trigger: { type: 'uri', predicate: UDFS.trigger, description: 'Resource that triggered the run.' },
    input: { type: 'uri', predicate: UDFS.input, description: 'Concrete input/context projection resource.' },
    thread: { type: 'uri', predicate: UDFS.inThread, required: true, description: 'Runtime thread.' },
    workspace: { type: 'uri', predicate: UDFS.workspace, required: true, description: 'Workspace URI.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Run lifecycle status.' },
    runner: { type: 'string', predicate: UDFS.runner, required: true, description: 'Runtime implementation.' },
    prompt: { type: 'string', predicate: UDFS.prompt, description: 'Prompt or prompt version.' },
    externalRunId: { type: 'string', predicate: UDFS.externalRunId, description: 'Opaque external runtime id; not a resource relation.' },
    leaseOwner: { type: 'string', predicate: UDFS.leaseOwner, description: 'Lease owner.' },
    leaseExpiresAt: { type: 'timestamp', predicate: UDFS.leaseExpiresAt, description: 'Lease expiration timestamp.' },
    heartbeatAt: { type: 'timestamp', predicate: UDFS.heartbeatAt, description: 'Heartbeat timestamp.' },
    cancelRequestedAt: { type: 'timestamp', predicate: UDFS.cancelRequestedAt, description: 'Cancel request timestamp.' },
    error: { type: 'string', predicate: UDFS.error, description: 'Failure detail.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
    startedAt: { type: 'timestamp', predicate: UDFS.startedAt, description: 'Start timestamp.' },
    completedAt: { type: 'timestamp', predicate: UDFS.completedAt, description: 'Completion timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'task', 'delivery', 'trigger', 'input', 'thread', 'workspace', 'status',
    'runner', 'prompt', 'externalRunId', 'leaseOwner', 'leaseExpiresAt',
    'heartbeatAt', 'cancelRequestedAt', 'error', 'metadata', 'startedAt', 'completedAt',
  ],
  mergePolicy: 'upsert',
  examples: [{ request: 'Record a runtime execution attempt', match: { id: 'task/symphony/2026/05/28/runs.ttl#run_1' } }],
}

export const runStepDescriptor: PodModelDescriptor = {
  uri: UDFS.RunStep,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.RunStep,
  resourceKind: 'run_step',
  description: 'Append-only execution fact emitted while a run executes.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    run: { type: 'uri', predicate: UDFS.run, required: true, description: 'Run this step belongs to.' },
    stepType: { type: 'string', predicate: UDFS.stepType, required: true, description: 'RunStep event type.' },
    message: { type: 'string', predicate: DCTerms.description, description: 'Human-readable step message.' },
    payload: { type: 'json', predicate: UDFS.payload, description: 'Structured step payload.' },
  },
  uniqueBy: ['id'],
  writableFields: ['run', 'stepType', 'message', 'payload'],
  mergePolicy: 'append',
  examples: [{ request: 'Append a runtime tool call step', match: { id: 'task/symphony/2026/05/28/runs.ttl#run-step_1' } }],
}

export const evidenceDescriptor: PodModelDescriptor = {
  uri: UDFS.Evidence,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Evidence,
  resourceKind: 'evidence',
  description: 'Append-only proof or finding for a workflow control object.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    evidenceKind: { type: 'string', predicate: UDFS.evidenceKind, required: true, description: 'Evidence kind.' },
    about: { type: 'uri', predicate: SCHEMA.about, required: true, description: 'Control object this evidence supports.' },
    issue: { type: 'uri', predicate: UDFS.issue, description: 'Related issue.' },
    task: { type: 'uri', predicate: UDFS.task, description: 'Related task.' },
    delivery: { type: 'uri', predicate: UDFS.delivery, description: 'Related delivery.' },
    run: { type: 'uri', predicate: UDFS.run, description: 'Related run.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Related thread.' },
    summary: { type: 'text', predicate: DCTerms.abstract, description: 'Evidence summary.' },
    source: { type: 'uri', predicate: DCTerms.source, description: 'Source artifact or document.' },
    actor: { type: 'uri', predicate: DCTerms.creator, description: 'Actor that produced the evidence.' },
    outcome: { type: 'string', predicate: UDFS.outcome, description: 'Evidence outcome.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
  },
  uniqueBy: ['id'],
  writableFields: ['evidenceKind', 'about', 'issue', 'task', 'delivery', 'run', 'thread', 'summary', 'source', 'actor', 'outcome', 'metadata'],
  mergePolicy: 'append',
  examples: [{ request: 'Record test evidence for a task', match: { id: 'task/symphony/2026/05/28/evidence.ttl#evidence_1' } }],
}

export const reportDescriptor: PodModelDescriptor = {
  uri: UDFS.Report,
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.Report,
  resourceKind: 'report',
  description: 'Closure, review, handoff, status, or quality summary for a control object.',
  storage: exactIdStorage(),
  fields: {
    id: idField,
    reportKind: { type: 'string', predicate: UDFS.reportKind, required: true, description: 'Report kind.' },
    status: { type: 'string', predicate: UDFS.status, description: 'Report lifecycle status.' },
    outcome: { type: 'string', predicate: UDFS.outcome, description: 'Reported outcome.' },
    about: { type: 'uri', predicate: SCHEMA.about, required: true, description: 'Control object being summarized.' },
    issue: { type: 'uri', predicate: UDFS.issue, description: 'Related issue.' },
    task: { type: 'uri', predicate: UDFS.task, description: 'Related task.' },
    delivery: { type: 'uri', predicate: UDFS.delivery, description: 'Related delivery.' },
    run: { type: 'uri', predicate: UDFS.run, description: 'Related run.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Related thread.' },
    evidence: { type: 'uri', predicate: UDFS.evidence, array: true, description: 'Evidence summarized by this report.' },
    summary: { type: 'text', predicate: DCTerms.abstract, required: true, description: 'Report summary.' },
    reviewer: { type: 'uri', predicate: SCHEMA.reviewedBy, description: 'Reviewer.' },
    actor: { type: 'uri', predicate: DCTerms.creator, description: 'Actor that produced the report.' },
    source: { type: 'uri', predicate: DCTerms.source, description: 'Source artifact or document.' },
    metricFacts: { type: 'json', predicate: UDFS.metricFacts, description: 'Structured metric facts.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
    publishedAt: { type: 'timestamp', predicate: DCTerms.issued, description: 'Publication timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: [
    'reportKind', 'status', 'outcome', 'about', 'issue', 'task', 'delivery',
    'run', 'thread', 'evidence', 'summary', 'reviewer', 'actor', 'source',
    'metricFacts', 'metadata', 'publishedAt',
  ],
  mergePolicy: 'upsert',
  examples: [{ request: 'Publish a worker handoff report', match: { id: 'task/symphony/2026/05/28/reports.ttl#report_1' } }],
}

export const sessionDescriptor: PodModelDescriptor = {
  uri: UDFS.term('Session'),
  version: '1.0.0',
  source: 'official',
  trustLevel: 'high',
  namespace: UDFS.NAMESPACE,
  class: UDFS.term('Session'),
  resourceKind: 'session',
  description: 'Runtime or collaboration session lifecycle projection for a concrete thread.',
  storage: exactIdStorage('/.data/sessions/'),
  fields: {
    id: idField,
    owner: { type: 'uri', predicate: UDFS.actor, required: true, description: 'Session owner.' },
    chat: { type: 'uri', predicate: UDFS.conversation, description: 'Related chat.' },
    thread: { type: 'uri', predicate: UDFS.inThread, description: 'Related thread.' },
    status: { type: 'string', predicate: UDFS.sessionStatus, description: 'Session lifecycle status.' },
    tool: { type: 'string', predicate: UDFS.sessionTool, description: 'Runtime tool or backend.' },
    tokenUsage: { type: 'number', predicate: UDFS.tokenUsage, description: 'Token usage.' },
    messages: { type: 'uri', predicate: UDFS.message, array: true, description: 'Messages in this session.' },
    policy: { type: 'uri', predicate: UDFS.policy, description: 'Policy resource.' },
    policyVersion: { type: 'string', predicate: UDFS.policyVersion, description: 'Policy version.' },
    metadata: { type: 'json', predicate: UDFS.metadata, description: 'Opaque adapter metadata.' },
    archivedAt: { type: 'timestamp', predicate: UDFS.archivedAt, description: 'Archive timestamp.' },
  },
  uniqueBy: ['id'],
  writableFields: ['owner', 'chat', 'thread', 'status', 'tool', 'tokenUsage', 'messages', 'policy', 'policyVersion', 'metadata', 'archivedAt'],
  mergePolicy: 'upsert',
  examples: [{ request: 'Record a worker runtime session', match: { id: '2026/05/28/sess_1.ttl' } }],
}

export const officialPodModelDescriptors = [
  credentialDescriptor,
  gatewayAccessKeyDescriptor,
  quotaSnapshotDescriptor,
  contactDescriptor,
  chatDescriptor,
  threadDescriptor,
  messageDescriptor,
  chatProjectContextDescriptor,
  chatProjectMemoryDescriptor,
  conversationShareDescriptor,
  ideaDescriptor,
  issueDescriptor,
  taskDescriptor,
  scheduleDescriptor,
  automationRuleDescriptor,
  deliveryDescriptor,
  runDescriptor,
  runStepDescriptor,
  evidenceDescriptor,
  reportDescriptor,
  captureCandidateDescriptor,
  captureEventDescriptor,
  sessionDescriptor,
  approvalDescriptor,
  inputRequestDescriptor,
] as const

export function createPodModelDescriptorRegistry(
  descriptors: readonly PodModelDescriptor[] = officialPodModelDescriptors,
) {
  const byUri = new Map(descriptors.map((descriptor) => [descriptor.uri, descriptor]))

  return {
    list(filter: { source?: PodModelDescriptorSource; resourceKind?: string } = {}): PodModelDescriptor[] {
      return descriptors.filter((descriptor) => {
        if (filter.source && descriptor.source !== filter.source) return false
        if (filter.resourceKind && descriptor.resourceKind !== filter.resourceKind) return false
        return true
      })
    },

    describe(uri: string): PodModelDescriptor | null {
      return byUri.get(uri) ?? null
    },
  }
}

export const podSchema = createPodSchema()

export function createPodSchema(
  registry = createPodModelDescriptorRegistry(),
) {
  const resolveDescriptors = (input: { uri?: string; schemaUri?: string } = {}) => {
    const uri = input.uri ?? input.schemaUri
    if (!uri) return registry.list()
    const descriptor = registry.describe(uri)
    return descriptor ? [descriptor] : []
  }

  return {
    list: registry.list,
    describe(uriOrInput: string | { uri: string } | { schemaUri: string }) {
      const uri = typeof uriOrInput === 'string'
        ? uriOrInput
        : 'uri' in uriOrInput
          ? uriOrInput.uri
          : uriOrInput.schemaUri
      return registry.describe(uri)
    },
    classes(input: { uri?: string; schemaUri?: string } = {}): PodSchemaClassEntry[] {
      return resolveDescriptors(input).map((descriptor) => ({
        schemaUri: descriptor.uri,
        resourceKind: descriptor.resourceKind,
        class: descriptor.class,
        namespace: descriptor.namespace,
        source: descriptor.source,
        trustLevel: descriptor.trustLevel,
        description: descriptor.description,
      }))
    },
    search(input: {
      query: string
      source?: PodModelDescriptorSource
      resourceKind?: string
      limit?: number
    }): PodSchemaSearchEntry[] {
      const terms = normalizeSearchTerms(input.query)
      if (terms.length === 0) return []

      return registry.list({
        source: input.source,
        resourceKind: input.resourceKind,
      })
        .map((descriptor) => scoreDescriptorSearch(descriptor, terms))
        .filter((entry): entry is PodSchemaSearchEntry => entry !== null)
        .sort((a, b) => b.score - a.score || a.uri.localeCompare(b.uri))
        .slice(0, Math.max(1, input.limit ?? 10))
    },
    predicates(input: { uri?: string; schemaUri?: string; field?: string } = {}): PodSchemaPredicateEntry[] {
      return resolveDescriptors(input).flatMap((descriptor) => (
        Object.entries(descriptor.fields)
          .filter(([field]) => !input.field || field === input.field)
          .map(([field, descriptorField]) => ({
            schemaUri: descriptor.uri,
            field,
            predicate: descriptorField.predicate,
            type: descriptorField.type,
            required: Boolean(descriptorField.required),
            secret: Boolean(descriptorField.secret),
            array: Boolean(descriptorField.array),
            description: descriptorField.description,
          }))
      ))
    },
  }
}

export function createPodStorage(
  registry = createPodModelDescriptorRegistry(),
  store = new Map<string, Record<string, unknown>>(),
) {
  const plans = new Map<string, PodStorageMutationPlan>()

  return {
    validate(input: {
      schemaUri?: string
      operation: 'upsert'
      match: Record<string, unknown>
      set?: Record<string, unknown>
    }): PodStorageValidationResult {
      const schemaUri = input.schemaUri
      if (!schemaUri) return invalid('schema_uri_required', 'Missing schemaUri')
      const descriptor = registry.describe(schemaUri)
      if (!descriptor) return invalid('descriptor_not_found', `Descriptor not found: ${schemaUri}`)
      if (input.operation !== 'upsert') return invalid('unsupported_operation', `Unsupported operation: ${input.operation}`)

      const missingKeys = descriptor.uniqueBy.filter((field) => !input.match[field])
      if (missingKeys.length > 0) {
        return invalid('missing_match_fields', `Missing match fields: ${missingKeys.join(', ')}`)
      }

      const set = input.set ?? {}
      const invalidSetFields = Object.keys(set).filter((field) => !descriptor.writableFields.includes(field))
      if (invalidSetFields.length > 0) {
        return invalid('invalid_set_fields', `Fields are not writable: ${invalidSetFields.join(', ')}`)
      }

      const resourceId = buildResourceId(descriptor, input.match)
      const plan: PodStorageMutationPlan = {
        id: `plan_${resourceId.replace(/[^a-zA-Z0-9_.-]+/g, '-')}`,
        schemaUri: descriptor.uri,
        operation: input.operation,
        resourceId,
        resourceUri: buildResourceUri(descriptor, resourceId),
        match: input.match,
        set,
        summary: `Upsert ${descriptor.resourceKind} for ${descriptor.uniqueBy.map((field) => input.match[field]).join('/')}`,
      }
      plans.set(plan.id, plan)
      return { ok: true, plan }
    },

    commit(input: { planId: string }): PodStorageCommitResult {
      const plan = plans.get(input.planId)
      if (!plan) return invalid('plan_not_found', `Plan not found: ${input.planId}`)

      const existing = store.get(plan.resourceUri) ?? {}
      const resource = {
        ...existing,
        ...plan.match,
        ...plan.set,
        schemaUri: plan.schemaUri,
        resourceId: plan.resourceId,
        resourceUri: plan.resourceUri,
      }
      store.set(plan.resourceUri, resource)
      return { ok: true, resource }
    },

    read(input: { resourceUri: string }): PodStorageCommitResult {
      const resource = store.get(input.resourceUri)
      if (!resource) return invalid('resource_not_found', `Resource not found: ${input.resourceUri}`)
      return { ok: true, resource }
    },

    store,
    plans,
  }
}

function invalid(code: string, message: string): PodStorageValidationResult & PodStorageCommitResult {
  return {
    ok: false,
    error: { code, message },
  }
}

function buildResourceId(descriptor: PodModelDescriptor, match: Record<string, unknown>): string {
  if (descriptor.storage.resourceIdPattern === '{id}' && descriptor.uniqueBy.length === 1 && descriptor.uniqueBy[0] === 'id') {
    return String(match.id)
  }

  const raw = descriptor.uniqueBy.map((field) => String(match[field])).join('-')
  const localId = raw.replace(/[^a-zA-Z0-9_.-]+/g, '-')
  return descriptor.storage.resourceIdPattern.replace('{id}', localId)
}

function buildResourceUri(descriptor: PodModelDescriptor, resourceId: string): string {
  return `${descriptor.storage.base}${resourceId}`
}

function normalizeSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;:/#._-]+/u)
    .map((term) => term.trim())
    .filter(Boolean)
}

function scoreDescriptorSearch(
  descriptor: PodModelDescriptor,
  terms: string[],
): PodSchemaSearchEntry | null {
  const matchedFields = new Set<string>()
  let score = 0

  const match = (field: string, value: string | undefined, weight: number) => {
    if (!value) return
    const normalized = value.toLowerCase()
    for (const term of terms) {
      if (!normalized.includes(term)) continue
      matchedFields.add(field)
      score += weight
    }
  }

  match('uri', descriptor.uri, 10)
  match('class', descriptor.class, 10)
  match('namespace', descriptor.namespace, 4)
  match('resourceKind', descriptor.resourceKind, 8)
  match('description', descriptor.description, 4)
  match('storage', `${descriptor.storage.base}${descriptor.storage.resourceIdPattern}`, 3)

  for (const [fieldName, field] of Object.entries(descriptor.fields)) {
    match(`field:${fieldName}`, fieldName, 6)
    match(`predicate:${fieldName}`, field.predicate, 6)
    match(`description:${fieldName}`, field.description, 3)
  }

  for (const example of descriptor.examples) {
    match('example', example.request, 3)
    for (const [fieldName, value] of Object.entries(example.match)) {
      match(`example:${fieldName}`, String(value), 3)
    }
  }

  if (score <= 0) return null
  return {
    uri: descriptor.uri,
    resourceKind: descriptor.resourceKind,
    class: descriptor.class,
    namespace: descriptor.namespace,
    source: descriptor.source,
    trustLevel: descriptor.trustLevel,
    description: descriptor.description,
    score,
    matchedFields: [...matchedFields].sort(),
  }
}
