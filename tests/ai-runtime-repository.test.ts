import { describe, expect, it } from 'vitest'
import {
  aiRuntimeRepository,
  buildAiRuntimeCredentialId,
  buildAiRuntimeCredentialIri,
  buildAiRuntimeCredentialTarget,
  credentialResource,
} from '../src'

describe('AI runtime credential repository helpers', () => {
  it('builds canonical provider credential ids and IRIs from the credential resource', () => {
    expect(buildAiRuntimeCredentialTarget({ deployment: 'cloud', provider: 'OpenAI' })).toEqual({
      id: 'cloud-openai',
    })
    expect(buildAiRuntimeCredentialId({ deployment: 'cloud', provider: 'OpenAI' }))
      .toBe('credentials.ttl#cloud-openai')
    expect(buildAiRuntimeCredentialIri('https://id.example/alice/profile/card#me', {
      deployment: 'cloud',
      provider: 'OpenAI',
    })).toBe('https://id.example/alice/settings/credentials.ttl#cloud-openai')
    expect(buildAiRuntimeCredentialIri('https://id.example/alice/', {
      deployment: 'local',
      provider: 'Kimi',
    })).toBe('https://id.example/alice/settings/credentials.ttl#local-kimi')
  })

  it('reads and upserts exact provider credentials through resource-owned ids', async () => {
    const rows = new Map<string, Record<string, unknown>>()
    const db = {
      findById: async (resource: unknown, id: string) => {
        expect(resource).toBe(credentialResource)
        return rows.get(id) ?? null
      },
      updateById: async (resource: unknown, id: string, patch: Record<string, unknown>) => {
        expect(resource).toBe(credentialResource)
        const current = rows.get(id)
        if (!current) return null
        const updated = { ...current, ...patch }
        rows.set(id, updated)
        return updated
      },
      insert: (resource: unknown) => {
        expect(resource).toBe(credentialResource)
        return {
          values: (value: Record<string, unknown>) => ({
            execute: async () => {
              rows.set(String(value.id), value)
              return [value]
            },
          }),
        }
      },
    }

    await expect(aiRuntimeRepository.getProviderCredential(db, {
      deployment: 'cloud',
      provider: 'OpenAI',
    })).resolves.toBeNull()

    await expect(aiRuntimeRepository.upsertProviderCredential(db, {
      deployment: 'cloud',
      provider: 'OpenAI',
      values: {
        service: 'ai',
        status: 'active',
        label: 'Alice OpenAI',
      },
    })).resolves.toMatchObject({
      id: 'credentials.ttl#cloud-openai',
      label: 'Alice OpenAI',
    })

    await expect(aiRuntimeRepository.upsertProviderCredential(db, {
      deployment: 'cloud',
      provider: 'OpenAI',
      values: {
        status: 'revoked',
      },
    })).resolves.toMatchObject({
      id: 'credentials.ttl#cloud-openai',
      label: 'Alice OpenAI',
      status: 'revoked',
    })

    expect(rows.get('credentials.ttl#cloud-openai')).toMatchObject({
      id: 'credentials.ttl#cloud-openai',
      provider: 'openai',
      service: 'ai',
    })
  })

  it('exposes one canonical IRI for encrypted-secret AAD roundtrips', () => {
    const credentialIri = aiRuntimeRepository.credentialIri('https://id.example/alice/profile/card#me', {
      deployment: 'cloud',
      provider: 'kimi',
    })

    expect(credentialIri).toBe('https://id.example/alice/settings/credentials.ttl#cloud-kimi')
    expect(credentialIri).toBe(buildAiRuntimeCredentialIri('https://id.example/alice/profile/card#me', {
      deployment: 'cloud',
      provider: 'kimi',
    }))
  })
})
