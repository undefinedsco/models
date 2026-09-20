import { describe, expect, it } from 'vitest'
import { drizzle } from '@undefineds.co/drizzle-solid'
import { credentialResource } from '../src/credential.schema'

describe('credential creation timestamp compatibility', () => {
  it('keeps a write default without requiring historical credentials to have a timestamp', () => {
    const options = credentialResource.createdAt.options
    expect(options.notNull).not.toBe(true)
    expect(options.required).not.toBe(true)
    expect(typeof options.defaultValue).toBe('function')
    const value = (options.defaultValue as () => Date)()
    expect(value).toBeInstanceOf(Date)
    expect(Number.isNaN(value.getTime())).toBe(false)
  })

  it('selects the additive timestamp with OPTIONAL so old credentials remain visible', () => {
    const database = drizzle({
      info: { isLoggedIn: true, webId: 'https://pod.example/profile/card#me' },
      fetch: async () => { throw new Error('This schema regression must not access the network') },
    }, {
      podUrl: 'https://pod.example/',
      schema: { credential: credentialResource },
      autoConnect: false,
      resourcePreparation: 'off',
    })
    const query = database.select().from(credentialResource).toSPARQL()
    const sparql = typeof query === 'string' ? query : query.query
    expect(sparql).toContain('PREFIX dc: <http://purl.org/dc/terms/>')
    expect(sparql).toMatch(/OPTIONAL\s*\{\s*\?subject\s+dc:created\s+\?createdAt/u)
  })
})
