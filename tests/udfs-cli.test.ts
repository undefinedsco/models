import { execFile, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { UDFS } from '../src'

const execFileAsync = promisify(execFile)

describe('udfs cli', () => {
  it('describes pod schema descriptors', () => {
    const output = execFileSync(process.execPath, ['dist/bin/udfs.js', 'schema', 'describe', UDFS.Credential], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    const descriptor = JSON.parse(output)
    expect(descriptor.uri).toBe(UDFS.Credential)
    expect(descriptor.storage.base).toBe('/settings/credentials.ttl')
    expect(descriptor.storage.resourceIdPattern).toBe('#{id}')
  })

  it('searches schema descriptors by text', () => {
    const output = execFileSync(process.execPath, [
      'dist/bin/udfs.js',
      'schema',
      'search',
      '--query',
      'cloudflare tunnel token',
    ], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    const results = JSON.parse(output)
    expect(results[0]).toMatchObject({
      uri: UDFS.Credential,
      class: UDFS.Credential,
      resourceKind: 'credential',
    })
    expect(results[0].matchedFields).toContain('example')
  })

  it('queries schema classes and predicates', () => {
    const classesOutput = execFileSync(process.execPath, [
      'dist/bin/udfs.js',
      'schema',
      'classes',
      '--uri',
      UDFS.Credential,
    ], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    const classes = JSON.parse(classesOutput)
    expect(classes[0].class).toBe(UDFS.Credential)

    const predicatesOutput = execFileSync(process.execPath, [
      'dist/bin/udfs.js',
      'schema',
      'predicates',
      '--uri',
      UDFS.Credential,
      '--field',
      'apiKey',
    ], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    const predicates = JSON.parse(predicatesOutput)
    expect(predicates).toEqual([
      expect.objectContaining({
        schemaUri: UDFS.Credential,
        field: 'apiKey',
        predicate: UDFS.apiKey,
        secret: true,
      }),
    ])
  })

  it('validates descriptor-backed storage mutations without committing', () => {
    const output = execFileSync(process.execPath, [
      'dist/bin/udfs.js',
      'storage',
      'validate',
      '--input',
      JSON.stringify({
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
      }),
    ], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    const result = JSON.parse(output)
    expect(result.ok).toBe(true)
    expect(result.plan.resourceId).toBe('#infra-cloudflare-tunnel-token')
    expect(result.plan.resourceUri).toBe('/settings/credentials.ttl#infra-cloudflare-tunnel-token')
  })

  it('runs the bundled consensus path from JSON input without API credentials', () => {
    const output = execFileSync(process.execPath, [
      'dist/bin/udfs.js',
      'consensus',
      '--input',
      JSON.stringify({
        session_id: 'sess_local_test',
        request: '我要保存这个 Cloudflare token',
        answers: {
          token_type: 'tunnel-token',
        },
      }),
      '--json',
    ], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    })
    const result = JSON.parse(output)
    expect(result.session_id).toBe('sess_local_test')
    expect(result.first.status).toBe('needs_clarification')
    expect(result.resolved.schemaUri).toBe(UDFS.Credential)
    expect(result.consensusRuntime).toEqual({
      mode: 'local-fallback',
      auth: 'none',
    })
    expect(result.descriptor.storage.base).toBe('/settings/credentials.ttl')
    expect(result.descriptor.storage.resourceIdPattern).toBe('#{id}')
    expect(result.validation).toBeUndefined()
    expect(result.committed).toBeUndefined()
  })

  it('uses injected remote consensus runtime without command-line keys', async () => {
    const requests: Array<{
      url?: string
      authorization?: string
      body: unknown
    }> = []
    const server = createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      req.on('end', () => {
        requests.push({
          url: req.url,
          authorization: req.headers.authorization,
          body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
        })
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({
          id: 'resp_test',
          conversation: { id: 'conv_test' },
          output: [
            {
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'output_text',
                  text: JSON.stringify({
                    status: 'resolved',
                    schemaUri: UDFS.Credential,
                    fieldMapping: {
                      service: 'infra',
                      providerId: 'cloudflare',
                      secretType: 'api-token',
                      label: 'Cloudflare API Token',
                      status: 'active',
                    },
                    confidence: 0.94,
                  }),
                },
              ],
            },
          ],
        }))
      })
    })

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    try {
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Missing test server address')
      const baseUrl = `http://127.0.0.1:${address.port}/v1`
      const { stdout } = await execFileAsync(process.execPath, [
        'dist/bin/udfs.js',
        'consensus',
        '--input',
        JSON.stringify({
          session_id: 'sess_remote_test',
          conversation_id: 'conv_existing',
          request: '我要保存这个 Cloudflare token',
          answers: {
            token_type: 'tunnel-token',
          },
        }),
        '--json',
      ], {
        cwd: new URL('..', import.meta.url),
        env: {
          ...process.env,
          UDFS_CONSENSUS_BASE_URL: baseUrl,
          UDFS_CONSENSUS_TOKEN: 'runtime-token',
        },
      })
      const result = JSON.parse(stdout)
      expect(requests).toHaveLength(1)
      expect(requests[0].url).toBe('/v1/responses')
      expect(requests[0].authorization).toBe('Bearer runtime-token')
      expect(requests[0].body).toMatchObject({
        conversation: 'conv_existing',
        metadata: {
          product: 'linx',
          purpose: 'pod-storage',
          session_id: 'sess_remote_test',
        },
      })
      expect(result.session_id).toBe('sess_remote_test')
      expect(result.consensusRuntime).toEqual({
        mode: 'remote',
        baseUrl,
        auth: 'runtime-token',
      })
      expect(result.consensusResponse.conversationId).toBe('conv_test')
      expect(result.resolved.fieldMapping.secretType).toBe('api-token')
      expect(result.descriptor.storage.base).toBe('/settings/credentials.ttl')
      expect(result.validation).toBeUndefined()
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
      })
    }
  })
})
