import { describe, expect, it } from 'vitest'
import {
  credentialDescriptor,
  createPodModelDescriptorRegistry,
  createPodSchema,
  createPodStorage,
  UDFS,
} from '../src'

describe('pod storage descriptors', () => {
  it('describes the official credential model', () => {
    expect(credentialDescriptor.uri).toBe(UDFS.Credential)
    expect(credentialDescriptor.storage.base).toBe('/settings/credentials.ttl')
    expect(credentialDescriptor.storage.resourceIdPattern).toBe('#{id}')
    expect(credentialDescriptor.uniqueBy).toEqual(['service', 'providerId', 'secretType'])
    expect(credentialDescriptor.fields.apiKey.secret).toBe(true)
  })

  it('lists local descriptors without natural-language matching', () => {
    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    expect(podSchema.list().map((descriptor) => descriptor.uri)).toEqual([UDFS.Credential])
    expect(podSchema.describe({ uri: UDFS.Credential })?.examples[0]).toEqual({
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
    expect(podSchema.classes({ uri: UDFS.Credential })).toEqual([
      expect.objectContaining({
        schemaUri: UDFS.Credential,
        resourceKind: 'credential',
        class: UDFS.Credential,
      }),
    ])
    expect(podSchema.predicates({ uri: UDFS.Credential, field: 'apiKey' })).toEqual([
      expect.objectContaining({
        schemaUri: UDFS.Credential,
        field: 'apiKey',
        predicate: UDFS.apiKey,
        secret: true,
      }),
    ])
  })

  it('validates and commits a descriptor-backed Cloudflare tunnel token plan', () => {
    const podStorage = createPodStorage()
    const validation = podStorage.validate({
      schemaUri: UDFS.Credential,
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
      schemaUri: UDFS.Credential,
      service: 'infra',
      providerId: 'cloudflare',
      secretType: 'tunnel-token',
      label: 'Cloudflare Tunnel Token',
      status: 'active',
      resourceId: '#infra-cloudflare-tunnel-token',
      resourceUri: '/settings/credentials.ttl#infra-cloudflare-tunnel-token',
    })
  })

  it('uses UDFS predicates as the primary credential contract', () => {
    expect(credentialDescriptor.uri).toBe(UDFS.Credential)
    expect(credentialDescriptor.fields.apiKey.predicate).toBe(UDFS.apiKey)
  })
})
