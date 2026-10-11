import type { FileMetadataNoteInput, ReaderCoverageNoteInput } from '../src/file-reader-notes'
import type { ReaderMaterializationStatus } from '../src/reader-materialization'
const metadata: FileMetadataNoteInput = { subject: 'urn:note:file', about: 'urn:file', title: 'File', description: 'Metadata', materializationClass: 'placeholder-r2' }
const coverage: ReaderCoverageNoteInput = { subject: 'urn:note:reader', about: metadata.about, readerKind: 'pdf', readerVersion: '1', coverageUnit: 'page', coveredRange: '1-2', readUnits: 2, status: 'partial' }
// @ts-expect-error arbitrary observation states are not valid schema values
const badCoverage: ReaderCoverageNoteInput = { ...coverage, status: 'running' }
// @ts-expect-error observation states must not widen durable materialization
const badMaterialization: ReaderMaterializationStatus = coverage.status
// @ts-expect-error unregistered storage classes are not valid
const badMetadata: FileMetadataNoteInput = { ...metadata, materializationClass: 'remote' }
void [badCoverage, badMaterialization, badMetadata]
