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
  settingsResource,
  settingsTable,
  solidProfileResource,
  solidProfileTable,
  solidResources,
  solidSchema,
  threadResource,
  threadTable,
} from '../src'

describe('shared Solid resources', () => {
  it('exports Resource names with Table aliases for compatibility', () => {
    expect(solidProfileResource).toBe(solidProfileTable)
    expect(contactResource).toBe(contactTable)
    expect(agentResource).toBe(agentTable)
    expect(chatResource).toBe(chatTable)
    expect(threadResource).toBe(threadTable)
    expect(messageResource).toBe(messageTable)
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
})
