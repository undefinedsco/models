import { fileMetadataNoteValues, readerCoverageNoteValues, type FileMetadataNoteInsert } from '../src/file-reader-notes.schema'
const row: FileMetadataNoteInsert = fileMetadataNoteValues({ subject: 'https://pod.example/.data/n.ttl#n', about: 'urn:file', title: 't', description: 'd', materializationClass: 'hydrated-r2' })
// @ts-expect-error shared input enum rejects unknown class
fileMetadataNoteValues({ subject: 'https://pod.example/n', about: 'urn:file', title: 't', description: 'd', materializationClass: 'other' })
// @ts-expect-error coverage requires readUnits
readerCoverageNoteValues({ subject: 'https://pod.example/n', about: 'urn:file', readerKind: 'pdf', readerVersion: '1', coverageUnit: 'page', coveredRange: '1', status: 'complete' })
void row
