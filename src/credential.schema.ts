import { boolean, id, integer, podTable, string, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { UDFS } from "./namespaces"

export const credentialResource = podTable("credential", {
  id: id("id"),
  provider: uri("provider").predicate(UDFS.provider).link("aiProvider"),
  service: string("service").predicate(UDFS.service).notNull().default("ai"),
  status: string("status").predicate(UDFS.status).notNull().default("active"),
  apiKey: string("apiKey").predicate(UDFS.apiKey),
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
  base: "/settings/credentials.ttl",
  type: UDFS.Credential,
  namespace: UDFS,
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
