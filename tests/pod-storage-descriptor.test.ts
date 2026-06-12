import { describe, expect, it } from 'vitest'
import {
  approvalDescriptor,
  credentialDescriptor,
  createPodModelDescriptorRegistry,
  createPodSchema,
  createPodStorage,
  inputRequestDescriptor,
  officialPodModelDescriptors,
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
    expect(podSchema.list().map((descriptor) => descriptor.uri)).toEqual(
      officialPodModelDescriptors.map((descriptor) => descriptor.uri),
    )
    expect(podSchema.describe({ uri: UDFS.Credential })?.examples[0]).toEqual({
      request: '保存 Cloudflare tunnel token',
      match: {
        service: 'infra',
        providerId: 'cloudflare',
        secretType: 'tunnel-token',
      },
    })
  })


  it('describes approval requests as claimable control resources', () => {
    expect(approvalDescriptor.uri).toBe(UDFS.ApprovalRequest)
    expect(approvalDescriptor.storage.base).toBe('/.data/approvals/')
    expect(approvalDescriptor.storage.resourceIdPattern).toBe('{id}')
    expect(approvalDescriptor.fields.status.predicate).toBe(UDFS.status)
    expect(approvalDescriptor.fields.leaseOwner.predicate).toBe(UDFS.leaseOwner)
    expect(approvalDescriptor.fields.leaseExpiresAt.predicate).toBe(UDFS.leaseExpiresAt)
    expect(approvalDescriptor.writableFields).toContain('leaseOwner')
    expect(approvalDescriptor.writableFields).toContain('leaseExpiresAt')
  })

  it('describes input requests separately from approval requests', () => {
    expect(inputRequestDescriptor.uri).toBe(UDFS.InputRequest)
    expect(inputRequestDescriptor.storage.base).toBe('/.data/input-requests/')
    expect(inputRequestDescriptor.fields.prompt.required).toBe(true)
    expect(inputRequestDescriptor.fields.response.predicate).toBe(UDFS.response)
    expect(inputRequestDescriptor.fields.leaseOwner.predicate).toBe(UDFS.leaseOwner)

    const podSchema = createPodSchema(createPodModelDescriptorRegistry())
    const descriptor = podSchema.describe({ uri: UDFS.InputRequest })
    expect(descriptor?.resourceKind).toBe('input-request')
  })

  it('keeps approval descriptor storage in exact-id mode', () => {
    expect(approvalDescriptor.storage).toEqual({
      base: '/.data/approvals/',
      resourceIdPattern: '{id}',
    })
    expect(inputRequestDescriptor.storage).toEqual({
      base: '/.data/input-requests/',
      resourceIdPattern: '{id}',
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
