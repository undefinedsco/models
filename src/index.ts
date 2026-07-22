// ============================================
// 命名空间和词汇表
// ============================================
export {
  UDFS,
  UDFS_NAMESPACE,
  // Standard vocabs
  SIOC,
  DCTerms,
  SCHEMA,
  RDF,
  RDFS,
  ACL,
  ODRL,
  OWL,
  FOAF,
  MEETING,
  AS,
  VCARD,
  WF,
  LDP,
} from "./namespaces";

// Wave A: centralized vocab objects (downstream should prefer these over ad-hoc namespaces)
export * from "./vocab";

// ============================================
// 核心业务模型
// ============================================

// Profile - 用户资料
export * from './profile'
export * from './profile.repository'
export * from './profile.schema'

// Contact - 联系人 (unified index for Solid users, external users, and AI agents)
export {
  ContactGender,
  contactResource,
  contactTable,
  ContactClass,
  ContactType,
  isAgentContact,
  isGroupContact,
  normalizeContactGender,
  type ContactRow,
  type ContactInsert,
  type ContactUpdate,
  type ContactClassValue,
  type ContactGenderValue,
  type ContactTypeValue,
} from './contact.schema'
export { contactRepository } from './contact.repository'

// Chat & Message - 聊天和消息
export {
  ChatStatus,
  chatResource,
  chatTable,
  type ChatMetadata,
  type ChatMemberRole,
  type ChatStatusType,
  type ChatRow,
  type ChatInsert,
  type ChatUpdate,
} from './chat.schema'
export { chatRepository } from './chat.repository'
export {
  buildChatTargetRef,
  extractChatIdFromChatRef,
  extractChatTargetRef,
  extractChatThreadRef,
  extractThreadIdFromThreadRef,
  resolveThreadChatId,
  toTimestamp,
  type ChatTargetRef,
  type ChatThreadRef,
} from './chat.utils'
export {
  buildModelResourceId,
  buildModelResourceIri,
  buildModelResourceIriForDatabase,
  resolveModelResourceIri,
  resolveModelResourceIriForDatabase,
  type ModelResourceTarget,
} from './resource-refs'
export {
  aiRuntimeRepository,
  buildAiRuntimeCredentialId,
  buildAiRuntimeCredentialIri,
  buildAiRuntimeCredentialTarget,
  getAiRuntimeProviderCredential,
  upsertAiRuntimeProviderCredential,
  type AiRuntimeCredentialDb,
  type AiRuntimeCredentialTargetInput,
  type AiRuntimeCredentialUpsertInput,
  type AiRuntimeDeployment,
} from './ai-runtime.repository'

export {
  ThreadStatus,
  threadResource,
  threadTable,
  type ThreadStatusType,
  type ThreadRow,
  type ThreadInsert,
  type ThreadUpdate,
} from './thread.schema'
export { threadRepository } from './thread.repository'

export {
  MessageRole,
  MessageStatus,
  messageResource,
  messageTable,
  type MessageRoleType,
  type MessageStatusType,
  type MessageRow,
  type MessageInsert,
  type MessageUpdate,
} from './message.schema'
export { messageRepository, type MessageListWhere } from './message.repository'

export {
  TaskStatus,
  taskResource,
  taskTable,
  type TaskStatusType,
  type TaskRow,
  type TaskInsert,
  type TaskUpdate,
} from './task.schema'

export {
  ScheduleKind,
  ScheduleStatus,
  scheduleResource,
  scheduleTable,
  type ScheduleKindType,
  type ScheduleStatusType,
  type ScheduleRow,
  type ScheduleInsert,
  type ScheduleUpdate,
} from './schedule.schema'

export {
  AutomationRuleKind,
  AutomationRuleStatus,
  automationRuleResource,
  automationRuleTable,
  type AutomationRuleKindType,
  type AutomationRuleStatusType,
  type AutomationRuleRow,
  type AutomationRuleInsert,
  type AutomationRuleUpdate,
} from './automation-rule.schema'

export {
  DeliveryKind,
  DeliveryStatus,
  deliveryResource,
  deliveryTable,
  type DeliveryKindType,
  type DeliveryStatusType,
  type DeliveryRow,
  type DeliveryInsert,
  type DeliveryUpdate,
} from './delivery.schema'

