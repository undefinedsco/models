import { podTable, uri, timestamp, id } from '@undefineds.co/drizzle-solid'
import { AS, DCTerms, RDF } from './namespaces'

// Solid inbox notifications (protocol channel)
export const inboxNotificationResource = podTable(
  'inbox_notification',
  {
    id: id('id'),

    // Protocol inbox messages are not always Announce. Keep rdf:type writable so
    // app notifications can use as:Announce while other Solid inbox payloads keep their own type.
    rdfType: uri('rdfType').array().predicate(RDF.type).notNull().default([AS.Announce]),

    // Standard ActivityStreams envelope
    actor: uri('actor').predicate(AS.actor),
    object: uri('object').predicate(AS.object).notNull(),

    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
  },
  {
    base: '/inbox/',
    sparqlEndpoint: '/inbox/-/sparql',
    type: AS.Activity,
    namespace: AS,
    subjectTemplate: '{id}.ttl',
  },
)

// Compatibility alias. New model code should prefer `inboxNotificationResource`.
export const inboxNotificationTable = inboxNotificationResource

export type InboxNotificationRow = typeof inboxNotificationResource.$inferSelect
export type InboxNotificationInsert = typeof inboxNotificationResource.$inferInsert
export type InboxNotificationUpdate = typeof inboxNotificationResource.$inferUpdate
