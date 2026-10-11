import { DCTerms, RDF, SIOC, UDFS } from '../namespaces'

export const FileMetadataNoteVocab = {
  type: RDF.type,
  noteType: UDFS.Note,
  about: SIOC.about,
  title: DCTerms.title,
  description: DCTerms.description,
  noteKind: UDFS.noteKind,
  mediaType: UDFS.mediaType,
  byteSize: UDFS.byteSize,
  contentHash: UDFS.contentHash,
  materializationClass: UDFS.materializationClass,
} as const

export const ReaderCoverageNoteVocab = {
  type: RDF.type,
  noteType: UDFS.Note,
  about: SIOC.about,
  title: DCTerms.title,
  description: DCTerms.description,
  noteKind: UDFS.noteKind,
  readerKind: UDFS.readerKind,
  readerVersion: UDFS.readerVersion,
  coverageUnit: UDFS.coverageUnit,
  coveredRange: UDFS.coveredRange,
  readUnits: UDFS.readUnits,
  totalUnits: UDFS.totalUnits,
  status: UDFS.status,
} as const
