import { boolean, object, podTable, string, integer, timestamp, text, real, uri, id } from "@undefineds.co/drizzle-solid";
import { UDFS, DCTerms, FOAF, VCARD } from "./namespaces";
import { agentResourceId } from "./resource-identity";

export const agentResource = podTable("agent", {
  id: id("id").default((key: string | undefined) => agentResourceId(key)),
  name: string("name").predicate(FOAF.name).notNull(),
  description: text("description").predicate(DCTerms.description),
  avatarUrl: uri("avatarUrl").predicate(VCARD.hasPhoto),

  root: uri("root").predicate(UDFS.root),
  identity: uri("identity").predicate(UDFS.webId),
  hasSkill: uri("hasSkill").array().predicate(UDFS.hasSkill),

  instructions: text("instructions").predicate(UDFS.systemMessage),
  provider: string("provider").predicate(UDFS.provider),
  model: string("model").predicate(UDFS.model),
  backend: string("backend").predicate(UDFS.backend),
  runtime: string("runtime").predicate(UDFS.runtime),
  transport: string("transport").predicate(UDFS.transport),
  endpoint: uri("endpoint").predicate(UDFS.endpoint),
  credentialSource: string("credentialSource").predicate(UDFS.credentialSource),
  temperature: real("temperature").predicate(UDFS.temperature).default(0.7),
  tools: text("tools").array().predicate(UDFS.tools),
  contextRound: integer("contextRound").predicate(UDFS.contextRound).default(4),
  authorityPolicy: object("authorityPolicy").predicate(UDFS.authorityPolicy),
  toolPolicy: object("toolPolicy").predicate(UDFS.toolPolicy),
  metadata: object("metadata").predicate(UDFS.metadata),
  enabled: boolean("enabled").predicate(UDFS.enabled).default(true),

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

export type AgentRow = typeof agentResource.$inferSelect;
export type AgentInsert = typeof agentResource.$inferInsert;
export type AgentUpdate = typeof agentResource.$inferUpdate;