export {
  EvidenceKind,
  evidenceResource,
  type EvidenceKindType,
  type EvidenceRow,
  type EvidenceInsert,
  type EvidenceUpdate,
} from './evidence.schema'

export {
  ReportKind,
  ReportOutcome,
  ReportStatus,
  reportResource,
  type ReportKindType,
  type ReportOutcomeType,
  type ReportStatusType,
  type ReportRow,
  type ReportInsert,
  type ReportUpdate,
} from './report.schema'

export {
  RunStatus,
  RunStepType,
  runResource,
  runStepResource,
  runTable,
  runStepTable,
  type RunStatusType,
  type RunStepTypeValue,
  type RunRow,
  type RunInsert,
  type RunUpdate,
  type RunStepRow,
  type RunStepInsert,
  type RunStepUpdate,
} from './run.schema'

export {
  dateParts,
  parentDir,
  resourceKey,
  type DateInput,
  type DateParts,
} from './resource-id-defaults'

// Issue - user-facing work item that can be inspected through chat/thread
export {
  ideaResource,
  type IdeaStatus,
  type IdeaCommitment,
  type IdeaRow,
  type IdeaInsert,
  type IdeaUpdate,
} from './idea.schema'

export {
  issueResource,
  issueTable,
  type IssueStatus,
  type IssuePriority,
  type IssueRow,
  type IssueInsert,
  type IssueUpdate,
} from './issue.schema'
export { issueRepository } from './issue.repository'

// Message Block - 消息块类型系统 (Block-based Message System)
export {
  MessageBlockType,
  MessageBlockStatus,
  type BaseMessageBlock,
  type PlaceholderMessageBlock,
  type MainTextMessageBlock,
  type ThinkingMessageBlock,
  type ImageMessageBlock,
  type CodeMessageBlock,
  type ToolMessageBlock,
  type FileMessageBlock,
  type ErrorMessageBlock,
  type CitationMessageBlock,
  type MessageBlock,
  type MessageRichContent,
  createMessageBlock,
  isBlockType,
  parseMessageBlocks,
  serializeMessageBlocks,
} from './types/message-block'

// Wave A CP0: collaboration-related richContent block contracts
export {
  type ToolApprovalBlock,
  type ToolCallBlock,
  type TaskProgressBlock,
  type CollaborationRichBlock,
  type ToolRisk,
  type ToolApprovalStatus,
  type ToolCallStatus,
  type TaskProgressStepStatus,
} from "./types/collaboration-blocks";

// Wave A CP0: fixtures for downstream parallel development
export * from "./fixtures/contracts-chat-contact";

// Favorite - 收藏
export {
  favoriteResource,
  favoriteTable,
  type FavoriteRow,
  type FavoriteInsert,
  type FavoriteUpdate,
  // Starred Sync Hook
  createStarredSyncHook,
  registerDbForStarredSync,
  chatStarredSyncHook,
  threadStarredSyncHook,
  contactStarredSyncHook,
  chatSnapshotExtractor,
  threadSnapshotExtractor,
  contactSnapshotExtractor,
  type SnapshotExtractor,
  type StarredSyncConfig,
  type SourceModule,
} from './favorite'

// Capture - Secretary capture candidates and decision ledger
export {
  CaptureCandidateStatus,
  CaptureDecision,
  captureCandidateResource,
  captureEventResource,
  type CaptureCandidateStatusType,
  type CaptureConfidenceType,
  type CaptureDecisionType,
  type CaptureCandidateRow,
  type CaptureCandidateInsert,
  type CaptureCandidateUpdate,
  type CaptureEventRow,
  type CaptureEventInsert,
  type CaptureEventUpdate,
} from './capture.schema'
export {
  captureCandidateRepository,
  captureEventRepository,
  hasCaptureForSource,
  listCaptureEventsBySource,
  type CaptureCandidateListWhere,
  type CaptureDuplicateCheckInput,
  type CaptureEventListWhere,
  type CaptureEventSourceReadDatabase,
} from './capture.repository'

// Settings - 用户设置
export {
  settingsResource,
  settingsTable,
  SETTING_KEYS,
  type SettingKey,
  type SettingsRow,
  type SettingsInsert,
  type SettingsUpdate,
} from './settings'

// Agent - AI 助手配置
export {
  agentResource,
  agentTable,
  type AgentRow,
  type AgentInsert,
  type AgentUpdate,
} from './agent.schema'
export { agentRepository } from './agent.repository'

