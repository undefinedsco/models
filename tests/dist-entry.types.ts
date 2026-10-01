import {
  aiProviderDescriptor,
  credentialDescriptor,
  taskDescriptor,
  decideApprovalRequest,
  type ApprovalDecisionRequest,
  type ApprovalDecisionResult,
  type PodModelDescriptor,
  type PodModelFieldDescriptor,
} from '../dist/index.js'

/**
 * Type-level contract for the **published** surface.
 *
 * `tests/pod-storage-descriptor.types.test.ts` asserts the same contract, but
 * against `../src`. This file asserts it against `../dist/index.js` — the entry
 * that actually ships — because a `dist/*.d.ts` whose relative specifiers are
 * extensionless resolves for `moduleResolution: node | bundler` and fails for
 * `nodenext`; with `skipLibCheck: true` it instead degrades every re-export to
 * `any` and the assertions below stop meaning anything.
 *
 * `scripts/check-dist-types.mjs` compiles this file together with every shipped
 * declaration under `moduleResolution: bundler` and `moduleResolution: nodenext`
 * with `skipLibCheck: false`, and is wired into `bun run test:ci`.
 */

/** `true` only when both types are identical. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
/** `true` only when `T` is a literal union rather than a widened `string`. */
type IsNotWidened<T> = string extends T ? false : true
type Expect<T extends true> = T

type _DecisionInput = Expect<Equal<Parameters<typeof decideApprovalRequest>[0], ApprovalDecisionRequest>>
type _DecisionOutput = Expect<Equal<Awaited<ReturnType<typeof decideApprovalRequest>>, ApprovalDecisionResult>>
type _DecisionValues = Expect<Equal<ApprovalDecisionRequest['decision'], 'approved' | 'rejected'>>
type _TaskDueAt = Expect<Equal<typeof taskDescriptor.fields.dueAt.type, 'timestamp'>>
type _TaskCompletedAt = Expect<Equal<typeof taskDescriptor.fields.completedAt.type, 'timestamp'>>
type _TaskNotes = Expect<Equal<typeof taskDescriptor.fields.notes.type, 'text'>>
type _FailureCode = Expect<Equal<typeof credentialDescriptor.fields.lastFailureCode.type, 'string'>>
type _FailureAt = Expect<Equal<typeof credentialDescriptor.fields.lastFailureAt.type, 'timestamp'>>

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

// --- the published field map keeps its literal keys -----------------------

type CredentialField = keyof typeof credentialDescriptor.fields
type _FieldNamesAreNotWidened = Expect<IsNotWidened<CredentialField>>
type _ProviderIsAField = Expect<Equal<'provider' extends CredentialField ? true : false, true>>

// --- per-field types and flags stay literal ------------------------------

type _ProviderType = Expect<Equal<typeof credentialDescriptor.fields.provider.type, 'uri'>>
type _ProviderReference = Expect<Equal<typeof credentialDescriptor.fields.provider.references.resource, 'provider'>>
type _ApiKeyIsSecret = Expect<Equal<typeof credentialDescriptor.fields.apiKey.secret, true>>
type _ScopesIsArray = Expect<Equal<typeof credentialDescriptor.fields.scopes.array, true>>
type _OfferingIdIsAField = Expect<Equal<RowOf<typeof credentialDescriptor>['offeringId'], string>>
type _HasModelIsArray = Expect<Equal<typeof aiProviderDescriptor.fields.hasModel.array, true>>
type _AiProviderKeysAreLiteral = Expect<Equal<
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
// `credentialDescriptor.fields.providerId` must not compile. When the published
// declarations degrade to `any` these directives go unused (TS2578) and the
// stale reads below compile cleanly, which is exactly the regression this file
// exists to catch.
// @ts-expect-error `providerId` is not a credential field; `provider` is.
type _RetiredProviderId = typeof credentialDescriptor.fields.providerId
// @ts-expect-error the derived row has no `providerId` either.
type _RetiredRowField = RowOf<typeof credentialDescriptor>['providerId']
