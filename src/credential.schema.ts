import { boolean, id, integer, podTable, string, text, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { DCTerms, UDFS } from "./namespaces"

export const ProviderAuthMode = {
  oauth: "oauth",
  deviceCode: "deviceCode",
  console: "console",
  apiKey: "apiKey",
} as const

export type ProviderAuthModeType = typeof ProviderAuthMode[keyof typeof ProviderAuthMode]

export const CredentialSecretAlgorithm = {
  A256GCM: "A256GCM",
} as const

export type CredentialSecretAlgorithmType =
  typeof CredentialSecretAlgorithm[keyof typeof CredentialSecretAlgorithm]

export const CredentialStorageMode = {
  plaintextV1: "plaintext-v1",
  secretCellV1: "secret-cell-v1",
} as const

export type CredentialStorageModeType =
  typeof CredentialStorageMode[keyof typeof CredentialStorageMode]

export const credentialResource = podTable("credential", {
  id: id("id").default("credentials.ttl#{key}"),
  provider: uri("provider").predicate(UDFS.provider).link("aiProvider"),
  // Keep the write default while allowing credentials created before authMode
  // was introduced to remain queryable and migratable.
  authMode: string("authMode").predicate(UDFS.authMode).default(ProviderAuthMode.apiKey),
  service: string("service").predicate(UDFS.service).notNull().default("ai"),
  status: string("status").predicate(UDFS.status).notNull().default("active"),
  apiKey: string("apiKey").predicate(UDFS.apiKey),
  storageMode: string("storageMode").predicate(UDFS.storageMode),
  secretPayload: string("secretPayload").predicate(UDFS.secretPayload),
  encryptedSecret: string("encryptedSecret").predicate(UDFS.encryptedSecret),
  wrappedDataKey: string("wrappedDataKey").predicate(UDFS.wrappedDataKey),
  encryptionAlgorithm: string("encryptionAlgorithm").predicate(UDFS.encryptionAlgorithm),
  keyVersion: string("keyVersion").predicate(UDFS.keyVersion),
  scopes: text("scopes").array().predicate(UDFS.scopes),
  expiresAt: timestamp("expiresAt").predicate(UDFS.expiresAt),
  accountLabel: string("accountLabel").predicate(UDFS.accountLabel),
  lastRefreshAt: timestamp("lastRefreshAt").predicate(UDFS.lastRefreshAt),
  reauthRequired: boolean("reauthRequired").predicate(UDFS.reauthRequired).default(false),
  baseUrl: string("baseUrl").predicate(UDFS.baseUrl),
  proxyUrl: string("proxyUrl").predicate(UDFS.proxyUrl),
  label: string("label").predicate(UDFS.label),
  isDefault: boolean("isDefault").predicate(UDFS.isDefault).default(false),
  createdAt: timestamp("createdAt").predicate(DCTerms.created).notNull().defaultNow(),
  lastUsedAt: timestamp("lastUsedAt").predicate(UDFS.lastUsedAt),
  // A credential Xpod itself issued to a client (the gateway `sk-` key) names the
  // CSS/OIDC client it belongs to. That is an external runtime identifier - the
  // `client_id` inside the wrapper and the CSS label behind it - not an RDF link.
  clientCredentialId: string("clientCredentialId").predicate(UDFS.clientCredentialId),
  // Where an issued credential is in effect. `appliedTo` is a client application
  // id from the client-configuration adapter's closed set, `appliedOn` the device
  // id that wrote the configuration; both are runtime identifiers, not links.
  appliedTo: string("appliedTo").predicate(UDFS.appliedTo),
  appliedOn: string("appliedOn").predicate(UDFS.appliedOn),
  appliedAt: timestamp("appliedAt").predicate(UDFS.appliedAt),
  failCount: integer("failCount").predicate(UDFS.failCount).default(0),
  rateLimitResetAt: timestamp("rateLimitResetAt").predicate(UDFS.rateLimitResetAt),
  oauthRefreshToken: string("oauthRefreshToken").predicate(UDFS.oauthRefreshToken),
  oauthAccessToken: string("oauthAccessToken").predicate(UDFS.oauthAccessToken),
  oauthExpiresAt: timestamp("oauthExpiresAt").predicate(UDFS.oauthExpiresAt),
  projectId: string("projectId").predicate(UDFS.projectId),
  organizationId: string("organizationId").predicate(UDFS.organizationId),
}, {
  base: "/settings/",
  sparqlEndpoint: "/settings/-/sparql",
  type: UDFS.Credential,
  namespace: UDFS,
})

// Compatibility aliases. New model code should prefer `credentialResource`.
export const credentialTable = credentialResource
export const apiKeyCredentialResource = credentialResource
export const apiKeyCredentialTable = credentialResource
export const oauthCredentialResource = credentialResource
export const oauthCredentialTable = credentialResource

export type CredentialRow = typeof credentialResource.$inferSelect
export type CredentialInsert = typeof credentialResource.$inferInsert
export type CredentialUpdate = typeof credentialResource.$inferUpdate

export type ApiKeyCredentialRow = typeof apiKeyCredentialResource.$inferSelect
export type ApiKeyCredentialInsert = typeof apiKeyCredentialResource.$inferInsert
export type ApiKeyCredentialUpdate = typeof apiKeyCredentialResource.$inferUpdate

export type OAuthCredentialRow = typeof oauthCredentialResource.$inferSelect
export type OAuthCredentialInsert = typeof oauthCredentialResource.$inferInsert
export type OAuthCredentialUpdate = typeof oauthCredentialResource.$inferUpdate
