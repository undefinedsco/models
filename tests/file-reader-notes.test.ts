import { describe, expect, it } from 'vitest'
import { FILE_METADATA_NOTE_KIND, READER_COVERAGE_NOTE_KIND, FILE_MATERIALIZATION_CLASSES, READER_COVERAGE_STATUSES, READER_COVERAGE_UNITS } from '../src/file-reader-notes'
import { READER_MATERIALIZATION_STATUSES } from '../src/reader-materialization'
import { FileMetadataNoteVocab, ReaderCoverageNoteVocab } from '../src/vocab'
import { UDFS, SIOC, DCTerms } from '../src/namespaces'

describe('file metadata and reader coverage Note contracts', () => {
  it('uses canonical RDF vocabulary and keeps durable materialization independent', () => {
    expect(UDFS.NAMESPACE).toBe('https://undefineds.co/ns#')
    expect(FileMetadataNoteVocab).toEqual({ type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', noteType: UDFS.Note, about: SIOC.about, title: DCTerms.title, description: DCTerms.description, noteKind: UDFS.noteKind, mediaType: UDFS.mediaType, byteSize: UDFS.byteSize, contentHash: UDFS.contentHash, materializationClass: UDFS.materializationClass })
    expect(ReaderCoverageNoteVocab.readerKind).toBe('https://undefineds.co/ns#readerKind')
    expect(ReaderCoverageNoteVocab.coverageUnit).toBe(UDFS.coverageUnit)
    expect(ReaderCoverageNoteVocab.about).toBe(SIOC.about)
    expect(READER_MATERIALIZATION_STATUSES).toEqual(['complete', 'stale'])
  })
  it('declares distinct note categories and complete observation values', () => {
    expect(FILE_METADATA_NOTE_KIND).toBe('file-metadata')
    expect(READER_COVERAGE_NOTE_KIND).toBe('reader-coverage')
    expect(FILE_MATERIALIZATION_CLASSES).toEqual(['byline-local', 'placeholder-r2', 'hydrated-r2'])
    expect(READER_COVERAGE_STATUSES).toEqual(['none', 'partial', 'complete', 'stale', 'failed'])
    expect(READER_COVERAGE_UNITS).toEqual(['page', 'line', 'byte', 'section', 'symbol', 'rdf-resource'])
  })
})
