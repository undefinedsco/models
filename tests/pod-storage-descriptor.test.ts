import { describe, expect, it } from 'vitest'
import {
  credentialDescriptor,
  createPodModelDescriptorRegistry,
  createPodSchema,
  createPodStorage,
  XPOD_CREDENTIAL,
} from '../src'

describe('pod storage descriptors', () => {
  it('describes the official credential model', () => {
    expect(credentialDescriptor.uri).toBe(XPOD_CREDENTIAL.Credential)
    expect(credentialDescriptor.storage.base).toBe('/settings/credentials.ttl')
    expect(credentialDescriptor.storage.resourceIdPattern).toBe('#{id}')
    expect(credentialDescriptor.storage.subjectTemplate).toBe('#{id}')
    expect(credentialDescriptor.uniqueBy).toEqual(['service', 'providerId', 'secretType'])
    expect(credentialDescriptor.fields.apiKey.secret).toBe(true)
  })

  it('lists local descriptors without natural-language matching', () => {
    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    expect(podSchema.list().map((descriptor) => descriptor.uri)).toEqual([XPOD_CREDENTIAL.Credential])
    expect(podSchema.describe({ uri: XPOD_CREDENTIAL.Credential })?.examples[0]).toEqual({
      request: '保存 Cloudflare tunnel token',
      match: {
        service: 'infra',
        providerId: 'cloudflare',
        secretType: 'tunnel-token',
      },
    })
  })

  it('queries RDF classes and field predicates deterministically', () => {
    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    expect(podSchema.classes({ uri: XPOD_CREDENTIAL.Credential })).toEqual([
      expect.objectContaining({
        schemaUri: XPOD_CREDENTIAL.Credential,
        resourceKind: 'credential',
        class: XPOD_CREDENTIAL.Credential,
      }),
    ])
    expect(podSchema.predicates({ uri: XPOD_CREDENTIAL.Credential, field: 'apiKey' })).toEqual([
      expect.objectContaining({
        schemaUri: XPOD_CREDENTIAL.Credential,
        field: 'apiKey',
        predicate: XPOD_CREDENTIAL.apiKey,
        secret: true,
      }),
    ])
  })

  it('validates and commits a descriptor-backed Cloudflare tunnel token plan', () => {
    const podStorage = createPodStorage()
    const validation = podStorage.validate({
      schemaUri: XPOD_CREDENTIAL.Credential,
      operation: 'upsert',
      match: {
        service: 'infra',
        providerId: 'cloudflare',
        secretType: 'tunnel-token',
      },
      set: {
        label: 'Cloudflare Tunnel Token',
        status: 'active',
      },
    })

    expect(validation.ok).toBe(true)
    if (!validation.ok) throw new Error(validation.error.message)
    expect(validation.plan.resourceId).toBe('#infra-cloudflare-tunnel-token')
    expect(validation.plan.resourceUri).toBe('/settings/credentials.ttl#infra-cloudflare-tunnel-token')

    const committed = podStorage.commit({ planId: validation.plan.id })
    expect(committed.ok).toBe(true)
    if (!committed.ok) throw new Error(committed.error.message)
    expect(committed.resource).toMatchObject({
      schemaUri: XPOD_CREDENTIAL.Credential,
      service: 'infra',
      providerId: 'cloudflare',
      secretType: 'tunnel-token',
      label: 'Cloudflare Tunnel Token',
      status: 'active',
      resourceId: '#infra-cloudflare-tunnel-token',
      resourceUri: '/settings/credentials.ttl#infra-cloudflare-tunnel-token',
    })
  })
})
