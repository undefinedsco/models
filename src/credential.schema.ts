import { boolean, id, integer, podTable, string, text, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { UDFS } from "./namespaces"

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
  authMode: string("authMode").predicate(UDFS.authMode).notNull().default(ProviderAuthMode.apiKey),
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
  lastUsedAt: timestamp("lastUsedAt").predicate(UDFS.lastUsedAt),
  failCount: integer("failCount").predicate(UDFS.failCount).default(0),
  rateLimitResetAt: timestamp("rateLimitResetAt").predicate(UDFS.rateLimitResetAt),
  oauthRefreshToken: string("oauthRefreshToken").predicate(UDFS.oauthRefreshToken),
  oauthAccessToken: string("oauthAccessToken").predicate(UDFS.oauthAccessToken),
  oauthExpiresAt: timestamp("oauthExpiresAt").predicate(UDFS.oauthExpiresAt),
  projectId: string("projectId").predicate(UDFS.projectId),
  organizationId: string("organizationId").predicate(UDFS.organizationId),
}, {
  base: "/settings/",
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
