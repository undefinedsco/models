import { describe, expect, it } from 'vitest'
import {
  agentResource,
  agentTable,
  approvalResource,
  approvalTable,
  auditResource,
  auditTable,
  chatResource,
  chatTable,
  contactResource,
  contactTable,
  favoriteResource,
  favoriteTable,
  fileResource,
  fileTable,
  grantResource,
  grantTable,
  inboxNotificationResource,
  inboxNotificationTable,
  issueResource,
  issueTable,
  initSolidResources,
  initSolidTables,
  messageResource,
  messageTable,
  runResource,
  runStepResource,
  runTable,
  runStepTable,
  settingsResource,
  settingsTable,
  solidProfileResource,
  solidProfileTable,
  solidResources,
  solidSchema,
  threadResource,
  threadTable,
  taskResource,
  taskTable,
} from '../src'

describe('shared Solid resources', () => {
  it('exports Resource names with Table aliases for compatibility', () => {
    expect(solidProfileResource).toBe(solidProfileTable)
    expect(contactResource).toBe(contactTable)
    expect(agentResource).toBe(agentTable)
    expect(chatResource).toBe(chatTable)
    expect(threadResource).toBe(threadTable)
    expect(messageResource).toBe(messageTable)
    expect(taskResource).toBe(taskTable)
    expect(runResource).toBe(runTable)
    expect(runStepResource).toBe(runStepTable)
    expect(fileResource).toBe(fileTable)
    expect(favoriteResource).toBe(favoriteTable)
    expect(settingsResource).toBe(settingsTable)
    expect(issueResource).toBe(issueTable)
    expect(approvalResource).toBe(approvalTable)
    expect(auditResource).toBe(auditTable)
    expect(grantResource).toBe(grantTable)
    expect(inboxNotificationResource).toBe(inboxNotificationTable)
  })

  it('keeps solidResources Resource-only and solidSchema Table-compatible', () => {
    expect(solidResources).toMatchObject({
      solidProfileResource,
      contactResource,
      agentResource,
      chatResource,
      threadResource,
      messageResource,
      taskResource,
      runResource,
      runStepResource,
      fileResource,
      favoriteResource,
      settingsResource,
      issueResource,
      approvalResource,
      auditResource,
      grantResource,
      inboxNotificationResource,
    })

    expect((solidResources as any).solidProfileTable).toBeUndefined()
    expect((solidResources as any).contactTable).toBeUndefined()
    expect((solidResources as any).agentTable).toBeUndefined()
    expect((solidResources as any).chatTable).toBeUndefined()
    expect((solidResources as any).threadTable).toBeUndefined()
    expect((solidResources as any).messageTable).toBeUndefined()
    expect((solidResources as any).taskTable).toBeUndefined()
    expect((solidResources as any).runTable).toBeUndefined()
    expect((solidResources as any).runStepTable).toBeUndefined()
    expect((solidResources as any).fileTable).toBeUndefined()
    expect((solidResources as any).favoriteTable).toBeUndefined()
    expect((solidResources as any).settingsTable).toBeUndefined()
    expect((solidResources as any).issueTable).toBeUndefined()
    expect((solidResources as any).approvalTable).toBeUndefined()
    expect((solidResources as any).auditTable).toBeUndefined()
    expect((solidResources as any).grantTable).toBeUndefined()
    expect((solidResources as any).inboxNotificationTable).toBeUndefined()

    expect(solidSchema).toMatchObject({
      solidProfileTable,
      contactTable,
      agentTable,
      chatTable,
      threadTable,
      messageTable,
      taskTable,
      runTable,
      runStepTable,
      fileTable,
      favoriteTable,
      settingsTable,
      issueTable,
      approvalTable,
      auditTable,
      grantTable,
      inboxNotificationTable,
    })
  })

  it('exports resource-first repository helper aliases', () => {
    expect(initSolidResources).toBe(initSolidTables)
  })

  it('uses exact-id mode for command resources', () => {
    expect(chatResource.hasCustomTemplate()).toBe(false)
    expect(threadResource.hasCustomTemplate()).toBe(false)
    expect(messageResource.hasCustomTemplate()).toBe(false)
    expect(taskResource.hasCustomTemplate()).toBe(false)
    expect(runResource.hasCustomTemplate()).toBe(false)
    expect(runStepResource.hasCustomTemplate()).toBe(false)
    expect(chatResource.config.base).toBe('/.data/chat/')
    expect(threadResource.config.base).toBe('/.data/')
    expect(messageResource.config.base).toBe('/.data/')
    expect(taskResource.config.base).toBe('/.data/task/')
    expect(runResource.config.base).toBe('/.data/')
    expect(runStepResource.config.base).toBe('/.data/')
  })
})
