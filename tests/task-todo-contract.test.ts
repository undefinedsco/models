import { describe, expect, it } from 'vitest'
import { DCTerms, taskDescriptor, taskResource, UDFS } from '../src'

describe('Task personal todo contract', () => {
  it('keeps deadline, completion and notes in the shared resource and descriptor', () => {
    const columns = (taskResource as any)._.columns ?? (taskResource as any).columns
    for (const [name, predicate] of Object.entries({ dueAt: UDFS.dueAt, completedAt: UDFS.completedAt, notes: DCTerms.description })) {
      expect(columns[name].getPredicate(UDFS)).toBe(predicate)
      expect((taskDescriptor.fields as any)[name].predicate).toBe(predicate)
      expect(taskDescriptor.writableFields).toContain(name)
    }
    expect(columns.assignedTo).toBeDefined()
    expect(columns.source).toBeDefined()
    expect(columns.runner).toBeUndefined()
  })
  it('retains exact resource ids and the shared default layout', () => {
    expect(taskResource.buildId({ id: 'index.ttl#mine' })).toBe('index.ttl#mine')
  })
})
