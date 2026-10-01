import { createServer, type ServerResponse } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Parser } from 'n3'
import { decideApprovalRequest } from '../src/approval.repository'
import { UDFS } from '../src/namespaces'

const iri = 'https://pod.example/.data/approvals/day.ttl#request'
const document = (subject = iri, extra = '') => `
<${subject}> a <${UDFS.ApprovalRequest}>;
  <${UDFS.status}> "pending"; <${UDFS.toolName}> "read" .
<${subject.replace('#request', '#other')}> <https://example/preserve> "other subject" .
${extra}`
const initial = document()
const readResponse = (body = initial, etag = '"v1"') => new Response(body, { headers: { etag, 'content-type': 'text/turtle' } })
const webId = 'https://pod.example/profile/card#me'
afterEach(() => vi.restoreAllMocks())

describe('versioned approval decision', () => {
  it('retains other subjects and unknown triples and uses one strong conditional PUT', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(readResponse()).mockResolvedValueOnce(new Response(null, { status: 204 }))
    expect(await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'approved', authenticatedFetch: fetcher })).toEqual({ status: 'decided' })
    const [url, init] = fetcher.mock.calls[1]
    expect(url).toBe(iri.split('#')[0])
    expect(init.headers['if-match']).toBe('"v1"')
    const triples = new Parser().parse(init.body)
    expect(triples.some(quad => quad.object.value === 'other subject')).toBe(true)
    expect(triples.some(quad => quad.subject.value === iri && quad.predicate.value === UDFS.toolName && quad.object.value === 'read')).toBe(true)
    expect(triples.filter(quad => quad.subject.value === iri && quad.predicate.value === UDFS.status).map(quad => quad.object.value)).toEqual(['approved'])
  })
  it.each(['', 'W/"v1"'])('fails closed without a strong ETag (%s)', async etag => {
    const fetcher = vi.fn().mockResolvedValue(readResponse(initial, etag))
    expect((await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'approved', authenticatedFetch: fetcher })).status).toBe('unavailable')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('does not retry a lost conditional write', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(readResponse()).mockResolvedValueOnce(new Response(null, { status: 412 }))
    expect((await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'rejected', authenticatedFetch: fetcher })).status).toBe('conflict')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('refuses terminal, expired, leased, wrong-owner and switched-session decisions', async () => {
    for (const body of [initial.replace('"pending"', '"approved"'), document(iri, `<${iri}> <${UDFS.expiresAt}> "2000-01-01T00:00:00Z".`), document(iri, `<${iri}> <${UDFS.assignedTo}> <https://someone.else/me>.`), document(iri, `<${iri}> <${UDFS.leaseOwner}> "other"; <${UDFS.leaseExpiresAt}> "2999-01-01T00:00:00Z".`)]) {
      const fetcher = vi.fn().mockResolvedValue(readResponse(body))
      expect((await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'approved', authenticatedFetch: fetcher })).status).not.toBe('decided')
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
    const fetcher = vi.fn().mockResolvedValue(readResponse())
    expect((await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'approved', authenticatedFetch: fetcher, isCurrent: () => false })).status).toBe('not_actionable')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('two independent HTTP clients cannot replace the winning terminal decision', async () => {
    let body = ''
    let version = 1
    let writes = 0
    const waiting: ServerResponse[] = []
    const server = createServer(async (request, response) => {
      if (request.method === 'GET') {
        waiting.push(response)
        if (waiting.length === 2) waiting.forEach(res => { res.writeHead(200, { etag: '"v1"', 'content-type': 'text/turtle' }); res.end(body) })
        return
      }
      writes++
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      // Models the server's resource lock: check and replace occur together.
      if (request.headers['if-match'] !== `"v${version}"`) { response.writeHead(412); response.end(); return }
      body = Buffer.concat(chunks).toString()
      version++
      response.writeHead(204); response.end()
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address() as { port: number }
    const approval = `http://127.0.0.1:${address.port}/approvals.ttl#request`
    body = document(approval)
    try {
      const results = await Promise.all([
        decideApprovalRequest({ approval, decisionBy: webId, decision: 'approved', authenticatedFetch: fetch }),
        decideApprovalRequest({ approval, decisionBy: webId, decision: 'rejected', authenticatedFetch: fetch }),
      ])
      expect(results.map(result => result.status).sort()).toEqual(['conflict', 'decided'])
      expect(writes).toBe(2)
      const triples = new Parser().parse(body)
      const status = triples.filter(quad => quad.subject.value === approval && quad.predicate.value === UDFS.status)
      expect(status).toHaveLength(1)
      expect(status[0].object.value).toBe(results[0].status === 'decided' ? 'approved' : 'rejected')
    } finally {
      server.closeAllConnections()
      await new Promise<void>(resolve => server.close(() => resolve()))
    }
  })
  it.each([
    `<${iri}> <${UDFS.leaseOwner}> "worker".`,
    `<${iri}> <${UDFS.leaseExpiresAt}> "2000-01-01T00:00:00Z".`,
    `<${iri}> <${UDFS.leaseOwner}> "worker"; <${UDFS.leaseExpiresAt}> <https://example/invalid>.`,
  ])('fails closed for incomplete or malformed lease facts', async extra => {
    const fetcher = vi.fn().mockResolvedValue(readResponse(document(iri, extra)))
    expect((await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'approved', authenticatedFetch: fetcher })).status).toBe('conflict')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('allows a complete expired lease to be superseded by a decision', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(readResponse(document(iri, `<${iri}> <${UDFS.leaseOwner}> "worker"; <${UDFS.leaseExpiresAt}> "2000-01-01T00:00:00Z".`))).mockResolvedValueOnce(new Response(null, { status: 204 }))
    expect((await decideApprovalRequest({ approval: iri, decisionBy: webId, decision: 'approved', authenticatedFetch: fetcher })).status).toBe('decided')
  })
})
