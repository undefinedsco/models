import { id, podTable, string, uri } from "@undefineds.co/drizzle-solid"
import { UDFS } from "./namespaces"

export const aiProviderResource = podTable("aiProvider", {
  id: id("id").default("{key}.ttl"),
  displayName: string("displayName").predicate(UDFS.displayName),
  baseUrl: string("baseUrl").predicate(UDFS.baseUrl),
  proxyUrl: string("proxyUrl").predicate(UDFS.proxyUrl),
  hasModel: uri("hasModel").predicate(UDFS.hasModel).link("aiModel"),
  defaultModel: uri("defaultModel").predicate(UDFS.defaultModel).link("aiModel"),
  supportsBackend: string("supportsBackend").predicate(UDFS.supportsBackend),
  rotationPolicy: string("rotationPolicy").predicate(UDFS.rotationPolicy),
}, {
  base: "/settings/providers/",
  sparqlEndpoint: "/settings/providers/-/sparql",
  type: UDFS.Provider,
  namespace: UDFS,
})

// Compatibility alias. New model code should prefer `aiProviderResource`.
export const aiProviderTable = aiProviderResource

export type AIProviderRow = typeof aiProviderResource.$inferSelect
export type AIProviderInsert = typeof aiProviderResource.$inferInsert
export type AIProviderUpdate = typeof aiProviderResource.$inferUpdate
