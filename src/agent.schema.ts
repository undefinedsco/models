import { podTable, string, integer, timestamp, text, real, uri, id } from "@undefineds.co/drizzle-solid";
import { UDFS, DCTerms, FOAF, VCARD } from "./namespaces";
import { agentResourceId } from "./resource-id-defaults";
import type { ResourceInsert, ResourceRow, ResourceUpdate } from "./resource-identity";

export const agentResource = podTable("agent", {
  id: id("id").default(agentResourceId),
  name: string("name").predicate(FOAF.name).notNull(),
  description: text("description").predicate(DCTerms.description),
  avatarUrl: uri("avatarUrl").predicate(VCARD.hasPhoto),

  instructions: text("instructions").predicate(UDFS.systemMessage),
  provider: string("provider").predicate(UDFS.provider),
  model: string("model").predicate(UDFS.model),
  temperature: real("temperature").predicate(UDFS.temperature).default(0.7),
  tools: text("tools").array().predicate(UDFS.tools),
  contextRound: integer("contextRound").predicate(UDFS.contextRound).default(4),

  ttsModel: string("ttsModel").predicate(UDFS.ttsModel),
  videoModel: string("videoModel").predicate(UDFS.videoModel),

  createdAt: timestamp("createdAt").predicate(DCTerms.created).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").predicate(DCTerms.modified).notNull().defaultNow(),
  deletedAt: timestamp("deletedAt").predicate(UDFS.deletedAt),
}, {
  base: '/.data/agents/',
  sparqlEndpoint: '/.data/agents/-/sparql',
  type: FOAF.Agent,
  namespace: UDFS,
});

// Compatibility alias. New model code should prefer `agentResource`.
export const agentTable = agentResource;

export type AgentRow = ResourceRow<typeof agentResource.$inferSelect>;
export type AgentInsert = ResourceInsert<typeof agentResource.$inferInsert>;
export type AgentUpdate = ResourceUpdate<typeof agentResource.$inferUpdate>;
