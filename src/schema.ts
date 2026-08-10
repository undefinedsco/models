import { agentResource, agentTable } from './agent.schema'
import {
  agentStatusResource,
  agentStatusTable,
  aiConfigResource,
  aiConfigTable,
  indexedFileResource,
  indexedFileTable,
  vectorStoreResource,
  vectorStoreTable,
} from './ai-runtime.schema'
import {
  gatewayAccessKeyResource,
  gatewayAccessKeyTable,
  quotaSnapshotResource,
  quotaSnapshotTable,
} from './ai-gateway.schema'
import { approvalResource, approvalTable } from './approval.schema'
import { auditResource, auditTable } from './audit.schema'
import {
  aiModelResource,
  aiModelTable,
  chatModelResource,
  documentUnderstandingModelResource,
  embeddingModelResource,
  imageGenerationModelResource,
  rerankingModelResource,
  speechRecognitionModelResource,
  speechSynthesisModelResource,
  videoGenerationModelResource,
} from './ai-model.schema'
import { aiProviderResource, aiProviderTable } from './ai-provider.schema'
import { chatResource, chatTable } from './chat.schema'
import { chatProjectContextResource, chatProjectMemoryResource } from './chat-project.schema'
import { conversationShareResource } from './conversation-share.schema'
import { contactResource, contactTable } from './contact.schema'
import { captureCandidateResource, captureEventResource } from './capture.schema'
import { credentialResource, credentialTable } from './credential.schema'
import { deliveryResource, deliveryTable } from './delivery.schema'
import { evidenceResource } from './evidence.schema'
import { favoriteResource, favoriteTable } from './favorite/favorite.schema'
import { grantResource, grantTable } from './grant.schema'
import { ideaResource } from './idea.schema'
import { inboxNotificationResource, inboxNotificationTable } from './inbox-notification.schema'
import { inputRequestResource, inputRequestTable } from './input-request.schema'
import { issueResource, issueTable } from './issue.schema'
import { messageResource, messageTable } from './message.schema'
import { solidProfileResource, solidProfileTable } from './profile.schema'
import { reportResource } from './report.schema'
import { runResource, runStepResource, runTable, runStepTable } from './run.schema'
import { scheduleResource, scheduleTable } from './schedule.schema'
import { sessionResource, sessionTable } from './session'
import { settingsResource, settingsTable } from './settings/settings.schema'
import { skillResource, skillTable } from './skill.schema'
import { taskResource, taskTable } from './task.schema'
import { threadResource, threadTable } from './thread.schema'
import { automationRuleResource, automationRuleTable } from './automation-rule.schema'

export const solidResources = {
  solidProfileResource,
  contactResource,
  agentResource,
  skillResource,
  chatResource,
  chatProjectContextResource,
  chatProjectMemoryResource,
  conversationShareResource,
  sessionResource,
  threadResource,
  messageResource,
  taskResource,
  scheduleResource,
  automationRuleResource,
  deliveryResource,
  evidenceResource,
  reportResource,
  runResource,
  runStepResource,
  credentialResource,
  aiProviderResource,
  aiModelResource,
  chatModelResource,
  embeddingModelResource,
  documentUnderstandingModelResource,
  rerankingModelResource,
  imageGenerationModelResource,
  speechRecognitionModelResource,
  speechSynthesisModelResource,
  videoGenerationModelResource,
  aiConfigResource,
  vectorStoreResource,
  indexedFileResource,
  agentStatusResource,
  gatewayAccessKeyResource,
  quotaSnapshotResource,
  favoriteResource,
  settingsResource,
  ideaResource,
  issueResource,
  captureCandidateResource,
  captureEventResource,

  // Sidecar collaboration data
  approvalResource,
  auditResource,
  grantResource,
  inboxNotificationResource,
  inputRequestResource,
}

// Compatibility registry for existing drizzle-solid call sites that still import
// `*Table` names. New shared-model code should prefer `solidResources`.
export const solidSchema = {
  solidProfileTable,
  contactTable,
  agentTable,
  skillTable,
  chatTable,
  sessionTable,
  threadTable,
  messageTable,
  taskTable,
  scheduleTable,
  automationRuleTable,
  deliveryTable,
  runTable,
  runStepTable,
  credentialTable,
  aiProviderTable,
  aiModelTable,
  aiConfigTable,
  vectorStoreTable,
  indexedFileTable,
  agentStatusTable,
  gatewayAccessKeyTable,
  quotaSnapshotTable,
  favoriteTable,
  settingsTable,
  issueTable,

  // Sidecar collaboration data
  approvalTable,
  auditTable,
  grantTable,
  inboxNotificationTable,
  inputRequestTable,
}
