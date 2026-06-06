import { id, integer, podTable, string, timestamp, uri } from "@undefineds.co/drizzle-solid"
import { aiProviderResource } from "./ai-provider.schema"
import { UDFS } from "./namespaces"

function normalizeAIModelResourcePart(value: unknown): string {
  const raw = typeof value === "string"
    ? value.trim()
    : value && typeof value === "object"
      ? String((value as Record<string, unknown>)["@id"] ?? (value as Record<string, unknown>).id ?? "")
      : ""
  if (!raw) return ""
  if (raw.includes("#")) {
    return raw.slice(raw.lastIndexOf("#") + 1)
  }
  return raw
}

function normalizeAIModelProviderPart(value: unknown): string {
  const raw = typeof value === "string"
    ? value.trim()
    : value && typeof value === "object"
      ? String((value as Record<string, unknown>)["@id"] ?? (value as Record<string, unknown>).id ?? "")
      : ""
  if (!raw) return ""
  const document = raw.split("#", 1)[0]?.replace(/\/+$/u, "") ?? raw
  const tail = document.split("/").filter(Boolean).pop() ?? document
  return tail.endsWith(".ttl") ? tail.slice(0, -4) : tail
}

export function aiModelResourceId(
  key: string | undefined,
  row?: Record<string, unknown>,
): string {
  const modelId = normalizeAIModelResourcePart(key ?? row?.id)
  const providerId = normalizeAIModelProviderPart(row?.isProvidedBy ?? row?.provider)
  return providerId && modelId ? `${providerId}.ttl#${modelId}` : modelId
}

export const aiModelResource = podTable("aiModel", {
  id: id("id").default((key: string | undefined, row?: Record<string, unknown>) => {
    const modelId = normalizeAIModelResourcePart(key ?? row?.id)
    const providerId = normalizeAIModelProviderPart(row?.isProvidedBy ?? row?.provider)
    return providerId && modelId ? `${providerId}.ttl#${modelId}` : modelId
  }),
  displayName: string("displayName").predicate(UDFS.displayName),
  modelType: string("modelType").predicate(UDFS.modelType).default("chat"),
  isProvidedBy: uri("isProvidedBy").predicate(UDFS.isProvidedBy).link(aiProviderResource),
  dimension: integer("dimension").predicate(UDFS.dimension),
  status: string("status").predicate(UDFS.status).default("active"),
  createdAt: timestamp("createdAt").predicate(UDFS.createdAt).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").predicate(UDFS.updatedAt).notNull().defaultNow(),
}, {
  base: "/settings/providers/",
  type: UDFS.Model,
  namespace: UDFS,
})

// Compatibility alias. New model code should prefer `aiModelResource`.
export const aiModelTable = aiModelResource

export type AIModelRow = typeof aiModelResource.$inferSelect
export type AIModelInsert = typeof aiModelResource.$inferInsert
export type AIModelUpdate = typeof aiModelResource.$inferUpdate