export {
  skillResource,
  skillTable,
  type SkillRow,
  type SkillInsert,
  type SkillUpdate,
} from './skill.schema'

export {
  DEFAULT_AGENT_PROVIDERS,
  type AgentProviderMetadata,
  type AgentModelOption,
} from './agent.providers'

// ============================================
// 其他模型
// ============================================

// Session - 会话管理
export {
  sessionResource,
  sessionTable,
  buildRuntimeSessionIri,
  extractSessionIdFromSessionRef,
  extractRuntimeSessionId,
  type SessionStatus,
  type SessionRow,
  type SessionInsert,
  type SessionUpdate,
} from './session'
export { sessionRepository } from './session.repository'

// Approval / Audit / Grant / Inbox Notification
export {
  approvalResource,
  approvalTable,
  extractApprovalIdFromApprovalRef,
  type ApprovalRow,
  type ApprovalInsert,
  type ApprovalUpdate,
} from './approval.schema'

export {
  claimApprovalRequest,
  isApprovalStatusClaimable,
  type ApprovalClaimDatabase,
  type ApprovalClaimRequest,
  type ApprovalClaimResult,
  type ApprovalClaimStatus,
} from './approval.repository'
export {
  claimControlRequest,
  isControlRequestStatusClaimable,
  type ClaimableControlRequestRow,
  type ControlRequestClaimDatabase,
  type ControlRequestClaimOptions,
  type ControlRequestClaimResource,
  type ControlRequestClaimResult,
  type ControlRequestClaimRow,
  type ControlRequestClaimStatus,
  type ControlRequestClaimUpdate,
} from './control-request.repository'

export {
  auditResource,
  auditTable,
  extractAuditIdFromAuditRef,
  type AuditRow,
  type AuditInsert,
  type AuditUpdate,
} from './audit.schema'
export {
  buildAuditDetailRecord,
  buildAuditPresentation,
  createResolvedAuthTimestampsIndex,
  formatAuditActorRole,
  formatInboxStatusLabel,
  type AuditPresentation,
} from './audit.presentation'

export {
  grantResource,
  grantTable,
  type GrantRow,
  type GrantInsert,
  type GrantUpdate,
} from './grant.schema'

export {
  inboxNotificationResource,
  inboxNotificationTable,
  type InboxNotificationRow,
  type InboxNotificationInsert,
  type InboxNotificationUpdate,
} from './inbox-notification.schema'

export {
  InputRequestStatus,
  inputRequestResource,
  inputRequestTable,
  extractInputRequestIdFromInputRequestRef,
  type InputRequestStatusType,
  type InputRequestRow,
  type InputRequestInsert,
  type InputRequestUpdate,
} from './input-request.schema'
export {
  claimInputRequest,
  isInputRequestStatusClaimable,
  type InputRequestClaimDatabase,
  type InputRequestClaimRequest,
  type InputRequestClaimResult,
  type InputRequestClaimStatus,
} from './input-request.repository'

// Sidecar vocab + runtime contracts
export { ApprovalVocab, AuditVocab, GrantVocab, GrantReadVocab, InputRequestVocab, LegacyGrantVocab, InboxNotificationVocab } from './vocab/sidecar.vocab'
export * from './sidecar/sidecar-events'
export * from './sidecar/persistence-mapping'

// Knowledge Folder - 知识库文件夹
export {
  knowledgeFolderSchema,
  type KnowledgeFolderScope
} from './knowledge'

// Extension - 扩展
export { extensionSchema } from './extension'

// AI/Credential shared schema
export {
  apiKeyCredentialResource,
  apiKeyCredentialTable,
  credentialResource,
  credentialTable,
  oauthCredentialResource,
  oauthCredentialTable,
  type ApiKeyCredentialRow,
  type ApiKeyCredentialInsert,
  type ApiKeyCredentialUpdate,
  type CredentialRow,
  type CredentialInsert,
  type CredentialUpdate,
  type OAuthCredentialRow,
  type OAuthCredentialInsert,
  type OAuthCredentialUpdate,
} from "./credential.schema";

export {
  aiProviderResource,
  aiProviderTable,
  type AIProviderRow,
  type AIProviderInsert,
  type AIProviderUpdate,
} from "./ai-provider.schema";

