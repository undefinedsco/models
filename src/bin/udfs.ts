#!/usr/bin/env node
import {
  createPodStorage,
  podSchema,
  XPOD_CREDENTIAL,
  type PodStorageValidationResult,
} from '../index'

type JsonValue = Record<string, unknown> | unknown[]
type TokenType = 'tunnel-token' | 'api-token'
type ConsensusRuntime =
  | { mode: 'remote'; baseUrl: string; auth: 'runtime-token' }
  | { mode: 'local-fallback'; auth: 'none' }

interface ConsensusInput {
  session_id?: string
  request: string
  answers?: {
    token_type?: TokenType
  }
  conversation_id?: string
}

interface ConsensusResult {
  session_id?: string
  consensusRuntime: ConsensusRuntime
  consensusResponse?: {
    id?: string
    conversationId?: string
    parsed?: unknown
  }
  first: {
    status: 'needs_clarification'
    questions: Array<{
      id: string
      question: string
      options: TokenType[]
    }>
  }
  resolved: {
    status: 'resolved'
    schemaUri: string
    fieldMapping: {
      service: string
      providerId: string
      secretType: string
      label: string
      status: string
    }
    confidence: number
  }
  descriptor: {
    uri: string
    storage: {
      base: string
      resourceIdPattern: string
      subjectTemplate?: string
    }
  }
}

async function main(argv: string[]): Promise<void> {
  const [area, action, ...rest] = argv

  if (!area || area === 'help' || area === '--help' || area === '-h') {
    printHelp()
    return
  }

  if (area === 'schema') {
    handleSchema(action, rest)
    return
  }

  if (area === 'storage') {
    handleStorage(action, rest)
    return
  }

  if (area === 'consensus') {
    await handleConsensus(action, rest)
    return
  }

  throw new Error(`Unknown udfs command: ${area}`)
}

function handleSchema(action: string | undefined, args: string[]): void {
  if (action === 'list') {
    writeJson(podSchema.list())
    return
  }

  if (action === 'describe') {
    const uri = args[0]
    if (!uri) throw new Error('Usage: udfs schema describe <uri>')
    const descriptor = podSchema.describe({ uri })
    if (!descriptor) throw new Error(`Descriptor not found: ${uri}`)
    writeJson(descriptor as unknown as JsonValue)
    return
  }

  if (action === 'classes') {
    writeJson(podSchema.classes({
      uri: readOption(args, '--uri'),
    }))
    return
  }

  if (action === 'search') {
    const query = readOption(args, '--query') ?? args[0]
    if (!query) throw new Error('Usage: udfs schema search --query <text>')
    writeJson(podSchema.search({
      query,
      source: readOption(args, '--source') as Parameters<typeof podSchema.search>[0]['source'],
      resourceKind: readOption(args, '--resource-kind'),
      limit: readNumberOption(args, '--limit'),
    }))
    return
  }

  if (action === 'predicates') {
    writeJson(podSchema.predicates({
      uri: readOption(args, '--uri'),
      field: readOption(args, '--field'),
    }))
    return
  }

  throw new Error(`Unknown schema command: ${action ?? '(missing)'}`)
}

function handleStorage(action: string | undefined, args: string[]): void {
  if (action === 'validate') {
    const input = readInputPayload(args, 'udfs storage validate --input \'<mutation-json>\'')
    writeJson(createPodStorage().validate(input as {
      schemaUri?: string
      operation: 'upsert'
      match: Record<string, unknown>
      set?: Record<string, unknown>
    }))
    return
  }

  throw new Error(`Unknown storage command: ${action ?? '(missing)'}`)
}

