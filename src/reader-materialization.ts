export const READER_MATERIALIZATION_NOTE_KIND =
  'reader-materialization' as const
export const READER_MARKDOWN_MEDIA_TYPE = 'text/markdown' as const
export const READER_CHUNK_POLICY_VERSION = 'markdown-mdast-v1' as const
export const READER_NOTE_FRAGMENT = '#reader' as const

export const READER_MATERIALIZATION_STATUSES = [
  'pending',
  'complete',
  'stale',
  'failed',
] as const

export type ReaderMaterializationStatus =
  (typeof READER_MATERIALIZATION_STATUSES)[number]

export interface ReaderMaterializationProvenance {
  readerEngine: string
  readerVersion: string
  generatedWithModel?: string
  sourceHash: string
  readerOptionsHash: string
  representationHash: string
  representationMediaType: typeof READER_MARKDOWN_MEDIA_TYPE
  coverageUnit: 'page' | 'line' | 'byte' | 'section' | 'symbol' | 'rdf-resource'
  coveredRange: string
  readUnits: number
  totalUnits?: number
  status: ReaderMaterializationStatus
  failureCategory?: string
}
