import { describe, expect, it } from 'vitest'
import {
  evidenceResource,
  ideaResource,
  issueResource,
  reportResource,
} from '../src'

describe('personal linked context file path helpers', () => {
  it('builds resource-owned default document paths for file-primary resources', () => {
    expect(ideaResource.defaultDocumentPath(
      { summary: 'LLM Wiki Capabilities' },
      { project: 'linx-cli' },
    )).toBe('projects/linx-cli/ideas/llm-wiki-capabilities.md')

    expect(issueResource.defaultDocumentPath(
      { title: 'Fix Login Loop' },
      { project: 'linx-cli' },
    )).toBe('projects/linx-cli/issues/fix-login-loop.md')

    expect(reportResource.defaultDocumentPath(
      { reportKind: 'handoff', summary: 'Worker Handoff Report' },
      { project: 'linx-cli' },
    )).toBe('projects/linx-cli/reports/worker-handoff-report.md')
  })

  it('builds resource-owned default source paths for evidence bodies', () => {
    expect(evidenceResource.defaultSourcePath(
      { evidenceKind: 'runtime_log', summary: 'Codex Capture Smoke Log' },
      { project: 'linx-cli', extension: 'log' },
    )).toBe('projects/linx-cli/evidence/codex-capture-smoke-log.log')
  })

  it('lets explicit path policy override project and slug without changing modeled namespaces', () => {
    expect(ideaResource.defaultDocumentPath(
      { summary: 'Should not drive the slug' },
      {
        root: 'areas',
        project: 'product',
        slug: 'capture-loop',
      },
    )).toBe('areas/product/ideas/capture-loop.md')
  })
})
