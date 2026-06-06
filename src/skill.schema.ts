import { boolean, id, object, podTable, string, timestamp, uri } from '@undefineds.co/drizzle-solid'
import { agentResource } from './agent.schema'
import { DCTerms, UDFS } from './namespaces'

/**
 * Skill binding resource.
 *
 * Skill content is file/folder-backed. This resource records the Agent-scoped
 * binding and lightweight load metadata; it does not duplicate full skill text.
 */
export const skillResource = podTable(
  'skill',
  {
    id: id('id').default('{agent.key}/skills/{key}/'),

    agent: uri('agent').predicate(UDFS.agent).notNull().link(agentResource),
    root: uri('root').predicate(UDFS.root),
    name: string('name').predicate(UDFS.name).notNull(),
    displayName: string('displayName').predicate(UDFS.displayName),
    enabled: boolean('enabled').predicate(UDFS.enabled).default(true),
    version: string('version').predicate(UDFS.version),
    source: string('source').predicate(UDFS.source),
    checksum: string('checksum').predicate(UDFS.checksum),
    loadPolicy: string('loadPolicy').predicate(UDFS.loadPolicy),
    metadata: object('metadata').predicate(UDFS.metadata),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
  },
  {
    base: '/agents/',
    sparqlEndpoint: '/agents/-/sparql',
    type: UDFS.Skill,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `skillResource`.
export const skillTable = skillResource

export type SkillRow = typeof skillResource.$inferSelect
export type SkillInsert = typeof skillResource.$inferInsert
export type SkillUpdate = typeof skillResource.$inferUpdate
