import { describe, expect, it } from 'vitest'
import {
  agentStatusResource,
  agentStatusTable,
  aiConfigResource,
  aiConfigTable,
  aiModelResource,
  aiModelTable,
  chatModelResource,
  embeddingModelResource,
  aiProviderResource,
  aiProviderTable,
  apiKeyCredentialResource,
  apiKeyCredentialTable,
  CredentialSecretAlgorithm,
  CredentialStorageMode,
  DCTerms,
  credentialResource,
  credentialTable,
  indexedFileResource,
  indexedFileTable,
  oauthCredentialResource,
  oauthCredentialTable,
  ProviderAuthMode,
  RDF,
  ReaderMaterializationVocab,
  SIOC,
  solidResources,
  solidSchema,
  UDFS,
  vectorStoreResource,
  vectorStoreTable,
} from '../src'
import {
  READER_MATERIALIZATION_NOTE_KIND,
  READER_MATERIALIZATION_STATUSES,
} from '../src/reader-materialization'

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
    expect((solidResources as any).chatModelResource).toBe(chatModelResource)
    expect((solidResources as any).embeddingModelResource).toBe(embeddingModelResource)
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

  it('keeps only cross-product intent in the shared AIConfig resource', () => {
    expectColumns(credentialResource, [
      'authMode',
      'offeringId',
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
      'createdAt',
      'clientCredentialId',
      'appliedTo',
      'appliedOn',
      'appliedAt',
      'metadata',
    ])

    expectColumns(aiProviderResource, ['defaultModel', 'proxyUrl'])
    expect((columnsOf(aiProviderResource).hasModel as any).dataType).toBe('array')
    expect((columnsOf(aiProviderResource).hasModel as any).options?.isArray).toBe(true)
    expectColumns(aiConfigResource, [
      'chatModel',
      'ocrModel',
      'readerModel',
      'embeddingModel',
      'indexerModel',
      'rerankerModel',
      'ocrEnabled',
      'automaticOcr',
      'imageRecognition',
      'pdfRecognition',
      'tableRecognition',
      'processingMode',
      'readerPolicy',
      'readerPriority',
      'maxFileSizeMb',
      'maxPages',
    ])
    expect(Object.keys(columnsOf(aiConfigResource))).not.toContain('ocrFallbackOrder')
    expect(Object.keys(columnsOf(aiConfigResource))).not.toContain('failureFallback')
    expect(Object.keys(columnsOf(aiConfigResource))).not.toEqual(expect.arrayContaining([
      'ftsEnabled',
      'vectorEnabled',
      'progressiveIndexingEnabled',
      'automaticIndexing',
      'textBackend',
      'vectorBackend',
      'previousModel',
      'migrationStatus',
      'migrationProgress',
    ]))
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

  it('keeps legacy API-key credentials queryable when authMode is absent', () => {
    const authMode = columnsOf(credentialResource).authMode as {
      options?: { defaultValue?: unknown; required?: boolean }
    }

    expect(authMode.options?.required).not.toBe(true)
    expect(authMode.options?.defaultValue).toBe(ProviderAuthMode.apiKey)
  })

  it('names a credential offering with a documented string id, not a link or enum', () => {
    const offeringId = columnsOf(credentialResource).offeringId as {
      dataType?: string
      options?: { linkTableName?: unknown; defaultValue?: unknown }
    }

    // Offering ids are catalog content (`@undefineds.co/ai-connections`), and the
    // catalog grows without a models release, so the schema keeps this a free
    // string: every published id (`api-platform`, `official-subscription`,
    // `subscription-key`, `token-plan`, `local`, …) is nameable. A relation would
    // need an offering resource in the Pod to point at, and there is none.
    expect(offeringId.dataType).toBe('string')
    expect(offeringId.options?.linkTableName).toBeUndefined()
    // Credentials written before the attribute existed must stay queryable
    // without it, exactly like `authMode`.
    expect(offeringId.options?.defaultValue).toBeUndefined()
  })

  it('keeps the adapter-local credential metadata bag declared as UDFS JSON', () => {
    const metadata = columnsOf(credentialResource).metadata as {
      dataType?: string
      options?: { linkTableName?: unknown }
    }

    // drizzle-solid drops writes to columns the schema does not declare, so an
    // undeclared `metadata` discards every credential `metadata.*` write the
    // applet and the gateway make and reads them back as undefined. Asserting
    // the declaration here keeps that regression from passing silently again.
    expect(metadata).toBeDefined()
    expect(metadata.dataType).toBe('json')
    expect(metadata.options?.linkTableName).toBeUndefined()
    expect(predicateOf(credentialResource, 'metadata')).toBe(UDFS.metadata)
  })

  it('uses UDFS as the primary AI and credential storage contract', () => {
    expect(resourceConfigOf(credentialResource)).toMatchObject({ type: UDFS.Credential, namespace: UDFS })
    expect(resourceConfigOf(aiProviderResource)).toMatchObject({ type: UDFS.Provider, namespace: UDFS })
    expect(resourceConfigOf(aiModelResource)).toMatchObject({ type: UDFS.AIModel, namespace: UDFS })
    expect(resourceConfigOf(aiConfigResource)).toMatchObject({ type: UDFS.AIConfig, namespace: UDFS })
    expect(resourceConfigOf(vectorStoreResource)).toMatchObject({ type: UDFS.VectorStore, namespace: UDFS })
    expect(resourceConfigOf(indexedFileResource)).toMatchObject({ type: UDFS.IndexedFile, namespace: UDFS })
    expect(resourceConfigOf(agentStatusResource)).toMatchObject({ type: UDFS.AgentStatus, namespace: UDFS })

    expect(predicateOf(credentialResource, 'provider')).toBe(UDFS.provider)
    expect(predicateOf(credentialResource, 'authMode')).toBe(UDFS.authMode)
    expect(predicateOf(credentialResource, 'offeringId')).toBe(UDFS.offeringId)
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
    expect(predicateOf(credentialResource, 'createdAt')).toBe(DCTerms.created)
    expect(predicateOf(credentialResource, 'clientCredentialId')).toBe(UDFS.clientCredentialId)
    expect(predicateOf(credentialResource, 'appliedTo')).toBe(UDFS.appliedTo)
    expect(predicateOf(credentialResource, 'appliedOn')).toBe(UDFS.appliedOn)
    expect(predicateOf(credentialResource, 'appliedAt')).toBe(UDFS.appliedAt)
    expect(predicateOf(credentialResource, 'metadata')).toBe(UDFS.metadata)
    expect(predicateOf(aiProviderResource, 'hasModel')).toBe(UDFS.hasModel)
    expect(predicateOf(aiProviderResource, 'apiKeyUrl')).toBe(UDFS.apiKeyUrl)
    expect(predicateOf(aiProviderResource, 'connectMode')).toBe(UDFS.connectMode)
    expect(predicateOf(aiProviderResource, 'capabilities')).toBe(UDFS.capability)
    expect(predicateOf(aiProviderResource, 'homepage')).toBe(UDFS.homepage)
    expect(predicateOf(aiModelResource, 'isProvidedBy')).toBe(UDFS.isProvidedBy)
    expect(predicateOf(aiModelResource, 'inputModalities')).toBe(UDFS.inputModality)
    expect(predicateOf(aiModelResource, 'runtimeCapabilities')).toBe(UDFS.capability)
    expect(predicateOf(aiModelResource, 'outputModalities')).toBe(UDFS.outputModality)
    expect(predicateOf(aiModelResource, 'capabilities')).toBe(UDFS.hasCapability)
    expect(predicateOf(chatModelResource, 'contextLength')).toBe(UDFS.contextLength)
    expect(predicateOf(chatModelResource, 'maxOutputTokens')).toBe(UDFS.maxOutputTokens)
    expect(predicateOf(embeddingModelResource, 'dimension')).toBe(UDFS.dimension)
    expect(predicateOf(aiModelResource, 'pricingInput')).toBe(UDFS.pricingInput)
    expect(predicateOf(aiModelResource, 'pricingOutput')).toBe(UDFS.pricingOutput)
    expect(predicateOf(aiConfigResource, 'embeddingModel')).toBe(UDFS.embeddingModel)
    expect(predicateOf(aiConfigResource, 'ocrModel')).toBe(UDFS.ocrModel)
    expect(predicateOf(aiConfigResource, 'indexerModel')).toBe(UDFS.indexerModel)
    expect(predicateOf(aiConfigResource, 'ocrEnabled')).toBe(UDFS.ocrEnabled)
    expect(predicateOf(aiConfigResource, 'processingMode')).toBe(UDFS.processingMode)
    expect(predicateOf(vectorStoreResource, 'chunkingStrategy')).toBe(UDFS.chunkingStrategy)
    expect(predicateOf(indexedFileResource, 'fileUrl')).toBe(UDFS.fileUrl)
    expect(predicateOf(agentStatusResource, 'agent')).toBe(UDFS.agent)
    expect(predicateOf(agentStatusResource, 'currentTask')).toBe(UDFS.task)
  })

  it('exports one durable Reader Note vocabulary without reconciliation states', () => {
    expect(READER_MATERIALIZATION_STATUSES).toEqual(['complete', 'stale'])
    expect(ReaderMaterializationVocab).toEqual({
      type: RDF.type,
      noteType: UDFS.Note,
      about: SIOC.about,
      noteKind: UDFS.noteKind,
      sourceKey: UDFS.sourceKey,
      fingerprint: UDFS.fingerprint,
      readerEngine: UDFS.readerEngine,
      readerVersion: UDFS.readerVersion,
      generatedWithModel: UDFS.generatedWithModel,
      sourceHash: UDFS.sourceHash,
      readerOptionsHash: UDFS.readerOptionsHash,
      representationHash: UDFS.representationHash,
      representationMediaType: UDFS.representationMediaType,
      coverageUnit: UDFS.coverageUnit,
      coveredRange: UDFS.coveredRange,
      readUnits: UDFS.readUnits,
      totalUnits: UDFS.totalUnits,
      status: UDFS.status,
    })
  })

  it('exports the shared Reader materialization Note vocabulary', () => {
    expect(READER_MATERIALIZATION_NOTE_KIND).toBe('reader-materialization')
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
