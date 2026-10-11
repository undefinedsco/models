import { describe, expect, it } from 'vitest'
import { drizzle } from '@undefineds.co/drizzle-solid'
import { credentialResource } from '../src/credential.schema'
import { credentialDescriptor } from '../src/pod-storage-descriptor'

describe('credential runtime failure facts', () => {
  it('keeps existing credentials readable when failure facts have never been recorded', () => {
    const database = drizzle({
      info: { isLoggedIn: true, webId: 'https://pod.example/profile/card#me' },
      fetch: async () => { throw new Error('Unexpected network access') },
    }, { podUrl: 'https://pod.example/', schema: { credential: credentialResource }, autoConnect: false, resourcePreparation: 'off' })
    const query = database.select().from(credentialResource).toSPARQL()
    const sparql = typeof query === 'string' ? query : query.query
    expect(sparql).toMatch(/OPTIONAL\s*\{\s*\?subject\s+<https:\/\/undefineds\.co\/ns#lastFailureCode>\s+\?lastFailureCode/u)
    expect(sparql).toMatch(/OPTIONAL\s*\{\s*\?subject\s+<https:\/\/undefineds\.co\/ns#lastFailureAt>\s+\?lastFailureAt/u)
    expect(JSON.stringify(credentialDescriptor)).toContain('lastFailureCode')
    expect(JSON.stringify(credentialDescriptor)).toContain('lastFailureAt')
  })
})
