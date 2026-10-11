import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

describe('pure public file-reader-notes entry', () => {
  it('publishes the canonical emitted module and declaration without a barrel', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    expect(pkg.exports['./file-reader-notes']).toEqual({ types: './dist/file-reader-notes.d.ts', node: './dist/file-reader-notes.js', default: './dist/file-reader-notes.js' })
    const output = readFileSync(new URL('../dist/file-reader-notes.js', import.meta.url), 'utf8')
    expect(output).not.toMatch(/\b(?:import|require)\s*\(/)
    expect(output).not.toMatch(/\bfrom\s+['"]/)
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import { FILE_METADATA_NOTE_KIND, READER_COVERAGE_NOTE_KIND } from '@undefineds.co/models/file-reader-notes'; if (FILE_METADATA_NOTE_KIND !== 'file-metadata' || READER_COVERAGE_NOTE_KIND !== 'reader-coverage') process.exit(1)"], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
    expect(result.error).toBeUndefined()
    expect(result.status, result.stderr).toBe(0)
  })
})
