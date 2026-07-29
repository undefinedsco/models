import { podTable, string, text, timestamp, uri, boolean, id } from '@undefineds.co/drizzle-solid'
import { UDFS, DCTerms, VCARD, AS, SCHEMA, RDF } from './namespaces'

export const ContactType = {
  SOLID: 'solid',
  EXTERNAL: 'external',
  AGENT: 'agent',
  GROUP: 'group',
} as const

export type ContactTypeValue = typeof ContactType[keyof typeof ContactType]

export const ContactGender = {
  MALE: 'male',
  FEMALE: 'female',
  BOT: 'bot',
  UNKNOWN: 'unknown',
} as const

export type ContactGenderValue = typeof ContactGender[keyof typeof ContactGender]

export const ContactClass = {
  PERSON: UDFS.PersonContact,
  AGENT: UDFS.AgentContact,
  GROUP: UDFS.GroupContact,
} as const

export type ContactClassValue = typeof ContactClass[keyof typeof ContactClass]
export type ContactRdfTypeInput = string | readonly string[] | null | undefined

type ContactClassifier = {
  rdfType?: ContactRdfTypeInput
  contactType?: string | null
}

export function normalizeContactRdfTypes(
  rdfType: ContactRdfTypeInput,
  fallback: ContactClassValue = ContactClass.PERSON,
): string[] {
  const values = Array.isArray(rdfType)
    ? rdfType
    : rdfType
      ? [rdfType]
      : [fallback]
  return Array.from(new Set(values))
}

function hasContactClass(contact: ContactClassifier | null | undefined, contactClass: ContactClassValue): boolean {
  const rdfTypes = normalizeContactRdfTypes(contact?.rdfType)
  return rdfTypes.includes(contactClass)
}

export function isGroupContact(contact: ContactClassifier | null | undefined): boolean {
  return hasContactClass(contact, ContactClass.GROUP) || contact?.contactType === 'group'
}

export function isAgentContact(contact: ContactClassifier | null | undefined): boolean {
  return hasContactClass(contact, ContactClass.AGENT) || contact?.contactType === ContactType.AGENT
}

export function normalizeContactGender(
  value: string | null | undefined,
  fallback?: ContactGenderValue,
): ContactGenderValue | undefined {
  if (value === ContactGender.MALE || value === ContactGender.FEMALE || value === ContactGender.BOT || value === ContactGender.UNKNOWN) {
    return value
  }
  return fallback
}

/**
 * Contact resource - unified contact index for all contact types.
 */
export const contactResource = podTable(
  'contact',
  {
    id: id('id').default('{key}.ttl'),

    // Display information (cached for search/display)
    name: string('name').predicate(VCARD.fn).notNull(),
    avatarUrl: uri('avatarUrl').predicate(VCARD.hasPhoto),

    // The Person, Agent, Chat, or external resource this contact card is about.
    about: uri('about').predicate(SCHEMA.about).notNull(),

    // Semantic classifier for the represented resource.
    rdfType: uri('rdfType').array().predicate(RDF.type).notNull().default([ContactClass.PERSON]),

    // Runtime/source hint for fetch/handler selection.
    // Group semantics are modeled via rdfType, not contactType.
    contactType: string('contactType').predicate(UDFS.contactType).notNull(),

    // Visibility (Solid social graph)

    isPublic: boolean('isPublic').predicate(AS.audience).default(false),

    // External platform users
    externalPlatform: string('externalPlatform').predicate(UDFS.externalPlatform),
    externalId: string('externalId').predicate(UDFS.externalId),


    // User's private metadata
    alias: string('alias').predicate(UDFS.alias),
    starred: boolean('starred').predicate(UDFS.favorite).default(false),
    note: text('note').predicate(VCARD.note),
    sortKey: string('sortKey').predicate(UDFS.sortKey),


    // Demographics
    gender: string('gender').predicate(VCARD.hasGender),
    province: string('province').predicate(VCARD.region),
    city: string('city').predicate(VCARD.locality),

    // Timestamps
    createdAt: timestamp('createdAt').predicate(DCTerms.created).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').predicate(DCTerms.modified).notNull().defaultNow(),
    deletedAt: timestamp('deletedAt').predicate(UDFS.deletedAt),
    lastSyncedAt: timestamp('lastSyncedAt').predicate(UDFS.lastSyncedAt),
  },
  {
    base: '/.data/contacts/',
    sparqlEndpoint: '/.data/contacts/-/sparql',
    type: VCARD.Individual,
    namespace: UDFS,
  },
)

// Compatibility alias. New model code should prefer `contactResource`.
export const contactTable = contactResource

export type ContactRow = typeof contactResource.$inferSelect
export type ContactInsert = typeof contactResource.$inferInsert
export type ContactUpdate = typeof contactResource.$inferUpdate
