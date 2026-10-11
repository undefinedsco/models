/** Note metadata contracts; subject/about layout remains caller supplied. */
export const FILE_METADATA_NOTE_KIND = 'file-metadata' as const
export const READER_COVERAGE_NOTE_KIND = 'reader-coverage' as const
export const FILE_MATERIALIZATION_CLASSES = ['byline-local', 'placeholder-r2', 'hydrated-r2'] as const
export type FileMaterializationClass = (typeof FILE_MATERIALIZATION_CLASSES)[number]
/** Coverage observation states are separate from durable reader materialization. */
export const READER_COVERAGE_STATUSES = ['none', 'partial', 'complete', 'stale', 'failed'] as const
export type ReaderCoverageStatus = (typeof READER_COVERAGE_STATUSES)[number]
export const READER_COVERAGE_UNITS = ['page', 'line', 'byte', 'section', 'symbol', 'rdf-resource'] as const
export type ReaderCoverageUnit = (typeof READER_COVERAGE_UNITS)[number]

export interface FileMetadataNoteInput {
  subject: string
  about: string
  title: string
  description: string
  mediaType?: string
  byteSize?: number
  contentHash?: string
  materializationClass: FileMaterializationClass
}

export interface ReaderCoverageNoteInput {
  subject: string
  about: string
  readerKind: string
  readerVersion: string
  coverageUnit: ReaderCoverageUnit
  coveredRange: string
  readUnits: number
  totalUnits?: number
  status: ReaderCoverageStatus
}
