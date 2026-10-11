import { eq, id, integer, podTable, string, text, uri } from '@undefineds.co/drizzle-solid'
import { DCTerms, SIOC, UDFS } from './namespaces'
import { createResourceRepositoryDescriptor } from './repository'
import { FILE_METADATA_NOTE_KIND, READER_COVERAGE_NOTE_KIND, FILE_MATERIALIZATION_CLASSES, READER_COVERAGE_STATUSES, READER_COVERAGE_UNITS, type FileMetadataNoteInput, type ReaderCoverageNoteInput } from './file-reader-notes'

/** Same Note class and storage base; noteKind is data, never an id/path discriminator. */
const noteStorage = { base: '/.data/', sparqlEndpoint: '/.data/-/sparql', type: UDFS.Note, namespace: UDFS }
const commonColumns = () => ({
  id: id('id'),
  about: uri('about').predicate(SIOC.about).notNull(),
  title: text('title').predicate(DCTerms.title).notNull(),
  description: text('description').predicate(DCTerms.description).notNull(),
})

export const fileMetadataNoteResource = podTable('fileMetadataNote', {
  ...commonColumns(),
  noteKind: string('noteKind').predicate(UDFS.noteKind).notNull().default(FILE_METADATA_NOTE_KIND),
  mediaType: string('mediaType').predicate(UDFS.mediaType),
  byteSize: integer('byteSize').predicate(UDFS.byteSize),
  contentHash: string('contentHash').predicate(UDFS.contentHash),
  materializationClass: string('materializationClass').predicate(UDFS.materializationClass).notNull(),
}, noteStorage)

export const readerCoverageNoteResource = podTable('readerCoverageNote', {
  ...commonColumns(),
  noteKind: string('noteKind').predicate(UDFS.noteKind).notNull().default(READER_COVERAGE_NOTE_KIND),
  readerKind: string('readerKind').predicate(UDFS.readerKind).notNull(),
  readerVersion: string('readerVersion').predicate(UDFS.readerVersion).notNull(),
  coverageUnit: string('coverageUnit').predicate(UDFS.coverageUnit).notNull(),
  coveredRange: string('coveredRange').predicate(UDFS.coveredRange).notNull(),
  readUnits: integer('readUnits').predicate(UDFS.readUnits).notNull(),
  totalUnits: integer('totalUnits').predicate(UDFS.totalUnits),
  status: string('status').predicate(UDFS.status).notNull(),
}, noteStorage)

export type FileMetadataNoteRow = typeof fileMetadataNoteResource.$inferSelect
export type FileMetadataNoteInsert = typeof fileMetadataNoteResource.$inferInsert
export type ReaderCoverageNoteRow = typeof readerCoverageNoteResource.$inferSelect
export type ReaderCoverageNoteInsert = typeof readerCoverageNoteResource.$inferInsert

/** Collection discrimination uses the property; exact targets remain complete IRIs. */
export const fileMetadataNoteRepository = createResourceRepositoryDescriptor({
  namespace: 'fileMetadataNotes', resource: fileMetadataNoteResource,
  filter: ({ resource }) => eq(resource.noteKind, FILE_METADATA_NOTE_KIND),
})
export const readerCoverageNoteRepository = createResourceRepositoryDescriptor({
  namespace: 'readerCoverageNotes', resource: readerCoverageNoteResource,
  filter: ({ resource }) => eq(resource.noteKind, READER_COVERAGE_NOTE_KIND),
})

/** Persisted subjects must identify an addressable Pod document, not a blank node. */
function exactNoteSubject(subject: string): string {
  const url = new URL(subject)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || /[\s<>"{}|^`\\]/.test(subject) || /%(?![0-9a-f]{2})/i.test(subject)) {
    throw new Error('Note subject must be an absolute HTTP(S) resource IRI')
  }
  return subject
}

function noteAbout(about: string): void {
  // A URI relation may be any absolute IRI (including URN); never resolve it against id.
  new URL(about)
  if (/[\s<>"{}|^`\\]/.test(about) || /%(?![0-9a-f]{2})/i.test(about)) throw new Error('Note about must be an absolute resource IRI')
}
function nonNegativeInteger(value: number | undefined): void {
  if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) throw new Error('Note count must be a non-negative safe integer')
}

export function fileMetadataNoteValues(input: FileMetadataNoteInput): FileMetadataNoteInsert {
  const { subject, ...values } = input
  noteAbout(input.about)
  nonNegativeInteger(input.byteSize)
  if (!(FILE_MATERIALIZATION_CLASSES as readonly string[]).includes(input.materializationClass)) throw new Error('Unknown file materialization class')
  return { ...values, id: exactNoteSubject(subject), noteKind: FILE_METADATA_NOTE_KIND }
}
export function readerCoverageNoteValues(input: ReaderCoverageNoteInput): ReaderCoverageNoteInsert {
  const { subject, ...values } = input
  noteAbout(input.about)
  nonNegativeInteger(input.readUnits)
  nonNegativeInteger(input.totalUnits)
  if (!(READER_COVERAGE_STATUSES as readonly string[]).includes(input.status) || !(READER_COVERAGE_UNITS as readonly string[]).includes(input.coverageUnit)) throw new Error('Unknown reader coverage value')
  return { ...values, id: exactNoteSubject(subject), noteKind: READER_COVERAGE_NOTE_KIND,
    title: 'Reader coverage', description: `Read ${input.coveredRange}.` }
}