async function handleConsensus(action: string | undefined, args: string[]): Promise<void> {
  if (!action || action === '--help' || action === '-h') {
    printConsensusHelp()
    return
  }

  const allArgs = [action, ...args]
  const input = readConsensusInput(allArgs)
  const result = await resolveConsensusRequest({
    sessionId: input.session_id,
    request: input.request,
    tokenType: input.answers?.token_type ?? 'tunnel-token',
    conversation: input.conversation_id ?? process.env.UDFS_CONSENSUS_CONVERSATION_ID,
  })

  if (allArgs.includes('--json')) {
    writeJson(result as unknown as JsonValue)
    return
  }

  process.stdout.write(`Consensus: ${input.request}\n`)
  if (result.session_id) {
    process.stdout.write(`Session: ${result.session_id}\n`)
  }
  process.stdout.write(`Consensus runtime: ${result.consensusRuntime.mode}${result.consensusRuntime.mode === 'remote' ? ` (${result.consensusRuntime.baseUrl})` : ''}\n`)
  if (result.consensusResponse?.conversationId) {
    process.stdout.write(`Conversation: ${result.consensusResponse.conversationId}\n`)
  }
  process.stdout.write(`Clarification: ${result.first.questions[0].question}\n`)
  process.stdout.write(`Answer: ${input.answers?.token_type ?? 'tunnel-token'}\n`)
  process.stdout.write(`Schema: ${result.resolved.schemaUri}\n`)
  process.stdout.write(`Descriptor storage: ${result.descriptor.storage.base}${result.descriptor.storage.resourceIdPattern}\n`)
}

function resolveConsensusRuntime(): ConsensusRuntime {
  const baseUrl = process.env.UDFS_CONSENSUS_BASE_URL
  const token = process.env.UDFS_CONSENSUS_TOKEN
  if (baseUrl && token) {
    return {
      mode: 'remote',
      baseUrl,
      auth: 'runtime-token',
    }
  }

  return {
    mode: 'local-fallback',
    auth: 'none',
  }
}

async function resolveConsensusRequest(input: {
  sessionId?: string
  request: string
  tokenType: TokenType
  conversation?: string
}): Promise<ConsensusResult> {
  const runtime = resolveConsensusRuntime()
  if (runtime.mode === 'remote') {
    const remote = await callRemoteConsensus({
      runtime,
      sessionId: input.sessionId,
      request: input.request,
      conversation: input.conversation,
    })
    const parsed = parseRemoteConsensusPayload(remote.body)
    const resolved = coerceResolvedConsensusPayload(parsed)
    if (!resolved) {
      throw new Error('Remote Consensus response did not contain a resolved schema payload')
    }
    return buildConsensusResult({
      runtime,
      sessionId: input.sessionId,
      tokenType: input.tokenType,
      fieldMapping: resolved.fieldMapping,
      confidence: resolved.confidence,
      response: {
        id: remote.id,
        conversationId: remote.conversationId,
        parsed,
      },
    })
  }

  return buildConsensusResult({
    runtime,
    sessionId: input.sessionId,
    tokenType: input.tokenType,
  })
}

async function callRemoteConsensus(input: {
  runtime: Extract<ConsensusRuntime, { mode: 'remote' }>
  sessionId?: string
  request: string
  conversation?: string
}): Promise<{
  id?: string
  conversationId?: string
  body: unknown
}> {
  const token = process.env.UDFS_CONSENSUS_TOKEN
  if (!token) {
    throw new Error('Remote Consensus requires injected UDFS_CONSENSUS_TOKEN')
  }

  const body: Record<string, unknown> = {
    model: process.env.UDFS_CONSENSUS_MODEL ?? 'consensus-modeling',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: input.request,
          },
        ],
      },
    ],
    metadata: {
      product: 'linx',
      purpose: 'pod-storage',
      ...(input.sessionId ? { session_id: input.sessionId } : {}),
    },
  }
  if (input.conversation) {
    body.conversation = input.conversation
  }

  const response = await fetch(`${input.runtime.baseUrl.replace(/\/+$/u, '')}/responses`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  const parsedBody = text ? JSON.parse(text) as Record<string, unknown> : {}
  if (!response.ok) {
    throw new Error(`Remote Consensus request failed: ${response.status} ${text}`)
  }

  return {
    id: typeof parsedBody.id === 'string' ? parsedBody.id : undefined,
    conversationId: extractConversationId(parsedBody),
    body: parsedBody,
  }
}