export {
  aiModelResource,
  aiModelTable,
  type AIModelRow,
  type AIModelInsert,
  type AIModelUpdate,
} from "./ai-model.schema";

export {
  agentStatusResource,
  agentStatusTable,
  aiConfigResource,
  aiConfigTable,
  indexedFileResource,
  indexedFileTable,
  vectorStoreResource,
  vectorStoreTable,
  type AgentStatusRow,
  type AgentStatusInsert,
  type AgentStatusUpdate,
  type AIConfigRow,
  type AIConfigInsert,
  type AIConfigUpdate as AIConfigResourceUpdate,
  type IndexedFileRow,
  type IndexedFileInsert,
  type IndexedFileUpdate,
  type VectorStoreRow,
  type VectorStoreInsert,
  type VectorStoreUpdate,
} from './ai-runtime.schema'

export {
  aiConfigModelRef,
  aiConfigModelUri,
  aiConfigProviderRef,
  aiConfigProviderUri,
  aiConfigRepository,
  buildAIConfigDisconnectPlan,
  buildAIConfigMutationPlan,
  buildAIConfigProviderStateMap,
  getAIConfigDefaultBaseUrl,
  getAIConfigProviderCatalog,
  getAIConfigProviderFamilyIds,
  getAIConfigProviderIdsForBackend,
  getAIConfigProviderMetadata,
  createAIConfigCredentialId,
  normalizeAIConfigProviderId,
  normalizeAIConfigModelId,
  normalizeAIConfigResourceId,
  sameAIConfigProviderFamily,
  selectAIConfigCredential,
  selectAIConfigCredentialForBackend,
  type AIConfigModel,
  type AIConfigBackendCredentialSelection,
  type AIConfigCredentialSelection,
  type AIConfigDisconnectPlan,
  type AIConfigMutationPlan,
  type AIConfigProviderCatalogEntry,
  type AIConfigProviderState,
  type AIConfigUpdate,
  type BuildAIConfigProviderStateMapOptions,
} from './ai-config'

export {
  applySolidComunicaPatches,
} from './comunica-patches'

export {
  PROTOCOL_METADATA_KEY,
  getProtocolMetadata,
  withProtocolMetadata,
  withoutProtocolProjectionKeys,
  type ProtocolMetadataRecord,
} from './protocol-metadata'

export {
  approvalDescriptor,
  automationRuleDescriptor,
  captureCandidateDescriptor,
  captureEventDescriptor,
  chatDescriptor,
  contactDescriptor,
  credentialDescriptor,
  createPodModelDescriptorRegistry,
  createPodSchema,
  createPodStorage,
  deliveryDescriptor,
  evidenceDescriptor,
  ideaDescriptor,
  inputRequestDescriptor,
  issueDescriptor,
  messageDescriptor,
  officialPodModelDescriptors,
  podSchema,
  reportDescriptor,
  runDescriptor,
  runStepDescriptor,
  scheduleDescriptor,
  sessionDescriptor,
  taskDescriptor,
  threadDescriptor,
  type PodModelDescriptor,
  type PodModelDescriptorSource,
  type PodModelDescriptorTrustLevel,
  type PodModelFieldDescriptor,
  type PodModelFieldType,
  type PodModelMergePolicy,
  type PodSchemaClassEntry,
  type PodSchemaPredicateEntry,
  type PodSchemaSearchEntry,
  type PodStorageCommitResult,
  type PodStorageMutationPlan,
  type PodStorageValidationResult,
} from './pod-storage-descriptor'

export {
  createResourceRepositoryDescriptor,
  createRepositoryDescriptor,
  definePodRepository,
  initSolidResources,
  initSolidTables,
  type AnyPodResource,
  type AnyPodTable,
  type PodRepositoryDescriptor,
  type PodResourceRepositoryOptions,
  type RepositoryCacheOptions,
  type RepositoryInvalidations,
  type RepositoryScope,
  type SolidDatabase,
} from './repository'

// Import Job - 导入任务
export { importJobSchema } from './import'

// ============================================
// 数据库操作符 (统一出口)
// ============================================
export { eq, ne, and, or, drizzle } from '@undefineds.co/drizzle-solid'

// ============================================
// Schema registry
// ============================================
export { solidResources, solidSchema } from './schema'

// ============================================
// Discovery Service (发现服务)
// ============================================
export * from './discovery'
