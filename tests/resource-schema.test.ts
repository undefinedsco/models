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
  captureCandidateResource,
  captureEventResource,
  chatResource,
  chatTable,
  contactResource,
  contactTable,
  deliveryResource,
  deliveryTable,
  evidenceResource,
  favoriteResource,
  favoriteTable,
  grantResource,
  grantTable,
  ideaResource,
  inboxNotificationResource,
  inboxNotificationTable,
  inputRequestResource,
  inputRequestTable,
  issueResource,
  issueTable,
  reportResource,
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
  skillResource,
  skillTable,
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
  it('keeps legacy Table aliases only for compatibility', () => {
    expect(solidProfileResource).toBe(solidProfileTable)
    expect(contactResource).toBe(contactTable)
    expect(agentResource).toBe(agentTable)
    expect(skillResource).toBe(skillTable)
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
    expect(inputRequestResource).toBe(inputRequestTable)
  })

  it('keeps solidResources Resource-only and solidSchema legacy-compatible only', () => {
    expect(solidResources).toMatchObject({
      solidProfileResource,
      contactResource,
      agentResource,
      skillResource,
      chatResource,
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
      favoriteResource,
      settingsResource,
      ideaResource,
      issueResource,
      captureCandidateResource,
      captureEventResource,
      approvalResource,
      auditResource,
      grantResource,
      inboxNotificationResource,
      inputRequestResource,
    })

    expect((solidResources as any).solidProfileTable).toBeUndefined()
    expect((solidResources as any).contactTable).toBeUndefined()
    expect((solidResources as any).agentTable).toBeUndefined()
    expect((solidResources as any).skillTable).toBeUndefined()
    expect((solidResources as any).chatTable).toBeUndefined()
    expect((solidResources as any).threadTable).toBeUndefined()
    expect((solidResources as any).messageTable).toBeUndefined()
    expect((solidResources as any).taskTable).toBeUndefined()
    expect((solidResources as any).scheduleTable).toBeUndefined()
    expect((solidResources as any).automationRuleTable).toBeUndefined()
    expect((solidResources as any).deliveryTable).toBeUndefined()
    expect((solidResources as any).evidenceTable).toBeUndefined()
    expect((solidResources as any).reportTable).toBeUndefined()
    expect((solidResources as any).runTable).toBeUndefined()
    expect((solidResources as any).runStepTable).toBeUndefined()
    expect((solidResources as any).fileResource).toBeUndefined()
    expect((solidResources as any).fileTable).toBeUndefined()
    expect((solidResources as any).favoriteTable).toBeUndefined()
    expect((solidResources as any).settingsTable).toBeUndefined()
    expect((solidResources as any).ideaTable).toBeUndefined()
    expect((solidResources as any).issueTable).toBeUndefined()
    expect((solidResources as any).captureCandidateTable).toBeUndefined()
    expect((solidResources as any).captureEventTable).toBeUndefined()
    expect((solidResources as any).approvalTable).toBeUndefined()
    expect((solidResources as any).auditTable).toBeUndefined()
    expect((solidResources as any).grantTable).toBeUndefined()
    expect((solidResources as any).inboxNotificationTable).toBeUndefined()
    expect((solidResources as any).inputRequestTable).toBeUndefined()

    expect(solidSchema).toMatchObject({
      solidProfileTable,
      contactTable,
      agentTable,
      skillTable,
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
      inputRequestTable,
    })
    expect((solidSchema as any).evidenceTable).toBeUndefined()
    expect((solidSchema as any).reportTable).toBeUndefined()
    expect((solidSchema as any).ideaTable).toBeUndefined()
  })

  it('exports resource-first repository helper aliases', () => {
    expect(initSolidResources).toBe(initSolidTables)
  })

  it('uses exact-id mode for command resources', () => {
    expect(agentResource.hasCustomTemplate()).toBe(false)
    expect(skillResource.hasCustomTemplate()).toBe(false)
    expect(chatResource.hasCustomTemplate()).toBe(false)
    expect(threadResource.hasCustomTemplate()).toBe(false)
    expect(messageResource.hasCustomTemplate()).toBe(false)
    expect(taskResource.hasCustomTemplate()).toBe(false)
    expect(scheduleResource.hasCustomTemplate()).toBe(false)
    expect(automationRuleResource.hasCustomTemplate()).toBe(false)
    expect(deliveryResource.hasCustomTemplate()).toBe(false)
    expect(evidenceResource.hasCustomTemplate()).toBe(false)
    expect(reportResource.hasCustomTemplate()).toBe(false)
    expect(captureCandidateResource.hasCustomTemplate()).toBe(false)
    expect(captureEventResource.hasCustomTemplate()).toBe(false)
    expect(runResource.hasCustomTemplate()).toBe(false)
    expect(runStepResource.hasCustomTemplate()).toBe(false)
    expect(agentResource.config.base).toBe('/agents/')
    expect(skillResource.config.base).toBe('/agents/')
    expect(chatResource.config.base).toBe('/.data/chat/')
    expect(threadResource.config.base).toBe('/.data/')
    expect(messageResource.config.base).toBe('/.data/')
    expect(taskResource.config.base).toBe('/.data/task/')
    expect(scheduleResource.config.base).toBe('/.data/')
    expect(automationRuleResource.config.base).toBe('/.data/')
    expect(deliveryResource.config.base).toBe('/.data/')
    expect(evidenceResource.config.base).toBe('/.data/')
    expect(reportResource.config.base).toBe('/.data/')
    expect(captureCandidateResource.config.base).toBe('/.data/capture/')
    expect(captureEventResource.config.base).toBe('/.data/capture/')
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
    expect((ideaResource.columns as Record<string, unknown>).sourceId).toBeUndefined()
    expect((ideaResource.columns as Record<string, unknown>).sourceUri).toBeUndefined()
    expect((scheduleResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((automationRuleResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((deliveryResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((deliveryResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((evidenceResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((evidenceResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((captureCandidateResource.columns as Record<string, unknown>).sourceId).toBeUndefined()
    expect((captureCandidateResource.columns as Record<string, unknown>).sourceUri).toBeUndefined()
    expect((captureEventResource.columns as Record<string, unknown>).targetResourceId).toBeUndefined()
    expect((captureEventResource.columns as Record<string, unknown>).sourceUri).toBeUndefined()
    expect((reportResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((reportResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((runResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((runResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).commandKind).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).surface).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).runId).toBeUndefined()
    expect((runStepResource.columns as Record<string, unknown>).payload).toBeDefined()
    expect((runStepResource.columns as Record<string, unknown>).data).toBeUndefined()
  })

  it('keeps schema id defaults readable at the definition site', () => {
    const sourceRoot = join(__dirname, '../src')
    const sourceFiles = listSourceFiles(sourceRoot)
    const hiddenIdDefaults = sourceFiles.flatMap((file) => {
      const source = readFileSync(file, 'utf-8')
      return Array.from(source.matchAll(/id\(\s*['"]id['"]\s*\)\.default\(\s*[A-Za-z0-9_]+ResourceId\s*\)/g))
        .map((match) => `${file.replace(`${sourceRoot}/`, '')}:${match[0]}`)
    })

    expect(hiddenIdDefaults).toEqual([])
  })

  it('keeps shared resources on id defaults instead of legacy template config', () => {
    const sourceRoot = join(__dirname, '../src')
    const sourceFiles = listSourceFiles(sourceRoot)
    const legacyKey = ['subject', 'Template'].join('')
    const violations = sourceFiles.flatMap((file) => {
      const source = readFileSync(file, 'utf-8')
      if (file.endsWith('/pod-storage-descriptor.ts')) return []
      return source.includes(`${legacyKey}:`)
        ? [file.replace(`${sourceRoot}/`, '')]
        : []
    })

    expect(violations).toEqual([])
  })
})
