import { describe, expect, it } from 'vitest'
import {
  agentStatusResource,
  agentStatusTable,
  aiConfigResource,
  aiConfigTable,
  aiModelResource,
  aiModelTable,
  aiProviderResource,
  aiProviderTable,
  apiKeyCredentialResource,
  apiKeyCredentialTable,
  CredentialSecretAlgorithm,
  CredentialStorageMode,
  credentialResource,
  credentialTable,
  indexedFileResource,
  indexedFileTable,
  oauthCredentialResource,
  oauthCredentialTable,
  ProviderAuthMode,
  solidResources,
  solidSchema,
  UDFS,
  vectorStoreResource,
  vectorStoreTable,
} from '../src'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
}

function resourceConfigOf(resource: unknown): { type?: string; namespace?: unknown; sparqlEndpoint?: string } {
  return ((resource as any)?._?.config ?? (resource as any)?.config) as {
    type?: string
    namespace?: unknown
    sparqlEndpoint?: string
  }
}

function predicateOf(resource: unknown, field: string): string {
  const column = columnsOf(resource)[field] as {
    getPredicate?: (namespace?: unknown) => string
    options?: { predicate?: unknown }
  }
  return column.getPredicate?.(resourceConfigOf(resource).namespace) ??
    (typeof column.options?.predicate === 'string' ? column.options.predicate : '')
}

function expectColumns(resource: unknown, fields: string[]): void {
  expect(Object.keys(columnsOf(resource))).toEqual(expect.arrayContaining(fields))
}

