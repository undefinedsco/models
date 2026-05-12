import { id, podTable, string, uri } from "@undefineds.co/drizzle-solid"
import { XPOD_AI } from "./namespaces"

export const aiProviderResource = podTable("aiProvider", {
  id: id("id"),
  displayName: string("displayName").predicate(XPOD_AI.displayName),
  baseUrl: string("baseUrl").predicate(XPOD_AI.baseUrl),
  proxyUrl: string("proxyUrl").predicate(XPOD_AI.proxyUrl),
  hasModel: uri("hasModel").predicate(XPOD_AI.hasModel).link("aiModel"),
  defaultModel: uri("defaultModel").predicate(XPOD_AI.defaultModel).link("aiModel"),
}, {
  base: "/settings/ai/providers.ttl",
  type: XPOD_AI.Provider,
  namespace: XPOD_AI,
  subjectTemplate: "#{id}",
})

// Compatibility alias. New model code should prefer `aiProviderResource`.
export const aiProviderTable = aiProviderResource

export type AIProviderRow = typeof aiProviderResource.$inferSelect
export type AIProviderInsert = typeof aiProviderResource.$inferInsert
export type AIProviderUpdate = typeof aiProviderResource.$inferUpdate
