import { id, integer, podTable, string, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { aiProviderResource } from "./ai-provider.schema"
import { UDFS } from "./namespaces"

export const aiModelResource = podTable("aiModel", {
  id: id("id").default("{isProvidedBy.doc}#{key}"),
  displayName: string("displayName").predicate(UDFS.displayName),
  modelType: string("modelType").predicate(UDFS.modelType).default("chat"),
  isProvidedBy: uri("isProvidedBy").predicate(UDFS.isProvidedBy).link(aiProviderResource),
  dimension: integer("dimension").predicate(UDFS.dimension),
  status: string("status").predicate(UDFS.status).default("active"),
  createdAt: timestamp("createdAt").predicate(UDFS.createdAt).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").predicate(UDFS.updatedAt).notNull().defaultNow(),
}, {
  base: "/settings/providers/",
  sparqlEndpoint: "/settings/providers/-/sparql",
  type: UDFS.Model,
  namespace: UDFS,
})

// Compatibility alias. New model code should prefer `aiModelResource`.
export const aiModelTable = aiModelResource

export type AIModelRow = typeof aiModelResource.$inferSelect
export type AIModelInsert = typeof aiModelResource.$inferInsert
export type AIModelUpdate = typeof aiModelResource.$inferUpdate