function extractConversationId(body: Record<string, unknown>): string | undefined {
  if (typeof body.conversation === 'string') return body.conversation
  if (
    body.conversation
    && typeof body.conversation === 'object'
    && 'id' in body.conversation
    && typeof body.conversation.id === 'string'
  ) {
    return body.conversation.id
  }
  return undefined
}

function parseRemoteConsensusPayload(body: unknown): unknown {
  if (isRecord(body) && typeof body.status === 'string') {
    return body
  }

  if (isRecord(body) && typeof body.output_text === 'string') {
    return parseJsonMaybe(body.output_text)
  }

  if (isRecord(body) && Array.isArray(body.output)) {
    for (const item of body.output) {
      if (!isRecord(item) || !Array.isArray(item.content)) continue
      for (const content of item.content) {
        if (!isRecord(content)) continue
        const text = typeof content.text === 'string'
          ? content.text
          : typeof content.output_text === 'string'
            ? content.output_text
            : undefined
        if (!text) continue
        const parsed = parseJsonMaybe(text)
        if (parsed) return parsed
      }
    }
  }

  if (isRecord(body) && Array.isArray(body.choices)) {
    for (const choice of body.choices) {
      if (!isRecord(choice) || !isRecord(choice.message)) continue
      if (typeof choice.message.content !== 'string') continue
      const parsed = parseJsonMaybe(choice.message.content)
      if (parsed) return parsed
    }
  }

  return undefined
}

function coerceResolvedConsensusPayload(payload: unknown): {
  fieldMapping: {
    service: string
    providerId: string
    secretType: string
    label?: string
    status?: string
  }
  confidence?: number
} | null {
  if (!isRecord(payload) || payload.status !== 'resolved') return null
  const schemaUri = stringField(payload, 'schemaUri') ?? stringField(payload, 'uri')
  if (schemaUri !== XPOD_CREDENTIAL.Credential) return null
  if (!isRecord(payload.fieldMapping)) return null

  const service = stringField(payload.fieldMapping, 'service')
  const providerId = stringField(payload.fieldMapping, 'providerId')
  const secretType = stringField(payload.fieldMapping, 'secretType')
  if (!service || !providerId || !secretType) return null

  return {
    fieldMapping: {
      service,
      providerId,
      secretType,
      label: stringField(payload.fieldMapping, 'label'),
      status: stringField(payload.fieldMapping, 'status'),
    },
    confidence: typeof payload.confidence === 'number' ? payload.confidence : undefined,
  }
}

function parseJsonMaybe(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringField(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field]
  return typeof value === 'string' && value.trim() ? value : undefined
}

function buildConsensusResult(input: {
  runtime: ConsensusRuntime
  sessionId?: string
  tokenType: TokenType
  fieldMapping?: {
    service: string
    providerId: string
    secretType: string
    label?: string
    status?: string
  }
  confidence?: number
  response?: ConsensusResult['consensusResponse']
}): ConsensusResult {
  const first: ConsensusResult['first'] = {
    status: 'needs_clarification',
    questions: [
      {
        id: 'token_type',
        question: '这是 Cloudflare API Token 还是 Tunnel Token？',
        options: ['tunnel-token', 'api-token'],
      },
    ],
  }
  const resolved: ConsensusResult['resolved'] = {
    status: 'resolved',
    schemaUri: XPOD_CREDENTIAL.Credential,
    fieldMapping: {
      service: input.fieldMapping?.service ?? 'infra',
      providerId: input.fieldMapping?.providerId ?? 'cloudflare',
      secretType: input.fieldMapping?.secretType ?? input.tokenType,
      label: input.fieldMapping?.label
        ?? defaultCredentialLabel(input.fieldMapping?.providerId ?? 'cloudflare', input.fieldMapping?.secretType ?? input.tokenType),
      status: input.fieldMapping?.status ?? 'active',
    },
    confidence: input.confidence ?? (input.tokenType === 'tunnel-token' ? 0.96 : 0.94),
  }
  const descriptor = podSchema.describe({ uri: resolved.schemaUri })
  if (!descriptor) {
    throw new Error(`Descriptor not found: ${resolved.schemaUri}`)
  }

  return {
    session_id: input.sessionId,
    consensusRuntime: input.runtime,
    consensusResponse: input.response,
    first,
    resolved,
    descriptor: {
      uri: descriptor.uri,
      storage: descriptor.storage,
    },
  }
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  const value = args[index + 1]
  return value && !value.startsWith('--') ? value : undefined
}

