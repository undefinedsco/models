import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  aiProviderDescriptor,
  chatDescriptor,
  credentialDescriptor,
  type PodModelDescriptor,
  type PodModelFieldDescriptor,
} from '../src'

/**
 * Type-level contract for descriptor derivation.
 *
 * These assertions are the reason `definePodModelDescriptor` exists: if a
 * descriptor goes back to being annotated with `PodModelDescriptor`, `fields`
 * erases into `Record<string, PodModelFieldDescriptor>` and every assertion
 * below stops compiling. The file is checked twice:
 *
 * - `bun run test:types` (`tsc -p tsconfig.types.json`, also part of
 *   `bun run test:ci`) evaluates the `Expect<...>` aliases and the
 *   `@ts-expect-error` negatives;
 * - `bun run test` runs the runtime half under vitest.
 */

/** `true` only when both types are identical. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
/** `true` only when `T` is a literal union rather than a widened `string`. */
type IsNotWidened<T> = string extends T ? false : true
type Expect<T extends true> = T

/** Row derivation a consumer writes over a descriptor (Xpod's `RowOf<D>`). */
type PodFieldValue<F extends PodModelFieldDescriptor> =
  F extends { array: true } ? PodFieldValue<Omit<F, 'array'>>[]
  : F extends { type: 'number' } ? number
  : F extends { type: 'boolean' } ? boolean
  : F extends { type: 'timestamp' } ? Date
  : F extends { type: 'json' } ? unknown
  : F extends { type: 'string' | 'text' | 'uri' } ? string
  : unknown
type RowOf<D extends PodModelDescriptor> =
  { [K in keyof D['fields']]: PodFieldValue<D['fields'][K]> } & { id: string }

// --- the field map keeps its literal keys --------------------------------

type CredentialField = keyof typeof credentialDescriptor.fields
type _FieldNamesAreNotWidened = Expect<IsNotWidened<CredentialField>>
type _ProviderIsAField = Expect<Equal<'provider' extends CredentialField ? true : false, true>>
type _ProviderFieldUnion = Expect<Equal<
  keyof typeof aiProviderDescriptor.fields,
  | 'id'
  | 'displayName'
  | 'baseUrl'
  | 'proxyUrl'
  | 'homepage'
  | 'apiKeyUrl'
  | 'connectMode'
  | 'hasModel'
  | 'defaultModel'
  | 'supportsBackend'
  | 'capabilities'
  | 'rotationPolicy'
>>

// The 0.2.57 rename that shipped a silent `undefined` in consumers:
// `credentialDescriptor.fields.providerId` must not compile.
// @ts-expect-error `providerId` is not a credential field; `provider` is.
type _RetiredProviderId = typeof credentialDescriptor.fields.providerId

// --- per-field types and flags stay literal ------------------------------

type _ProviderType = Expect<Equal<typeof credentialDescriptor.fields.provider.type, 'uri'>>
type _ExpiresAtType = Expect<Equal<typeof credentialDescriptor.fields.expiresAt.type, 'timestamp'>>
type _ApiKeyIsSecret = Expect<Equal<typeof credentialDescriptor.fields.apiKey.secret, true>>
type _ScopesIsArray = Expect<Equal<typeof credentialDescriptor.fields.scopes.array, true>>
type _HasModelIsArray = Expect<Equal<typeof aiProviderDescriptor.fields.hasModel.array, true>>
type _OfferingIdType = Expect<Equal<typeof credentialDescriptor.fields.offeringId.type, 'string'>>
// Undeclared flags stay absent, so `F extends { array: true }` stays decidable.
type _ScopesHasNoSecret = Expect<Equal<
  'secret' extends keyof typeof credentialDescriptor.fields.scopes ? true : false,
  false
>>
type _IdHasNoArray = Expect<Equal<
  'array' extends keyof typeof aiProviderDescriptor.fields.id ? true : false,
  false
>>

// --- the relation member is present and typed ----------------------------

type ProviderReference = NonNullable<typeof credentialDescriptor.fields.provider.references>
type _RelationIsPresent = Expect<Equal<
  'references' extends keyof typeof credentialDescriptor.fields.provider ? true : false,
  true
>>
type _RelationResource = Expect<Equal<ProviderReference['resource'], 'provider'>>
type _RelationKey = Expect<Equal<ProviderReference['key'], 'id'>>
type _RelationResourceIsNotWidened = Expect<IsNotWidened<ProviderReference['resource']>>
type _ContactRelationResource = Expect<Equal<
  NonNullable<typeof chatDescriptor.fields.contact.references>['resource'],
  'contact'
>>
// `offeringId` is a plain attribute on purpose: no invented relation.
type _OfferingIdHasNoRelation = Expect<Equal<
  'references' extends keyof typeof credentialDescriptor.fields.offeringId ? true : false,
  false
>>

// --- rows derived from the descriptor stay exact -------------------------

type CredentialRow = RowOf<typeof credentialDescriptor>
type _RowKeysAreNotWidened = Expect<IsNotWidened<keyof CredentialRow>>
type _RowProviderIsString = Expect<Equal<CredentialRow['provider'], string>>
type _RowExpiresAtIsDate = Expect<Equal<CredentialRow['expiresAt'], Date>>
type _RowScopesIsStringArray = Expect<Equal<CredentialRow['scopes'], string[]>>
type _RowSecretIsStillReadable = Expect<Equal<CredentialRow['apiKey'], string>>
// @ts-expect-error the index signature is gone: a retired field name is not a row key.
type _RowHasNoProviderId = CredentialRow['providerId']

// The literal-preserving helper must not weaken the published contract.
const descriptorContract: PodModelDescriptor = credentialDescriptor
const fieldContract: PodModelFieldDescriptor = credentialDescriptor.fields.provider

describe('pod storage descriptor type surface', () => {
  it('keeps the public descriptor contract at runtime', () => {
    expectTypeOf(credentialDescriptor).toMatchTypeOf<PodModelDescriptor>()
    expect(descriptorContract).toBe(credentialDescriptor)
    expect(fieldContract).toBe(credentialDescriptor.fields.provider)
  })

  it('exposes the edge target a relation field points at', () => {
    expect(credentialDescriptor.fields.provider.references).toEqual({
      resource: 'provider',
      key: 'id',
    })
    expectTypeOf(credentialDescriptor.fields.provider.references?.resource).toEqualTypeOf<'provider'>()
  })
})
