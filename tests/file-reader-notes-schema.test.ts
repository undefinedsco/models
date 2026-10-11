import { describe, expect, it } from 'vitest'
import { drizzle } from '@undefineds.co/drizzle-solid'
import { FILE_METADATA_NOTE_KIND, READER_COVERAGE_NOTE_KIND } from '../src/file-reader-notes'
import { fileMetadataNoteResource, readerCoverageNoteResource, fileMetadataNoteValues, readerCoverageNoteValues, fileMetadataNoteRepository, readerCoverageNoteRepository } from '../src/file-reader-notes.schema'
import { SIOC, UDFS } from '../src/namespaces'

const subject = 'https://pod.example/.data/acceptance.ttl#note-1'
const about = 'https://pod.example/files/report.pdf'
describe('Note ORM exact subject and URI relations', () => {
  it('does not derive classification or about from layout', () => {
    for (const resource of [fileMetadataNoteResource, readerCoverageNoteResource]) {
      expect(resource.buildIri('https://pod.example/', subject)).toBe(subject)
      expect(resource.buildIri('https://pod.example/', 'acceptance.ttl#note-1')).toBe(subject)
      expect(resource.getSubjectTemplate()).toBeUndefined()
      expect(resource.getType()).toBe(UDFS.Note)
      expect(resource._.columns.id.options.defaultValue).toBeUndefined()
      expect(resource._.columns.about.getPredicate(UDFS)).toBe(SIOC.about)
      expect(resource._.columns.about.dataType).toBe('uri')
    }
  })
  it('maps supplied subjects to exact id without changing metadata or about', () => {
    const metadata = fileMetadataNoteValues({ subject, about, title: 'Metadata', description: 'File', materializationClass: 'placeholder-r2', byteSize: 42 })
    expect(metadata).toEqual({ id: subject, about, title: 'Metadata', description: 'File', materializationClass: 'placeholder-r2', byteSize: 42, noteKind: FILE_METADATA_NOTE_KIND })
    const coverage = readerCoverageNoteValues({ subject, about, readerKind: 'pdf', readerVersion: '1', coverageUnit: 'page', coveredRange: '1-2', readUnits: 2, status: 'partial' })
    expect(coverage).toMatchObject({ id: subject, about, noteKind: READER_COVERAGE_NOTE_KIND, title: 'Reader coverage', description: 'Read 1-2.' })
    expect(fileMetadataNoteRepository.resourcePath).toBe(readerCoverageNoteRepository.resourcePath)
  })
  it('uses the real ORM exact read path and preserves the about URI', async () => {
    const requests: { url: string; method: string; body: string }[] = []
    const turtle = `<${subject}> a <${UDFS.Note}>; <${SIOC.about}> <urn:example:file>; <${UDFS.noteKind}> "file-metadata"; <${UDFS.materializationClass}> "placeholder-r2" .
<https://pod.example/.data/acceptance.ttl#other> a <${UDFS.Note}>; <${SIOC.about}> <urn:example:other>; <${UDFS.noteKind}> "reader-coverage" .`
    const db = drizzle({
      info: { isLoggedIn: true, webId: 'https://pod.example/profile/card#me', podUrl: 'https://pod.example/' },
      fetch: async (input, init) => { requests.push({ url: String(input), method: init?.method ?? 'GET', body: String(init?.body ?? '') }); return new Response(turtle, { headers: { 'Content-Type': 'text/turtle' } }) },
    }, { disableInteropDiscovery: true, resourcePreparation: 'off', podUrl: 'https://pod.example/' })
    const row = await db.findByIri(fileMetadataNoteResource, subject)
    expect(row).toMatchObject({ '@id': subject, about: 'urn:example:file', noteKind: 'file-metadata', materializationClass: 'placeholder-r2' })
    expect(requests).toEqual([{ url: 'https://pod.example/.data/acceptance.ttl', method: 'GET', body: '' }])
    await db.insert(fileMetadataNoteResource).values(fileMetadataNoteValues({ subject, about: 'urn:example:file', title: 'T', description: 'D', materializationClass: 'placeholder-r2' })).execute()
    expect(requests[1]).toMatchObject({ url: 'https://pod.example/.data/acceptance.ttl', method: 'PATCH' })
    expect(requests[1].body).toContain(`<${subject}> <${SIOC.about}> <urn:example:file> .`)
    expect(requests[1].body).toContain(`<${subject}> <${UDFS.noteKind}> "file-metadata" .`)
    expect(requests[1].body).not.toContain('"urn:example:file"')
  })
  it.each(['_:note' , 'urn:note', 'relative.ttl#note', 'https://user:password@pod.example/a', 'https://pod.example/has space'])('rejects an unaddressable persisted subject %s', subject => {
    expect(() => fileMetadataNoteValues({ subject, about, title: 't', description: 'd', materializationClass: 'byline-local' })).toThrow()
  })
})