function readNumberOption(args: string[], name: string): number | undefined {
  const value = readOption(args, name)
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return Math.floor(parsed)
}

function readConsensusInput(args: string[]): ConsensusInput {
  if (args[0] === 'model') {
    throw new Error('Use: udfs consensus --input \'<json>\'')
  }

  const parsed = readInputPayload(args, 'udfs consensus --input \'<json>\' --json')
  if (!isRecord(parsed)) {
    throw new Error('Consensus input must be a JSON object')
  }

  const request = stringField(parsed, 'request')
    ?? stringField(parsed, 'message')
    ?? stringField(parsed, 'text')
  if (!request) {
    throw new Error('Consensus input requires a non-empty request field')
  }

  const answers = isRecord(parsed.answers) ? parsed.answers : {}
  const tokenTypeText = stringField(answers, 'token_type') ?? stringField(parsed, 'token_type')
  const tokenType = coerceTokenType(tokenTypeText)
  if (tokenTypeText && !tokenType) {
    throw new Error(`Unsupported token type: ${tokenTypeText}`)
  }

  return {
    session_id: stringField(parsed, 'session_id'),
    request,
    answers: tokenType ? { token_type: tokenType } : undefined,
    conversation_id: stringField(parsed, 'conversation_id') ?? stringField(parsed, 'conversation'),
  }
}

function coerceTokenType(value: string | undefined): TokenType | undefined {
  if (value === 'tunnel-token' || value === 'api-token') {
    return value
  }
  return undefined
}

function defaultCredentialLabel(providerId: string, secretType: string): string {
  const providerLabel = providerId
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
  const secretLabel = secretType
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => part.toLowerCase() === 'api' ? 'API' : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
  return `${providerLabel} ${secretLabel}`
}

function readInputPayload(args: string[], usage: string): unknown {
  const raw = readOption(args, '--input')
  if (!raw) {
    throw new Error(`Usage: ${usage}`)
  }
  return JSON.parse(raw) as unknown
}

function writeJson(value: JsonValue | PodStorageValidationResult | unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function printHelp(): void {
  process.stdout.write(`udfs - Undefineds Pod data semantics tool

Usage:
  udfs schema list
  udfs schema search --query <text>
  udfs schema describe <uri>
  udfs schema classes [--uri <uri>]
  udfs schema predicates [--uri <uri>] [--field <field>]
  udfs consensus --input '{"session_id":"sess_123","request":"我要保存这个 Cloudflare token","answers":{"token_type":"tunnel-token"}}' --json
  udfs storage validate --input '<mutation-json>'

Runtime:
  Remote Consensus uses UDFS_CONSENSUS_BASE_URL plus UDFS_CONSENSUS_TOKEN when injected by LinX/linx-lite.
  Do not pass user API keys on the command line.
`)
}

function printConsensusHelp(): void {
  process.stdout.write(`udfs consensus - Ask Consensus how a storage request should be represented

Usage:
  udfs consensus --input '{"session_id":"sess_123","request":"我要保存这个 Cloudflare token","answers":{"token_type":"tunnel-token"}}' --json

Runtime:
  Remote Consensus uses UDFS_CONSENSUS_BASE_URL plus UDFS_CONSENSUS_TOKEN when injected by LinX/linx-lite.
`)
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
