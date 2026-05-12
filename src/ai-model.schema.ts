import { id, integer, podTable, string, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { aiProviderResource } from "./ai-provider.schema"
import { XPOD_AI } from "./namespaces"

export const aiModelResource = podTable("aiModel", {
  id: id("id"),
  displayName: string("displayName").predicate(XPOD_AI.displayName),
  modelType: string("modelType").predicate(XPOD_AI.modelType).default("chat"),
  isProvidedBy: uri("isProvidedBy").predicate(XPOD_AI.isProvidedBy).link(aiProviderResource),
  dimension: integer("dimension").predicate(XPOD_AI.dimension),
  status: string("status").predicate(XPOD_AI.status).default("active"),
  createdAt: timestamp("createdAt").predicate(XPOD_AI.createdAt).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").predicate(XPOD_AI.updatedAt).notNull().defaultNow(),
}, {
  base: "/settings/ai/models/",
  type: XPOD_AI.Model,
  namespace: XPOD_AI,
  subjectTemplate: "{isProvidedBy|id}.ttl#{id}",
})

// Compatibility alias. New model code should prefer `aiModelResource`.
export const aiModelTable = aiModelResource

export type AIModelRow = typeof aiModelResource.$inferSelect
export type AIModelInsert = typeof aiModelResource.$inferInsert
export type AIModelUpdate = typeof aiModelResource.$inferUpdate