describe('AI runtime resources', () => {
  it('exports Resource names with Table aliases for compatibility', () => {
    expect(credentialResource).toBe(credentialTable)
    expect(apiKeyCredentialResource).toBe(credentialResource)
    expect(apiKeyCredentialTable).toBe(credentialResource)
    expect(oauthCredentialResource).toBe(credentialResource)
    expect(oauthCredentialTable).toBe(credentialResource)

    expect(aiProviderResource).toBe(aiProviderTable)
    expect(aiModelResource).toBe(aiModelTable)
    expect(aiConfigResource).toBe(aiConfigTable)
    expect(vectorStoreResource).toBe(vectorStoreTable)
    expect(indexedFileResource).toBe(indexedFileTable)
    expect(agentStatusResource).toBe(agentStatusTable)
  })

  it('registers resources and compatibility schema entries', () => {
    expect((solidResources as any).credentialResource).toBe(credentialResource)
    expect((solidResources as any).aiProviderResource).toBe(aiProviderResource)
    expect((solidResources as any).aiModelResource).toBe(aiModelResource)
    expect((solidResources as any).aiConfigResource).toBe(aiConfigResource)
    expect((solidResources as any).vectorStoreResource).toBe(vectorStoreResource)
    expect((solidResources as any).indexedFileResource).toBe(indexedFileResource)
    expect((solidResources as any).agentStatusResource).toBe(agentStatusResource)

    expect((solidResources as any).credentialTable).toBeUndefined()
    expect((solidResources as any).aiProviderTable).toBeUndefined()
    expect((solidResources as any).aiModelTable).toBeUndefined()
    expect((solidResources as any).aiConfigTable).toBeUndefined()
    expect((solidResources as any).vectorStoreTable).toBeUndefined()
    expect((solidResources as any).indexedFileTable).toBeUndefined()
    expect((solidResources as any).agentStatusTable).toBeUndefined()

    expect((solidSchema as any).credentialTable).toBe(credentialTable)
    expect((solidSchema as any).aiProviderTable).toBe(aiProviderTable)
    expect((solidSchema as any).aiModelTable).toBe(aiModelTable)
    expect((solidSchema as any).aiConfigTable).toBe(aiConfigTable)
    expect((solidSchema as any).vectorStoreTable).toBe(vectorStoreTable)
    expect((solidSchema as any).indexedFileTable).toBe(indexedFileTable)
    expect((solidSchema as any).agentStatusTable).toBe(agentStatusTable)
  })

  it('keeps xpod runtime fields in shared resources', () => {
    expectColumns(credentialResource, [
      'authMode',
      'apiKey',
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
      'oauthAccessToken',
      'oauthRefreshToken',
      'oauthExpiresAt',
      'projectId',
      'organizationId',
      'isDefault',
    ])

    expectColumns(aiProviderResource, ['defaultModel', 'proxyUrl'])
    expectColumns(aiConfigResource, ['embeddingModel', 'migrationStatus', 'migrationProgress'])
    expectColumns(vectorStoreResource, ['container', 'chunkingStrategy'])
    expectColumns(indexedFileResource, ['fileUrl', 'vectorId'])
    expectColumns(agentStatusResource, ['agent', 'lastActivityAt'])
  })

  it('exports credential auth mode and secret algorithm contracts', () => {
    expect(ProviderAuthMode).toEqual({
      oauth: 'oauth',
      deviceCode: 'deviceCode',
      console: 'console',
      apiKey: 'apiKey',
    })
    expect(CredentialSecretAlgorithm).toEqual({
      A256GCM: 'A256GCM',
    })
    expect(CredentialStorageMode).toEqual({
      plaintextV1: 'plaintext-v1',
      secretCellV1: 'secret-cell-v1',
    })
  })

  it('uses UDFS as the primary AI and credential storage contract', () => {
    expect(resourceConfigOf(credentialResource)).toMatchObject({ type: UDFS.Credential, namespace: UDFS })
    expect(resourceConfigOf(aiProviderResource)).toMatchObject({ type: UDFS.Provider, namespace: UDFS })
    expect(resourceConfigOf(aiModelResource)).toMatchObject({ type: UDFS.Model, namespace: UDFS })
    expect(resourceConfigOf(aiConfigResource)).toMatchObject({ type: UDFS.AIConfig, namespace: UDFS })
    expect(resourceConfigOf(vectorStoreResource)).toMatchObject({ type: UDFS.VectorStore, namespace: UDFS })
    expect(resourceConfigOf(indexedFileResource)).toMatchObject({ type: UDFS.IndexedFile, namespace: UDFS })
    expect(resourceConfigOf(agentStatusResource)).toMatchObject({ type: UDFS.AgentStatus, namespace: UDFS })

    expect(predicateOf(credentialResource, 'provider')).toBe(UDFS.provider)
    expect(predicateOf(credentialResource, 'authMode')).toBe(UDFS.authMode)
    expect(predicateOf(credentialResource, 'apiKey')).toBe(UDFS.apiKey)
    expect(predicateOf(credentialResource, 'storageMode')).toBe(UDFS.storageMode)
    expect(predicateOf(credentialResource, 'secretPayload')).toBe(UDFS.secretPayload)
    expect(predicateOf(credentialResource, 'encryptedSecret')).toBe(UDFS.encryptedSecret)
    expect(predicateOf(credentialResource, 'wrappedDataKey')).toBe(UDFS.wrappedDataKey)
    expect(predicateOf(credentialResource, 'encryptionAlgorithm')).toBe(UDFS.encryptionAlgorithm)
    expect(predicateOf(credentialResource, 'keyVersion')).toBe(UDFS.keyVersion)
    expect(predicateOf(credentialResource, 'scopes')).toBe(UDFS.scopes)
    expect(predicateOf(credentialResource, 'expiresAt')).toBe(UDFS.expiresAt)
    expect(predicateOf(credentialResource, 'accountLabel')).toBe(UDFS.accountLabel)
    expect(predicateOf(credentialResource, 'lastRefreshAt')).toBe(UDFS.lastRefreshAt)
    expect(predicateOf(credentialResource, 'reauthRequired')).toBe(UDFS.reauthRequired)
    expect(predicateOf(aiProviderResource, 'hasModel')).toBe(UDFS.hasModel)
    expect(predicateOf(aiModelResource, 'isProvidedBy')).toBe(UDFS.isProvidedBy)
    expect(predicateOf(aiConfigResource, 'embeddingModel')).toBe(UDFS.embeddingModel)
    expect(predicateOf(vectorStoreResource, 'chunkingStrategy')).toBe(UDFS.chunkingStrategy)
    expect(predicateOf(indexedFileResource, 'fileUrl')).toBe(UDFS.fileUrl)
    expect(predicateOf(agentStatusResource, 'agent')).toBe(UDFS.agent)
    expect(predicateOf(agentStatusResource, 'currentTask')).toBe(UDFS.task)
  })

  it('declares collection query endpoints for settings-backed resources', () => {
    expect((credentialResource as any).getSparqlEndpoint()).toBe('/settings/-/sparql')
    expect((aiProviderResource as any).getSparqlEndpoint()).toBe('/settings/providers/-/sparql')
    expect((aiModelResource as any).getSparqlEndpoint()).toBe('/settings/providers/-/sparql')
    expect((aiConfigResource as any).getSparqlEndpoint()).toBe('/settings/ai/-/sparql')
    expect((vectorStoreResource as any).getSparqlEndpoint()).toBe('/settings/ai/-/sparql')
    expect((indexedFileResource as any).getSparqlEndpoint()).toBe('/settings/ai/-/sparql')
    expect((agentStatusResource as any).getSparqlEndpoint()).toBe('/settings/ai/-/sparql')
  })
})
