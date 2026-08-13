import { RDF, SIOC, UDFS } from '../namespaces'

export const ReaderMaterializationVocab = {
  type: RDF.type,
  noteType: UDFS.Note,
  about: SIOC.about,
  noteKind: UDFS.noteKind,
  sourceKey: UDFS.sourceKey,
  fingerprint: UDFS.fingerprint,
  readerEngine: UDFS.readerEngine,
  readerVersion: UDFS.readerVersion,
  generatedWithModel: UDFS.generatedWithModel,
  sourceHash: UDFS.sourceHash,
  readerOptionsHash: UDFS.readerOptionsHash,
  representationHash: UDFS.representationHash,
  representationMediaType: UDFS.representationMediaType,
  coverageUnit: UDFS.coverageUnit,
  coveredRange: UDFS.coveredRange,
  readUnits: UDFS.readUnits,
  totalUnits: UDFS.totalUnits,
  status: UDFS.status,
} as const
