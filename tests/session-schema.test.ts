import { describe, expect, it } from 'vitest'
import {
  extractSessionIdFromSessionRef,
  sessionResource,
  solidResources,
  solidSchema,
  sessionTable,
} from '../src'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('session schema', () => {
  it('registers a real session resource with a compatibility schema alias', () => {
    expect(sessionTable).toBeDefined()
    expect((solidSchema as any).sessionTable).toBe(sessionTable)
    expect(sessionResource).toBe(sessionTable)
    expect((solidResources as any).sessionResource).toBe(sessionResource)
    expect((solidResources as any).sessionTable).toBeUndefined()
  })

  it('uses Pod-backed session fields instead of a stub contract', () => {
    const columns = (sessionTable as any)?._
      ?.columns ?? (sessionTable as any)?.columns

    expect(columns).toBeDefined()
    expect(columns.id).toBeDefined()
    expect(columns.owner).toBeDefined()
    expect(columns.chat).toBeDefined()
    expect(columns.thread).toBeDefined()
    expect(columns.chatId).toBeUndefined()
    expect(columns.threadId).toBeUndefined()
    expect(columns.sessionType).toBeUndefined()
    expect(columns.status).toBeDefined()
    expect(columns.tool).toBeDefined()
    expect(columns.tokenUsage).toBeDefined()
    expect(columns.messages).toBeDefined()
    expect(columns.messageResources).toBeUndefined()
    expect(columns.metadata).toBeDefined()
  })

  it('keeps the Pod storage contract explicit in source', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/session/session.schema.ts'),
      'utf8',
    )

    expect(source).toContain("base: '/.data/sessions/'")
    expect(source).toContain("sparqlEndpoint: '/.data/sessions/-/sparql'")
    expect(source).toContain("id: id('id').default('{yyyy}/{MM}/{dd}/{key}.ttl')")
  })

  it('builds base-relative session resource ids from session id and timestamp', () => {
    const resourceId = sessionResource.buildId({
      id: '019df111-0000-7000-8000-000000000001',
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
    })
    expect(resourceId).toBe('2026/04/01/019df111-0000-7000-8000-000000000001.ttl')
    expect(sessionResource.resolveUri(resourceId)).toBe('/.data/sessions/2026/04/01/019df111-0000-7000-8000-000000000001.ttl')
  })

  it('extracts session ids from current document resources and legacy fragments', () => {
    expect(extractSessionIdFromSessionRef(
      'https://id.example/.data/sessions/2026/04/01/019df111-0000-7000-8000-000000000001.ttl',
    )).toBe('019df111-0000-7000-8000-000000000001')
    expect(extractSessionIdFromSessionRef(
      'https://id.example/.data/sessions/2026/04.ttl#019df111-0000-7000-8000-000000000001',
    )).toBe('019df111-0000-7000-8000-000000000001')
  })
})
