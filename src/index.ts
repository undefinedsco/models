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
  // xpod vocabs
  XPOD_CREDENTIAL,
  XPOD_AI,
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
  extractChatIdFromChatRef,
  extractChatThreadRef,
  extractThreadIdFromThreadRef,
  resolveThreadChatId,
  toTimestamp,
  type ChatThreadRef,
} from './chat.utils'

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
export { messageRepository } from './message.repository'

export {
  TaskStatus,
  TaskTriggerKind,
  taskResource,
  taskTable,
  type TaskStatusType,
  type TaskTriggerKindType,
  type TaskRow,
  type TaskInsert,
  type TaskUpdate,
} from './task.schema'

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
  chatResourceId,
  commandKindFromResourceId,
  dateParts,
  messageResourceId,
  parentDir,
  resourceKey,
  runResourceId,
  runStepResourceId,
  surfaceIdFromCommandResourceId,
  taskResourceId,
  threadResourceId,
  type CommandKind,
  type DateInput,
  type DateParts,
} from './resource-id-defaults'

// Issue - user-facing work item that can be inspected through chat/thread
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

// File - 文件管理
export {
  fileResource,
  fileTable,
  type FileRow,
  type FileInsert,
  type FileUpdate,
} from './file'

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
  buildSessionResourceId,
  buildSessionSubjectPath,
  buildRuntimeSessionIri,
  extractSessionIdFromSessionRef,
  extractRuntimeSessionId,
  type SessionType,
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
  buildApprovalSubjectPath,
  extractApprovalIdFromApprovalRef,
  type ApprovalRow,
  type ApprovalInsert,
  type ApprovalUpdate,
} from './approval.schema'

export {
  auditResource,
  auditTable,
  buildAuditSubjectPath,
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
  buildGrantSubjectPath,
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

// Sidecar vocab + runtime contracts
export { ApprovalVocab, AuditVocab, GrantVocab, InboxNotificationVocab } from './vocab/sidecar.vocab'
export * from './sidecar/sidecar-events'
export * from './sidecar/persistence-mapping'

// Knowledge Folder - 知识库文件夹
export {
  knowledgeFolderSchema,
  type KnowledgeFolderScope
} from './knowledge'

// Extension - 扩展
export { extensionSchema } from './extension'

// xpod AI schema
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
  buildAIConfigDisconnectPlan,
  buildAIConfigMutationPlan,
  buildAIConfigProviderStateMap,
  getAIConfigDefaultBaseUrl,
  getAIConfigProviderCatalog,
  getAIConfigProviderFamilyIds,
  getAIConfigProviderMetadata,
  getDefaultAIConfigCredentialId,
  normalizeAIConfigProviderId,
  normalizeAIConfigModelId,
  normalizeAIConfigResourceId,
  sameAIConfigProviderFamily,
  selectAIConfigCredential,
  type AIConfigModel,
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
  credentialDescriptor,
  createPodModelDescriptorRegistry,
  createPodSchema,
  createPodStorage,
  officialPodModelDescriptors,
  podSchema,
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
  createRepositoryDescriptor,
  definePodRepository,
  initSolidResources,
  initSolidTables,
  type AnyPodResource,
  type AnyPodTable,
  type PodRepositoryDescriptor,
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
