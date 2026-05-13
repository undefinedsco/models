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
  credentialResource,
  credentialTable,
  indexedFileResource,
  indexedFileTable,
  oauthCredentialResource,
  oauthCredentialTable,
  solidResources,
  solidSchema,
  vectorStoreResource,
  vectorStoreTable,
} from '../src'

function columnsOf(resource: unknown): Record<string, unknown> {
  return ((resource as any)?._?.columns ?? (resource as any)?.columns) as Record<string, unknown>
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
    expect(columnsOf(credentialResource)).toMatchObject({
      apiKey: expect.anything(),
      oauthAccessToken: expect.anything(),
      oauthRefreshToken: expect.anything(),
      oauthExpiresAt: expect.anything(),
      projectId: expect.anything(),
      organizationId: expect.anything(),
      isDefault: expect.anything(),
    })

    expect(columnsOf(aiProviderResource)).toMatchObject({
      defaultModel: expect.anything(),
      proxyUrl: expect.anything(),
    })

    expect(columnsOf(aiConfigResource)).toMatchObject({
      embeddingModel: expect.anything(),
      migrationStatus: expect.anything(),
      migrationProgress: expect.anything(),
    })

    expect(columnsOf(vectorStoreResource)).toMatchObject({
      container: expect.anything(),
      chunkingStrategy: expect.anything(),
    })

    expect(columnsOf(indexedFileResource)).toMatchObject({
      fileUrl: expect.anything(),
      vectorId: expect.anything(),
    })

    expect(columnsOf(agentStatusResource)).toMatchObject({
      agentId: expect.anything(),
      lastActivityAt: expect.anything(),
    })
  })
})
