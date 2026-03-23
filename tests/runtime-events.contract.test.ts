import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import {
  InboxApprovalEventSchema,
  RuntimeEventSchema,
  SessionStateEventSchema,
  ToolCallEventSchema,
  ToolControlCommandSchema,
  getRuntimeEventVersion,
} from '../src/protocols/runtime-events'

const FIXTURES_DIR = fileURLToPath(new URL('./fixtures/runtime-events/', import.meta.url))

function loadFixture(name: string): unknown {
  const raw = readFileSync(join(FIXTURES_DIR, name), 'utf-8')
  return JSON.parse(raw)
}

describe('runtime event contracts (v1 frozen)', () => {
  test('tool.call v1 fixture parses', () => {
    const evt = loadFixture('tool.call.v1.json')
    expect(() => ToolCallEventSchema.parse(evt)).not.toThrow()
    expect(getRuntimeEventVersion(RuntimeEventSchema.parse(evt))).toBe(1)
  })

  test('session.state v1 fixture parses', () => {
    const evt = loadFixture('session.state.v1.json')
    expect(() => SessionStateEventSchema.parse(evt)).not.toThrow()
  })

  test('tool.control v1 fixture parses', () => {
    const evt = loadFixture('tool.control.v1.json')
    expect(() => ToolControlCommandSchema.parse(evt)).not.toThrow()
  })

  test('inbox.approval v1 fixture parses', () => {
    const evt = loadFixture('inbox.approval.v1.json')
    expect(() => InboxApprovalEventSchema.parse(evt)).not.toThrow()
  })

  test('v1 strict schemas reject unknown fields', () => {
    const evt = loadFixture('tool.call.v1.json') as any
    evt.extraField = 'nope'
    expect(() => ToolCallEventSchema.parse(evt)).toThrow()
  })
})
