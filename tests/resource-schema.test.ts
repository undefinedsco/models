import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  agentResource,
  agentTable,
  automationRuleResource,
  automationRuleTable,
  approvalResource,
  approvalTable,
  auditResource,
  auditTable,
  chatResource,
  chatTable,
  contactResource,
  contactTable,
  deliveryResource,
  deliveryTable,
  favoriteResource,
  favoriteTable,
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
  scheduleResource,
  scheduleTable,
  solidProfileResource,
  solidProfileTable,
  solidResources,
  solidSchema,
  sessionResource,
  threadResource,
  threadTable,
  taskResource,
  taskTable,
} from '../src'

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return entry.isFile() && path.endsWith('.ts') ? [path] : []
  })
}

describe('shared Solid resources', () => {
  it('exports Resource names with Table aliases for compatibility', () => {
    expect(solidProfileResource).toBe(solidProfileTable)
    expect(contactResource).toBe(contactTable)
    expect(agentResource).toBe(agentTable)
    expect(chatResource).toBe(chatTable)
    expect(threadResource).toBe(threadTable)
    expect(messageResource).toBe(messageTable)
    expect(taskResource).toBe(taskTable)
    expect(scheduleResource).toBe(scheduleTable)
    expect(automationRuleResource).toBe(automationRuleTable)
    expect(deliveryResource).toBe(deliveryTable)
    expect(runResource).toBe(runTable)
    expect(runStepResource).toBe(runStepTable)
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
      scheduleResource,
      automationRuleResource,
      deliveryResource,
      runResource,
      runStepResource,
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
    expect((solidResources as any).scheduleTable).toBeUndefined()
    expect((solidResources as any).automationRuleTable).toBeUndefined()
    expect((solidResources as any).deliveryTable).toBeUndefined()
    expect((solidResources as any).runTable).toBeUndefined()
    expect((solidResources as any).runStepTable).toBeUndefined()
    expect((solidResources as any).fileResource).toBeUndefined()
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
      scheduleTable,
      automationRuleTable,
      deliveryTable,
      runTable,
      runStepTable,
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
    expect(scheduleResource.hasCustomTemplate()).toBe(false)
    expect(automationRuleResource.hasCustomTemplate()).toBe(false)
    expect(deliveryResource.hasCustomTemplate()).toBe(false)
    expect(runResource.hasCustomTemplate()).toBe(false)
    expect(runStepResource.hasCustomTemplate()).toBe(false)
    expect(chatResource.config.base).toBe('/.data/chat/')
    expect(threadResource.config.base).toBe('/.data/')
    expect(messageResource.config.base).toBe('/.data/')
    expect(taskResource.config.base).toBe('/.data/task/')
    expect(scheduleResource.config.base).toBe('/.data/')
    expect(automationRuleResource.config.base).toBe('/.data/')
    expect(deliveryResource.config.base).toBe('/.data/')
    expect(runResource.config.base).toBe('/.data/')
    expect(runStepResource.config.base).toBe('/.data/')
  })

  it('does not name RDF URI relation columns as *Id fields', () => {
    const sourceRoot = join(__dirname, '../src')
    const sourceFiles = listSourceFiles(sourceRoot)
    const violations = sourceFiles.flatMap((file) => {
      const source = readFileSync(file, 'utf-8')
      return Array.from(source.matchAll(/\buri\(\s*['"]([A-Za-z0-9_]*Id)['"]\s*\)/g))
        .map((match) => `${file.replace(`${sourceRoot}/`, '')}:${match[1]}`)
    })

    expect(violations).toEqual([])
  })

  it('does not name RDF URI relation columns as *Uri fields', () => {
    const sourceRoot = join(__dirname, '../src')
    const sourceFiles = listSourceFiles(sourceRoot)
    const violations = sourceFiles.flatMap((file) => {
      const source = readFileSync(file, 'utf-8')
      return Array.from(source.matchAll(/\buri\(\s*['"]([A-Za-z0-9_]*Uri)['"]\s*\)/g))
        .map((match) => `${file.replace(`${sourceRoot}/`, '')}:${match[1]}`)
    })

    expect(violations).toEqual([])
  })

  it('does not reintroduce legacy relation predicates for canonical fields', () => {
    expect((threadResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((threadResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((threadResource.columns as Record<string, unknown>).surfaceId).toBeUndefined()
    expect((messageResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((messageResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((messageResource.columns as Record<string, unknown>).messageResource).toBeUndefined()
    expect((sessionResource.columns as Record<string, unknown>).ownerWebId).toBeUndefined()
    expect((sessionResource.columns as Record<string, unknown>).messageResources).toBeUndefined()
    expect((taskResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((scheduleResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((automationRuleResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((deliveryResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((deliveryResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((runResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((runResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).runId).toBeUndefined()
  })
})
