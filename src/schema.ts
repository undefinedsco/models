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
import { approvalResource, approvalTable } from './approval.schema'
import { auditResource, auditTable } from './audit.schema'
import { aiModelResource, aiModelTable } from './ai-model.schema'
import { aiProviderResource, aiProviderTable } from './ai-provider.schema'
import { chatResource, chatTable } from './chat.schema'
import { contactResource, contactTable } from './contact.schema'
import { credentialResource, credentialTable } from './credential.schema'
import { deliveryResource, deliveryTable } from './delivery.schema'
import { evidenceResource } from './evidence.schema'
import { favoriteResource, favoriteTable } from './favorite/favorite.schema'
import { grantResource, grantTable } from './grant.schema'
import { ideaResource } from './idea.schema'
import { inboxNotificationResource, inboxNotificationTable } from './inbox-notification.schema'
import { issueResource, issueTable } from './issue.schema'
import { messageResource, messageTable } from './message.schema'
import { solidProfileResource, solidProfileTable } from './profile.schema'
import { reportResource } from './report.schema'
import { runResource, runStepResource, runTable, runStepTable } from './run.schema'
import { scheduleResource, scheduleTable } from './schedule.schema'
import { sessionResource, sessionTable } from './session'
import { settingsResource, settingsTable } from './settings/settings.schema'
import { taskResource, taskTable } from './task.schema'
import { threadResource, threadTable } from './thread.schema'
import { automationRuleResource, automationRuleTable } from './automation-rule.schema'

export const solidResources = {
  solidProfileResource,
  contactResource,
  agentResource,
  chatResource,
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
  aiConfigResource,
  vectorStoreResource,
  indexedFileResource,
  agentStatusResource,
  favoriteResource,
  settingsResource,
  ideaResource,
  issueResource,

  // Sidecar collaboration data
  approvalResource,
  auditResource,
  grantResource,
  inboxNotificationResource,
}

// Compatibility registry for existing drizzle-solid call sites that still import
// `*Table` names. New shared-model code should prefer `solidResources`.
export const solidSchema = {
  solidProfileTable,
  contactTable,
  agentTable,
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
  favoriteTable,
  settingsTable,
  issueTable,

  // Sidecar collaboration data
  approvalTable,
  auditTable,
  grantTable,
  inboxNotificationTable,
}
