import { id, integer, podTable, string, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { XPOD_CREDENTIAL } from "./namespaces"

export const credentialResource = podTable("credential", {
  id: id("id"),
  provider: uri("provider").predicate(XPOD_CREDENTIAL.provider).link("aiProvider"),
  service: string("service").predicate(XPOD_CREDENTIAL.service).notNull().default("ai"),
  status: string("status").predicate(XPOD_CREDENTIAL.status).notNull().default("active"),
  apiKey: string("apiKey").predicate(XPOD_CREDENTIAL.apiKey),
  baseUrl: string("baseUrl").predicate(XPOD_CREDENTIAL.baseUrl),
  proxyUrl: string("proxyUrl").predicate(XPOD_CREDENTIAL.proxyUrl),
  label: string("label").predicate(XPOD_CREDENTIAL.label),
  lastUsedAt: timestamp("lastUsedAt").predicate(XPOD_CREDENTIAL.lastUsedAt),
  failCount: integer("failCount").predicate(XPOD_CREDENTIAL.failCount).default(0),
  rateLimitResetAt: timestamp("rateLimitResetAt").predicate(XPOD_CREDENTIAL.rateLimitResetAt),
  oauthRefreshToken: string("oauthRefreshToken").predicate(XPOD_CREDENTIAL.oauthRefreshToken),
  oauthAccessToken: string("oauthAccessToken").predicate(XPOD_CREDENTIAL.oauthAccessToken),
  oauthExpiresAt: timestamp("oauthExpiresAt").predicate(XPOD_CREDENTIAL.oauthExpiresAt),
  projectId: string("projectId").predicate(XPOD_CREDENTIAL.projectId),
  organizationId: string("organizationId").predicate(XPOD_CREDENTIAL.organizationId),
}, {
  base: "/settings/credentials.ttl",
  type: XPOD_CREDENTIAL.Credential,
  namespace: XPOD_CREDENTIAL,
  subjectTemplate: "#{id}",
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
