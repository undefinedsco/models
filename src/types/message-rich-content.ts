import type {
  ToolApprovalRichContentItem,
  ToolCallRichContentItem,
  TaskProgressRichContentItem,
} from './collaboration-rich-content.js'

/**
 * Message rich content item kinds stored in `MessageRow.richContent`.
 */
export enum RichContentItemType {
  MAIN_TEXT = 'main_text',
  THINKING = 'thinking',
  IMAGE = 'image',
  CODE = 'code',
  TOOL = 'tool',
  TOOL_APPROVAL = 'tool_approval',
  TASK_PROGRESS = 'task_progress',
  FILE = 'file',
  ERROR = 'error',
  CITATION = 'citation',
}

export interface RichContentModelRef {
  id: string
  name: string
  provider: string
}

export interface BaseRichContentItem {
  type: RichContentItemType
  model?: RichContentModelRef
  metadata?: Record<string, unknown>
}

export interface MainTextRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.MAIN_TEXT
  content: string
  knowledgeBaseIds?: string[]
  citationReferences?: Array<{
    citationItemId?: string
    url?: string
    title?: string
  }>
}

export interface ThinkingRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.THINKING
  content: string
  thinkingDuration?: number
}

export interface CodeRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.CODE
  content: string
  language: string
  executable?: boolean
  executionResult?: {
    output?: string
    error?: string
    exitCode?: number
  }
}

export interface ImageRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.IMAGE
  url?: string
  filePath?: string
  metadata?: BaseRichContentItem['metadata'] & {
    prompt?: string
    negativePrompt?: string
    fileName?: string
    fileSize?: number
    width?: number
    height?: number
  }
}

export interface CitationRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.CITATION
  webSearch?: {
    query: string
    results: Array<{
      title: string
      url: string
      snippet?: string
      favicon?: string
    }>
  }
  knowledge?: Array<{
    id: string
    title: string
    content: string
    source?: string
  }>
}

export interface FileRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.FILE
  fileName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
}

export interface ErrorRichContentItem extends BaseRichContentItem {
  type: RichContentItemType.ERROR
  message: string
  retryable?: boolean
  code?: string
  details?: unknown
}

export type MessageRichContentItem =
  | MainTextRichContentItem
  | ThinkingRichContentItem
  | CodeRichContentItem
  | ImageRichContentItem
  | ToolCallRichContentItem
  | ToolApprovalRichContentItem
  | TaskProgressRichContentItem
  | FileRichContentItem
  | ErrorRichContentItem
  | CitationRichContentItem

export interface LegacyToolInvocation {
  id: string
  toolName: string
  input: unknown
  output?: unknown
  error?: string
}

/**
 * Message.richContent payload.
 */
export interface MessageRichContent {
  thought?: string
  toolInvocations?: LegacyToolInvocation[]
  items?: MessageRichContentItem[]
}

interface LegacyMessageRichContentPayload extends MessageRichContent {
  blocks?: MessageRichContentItem[]
}

function toToolArguments(input: unknown): Record<string, unknown> {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>
  }
  return { value: input }
}

function normalizeLegacyItems(payload: MessageRichContent): MessageRichContentItem[] {
  const items: MessageRichContentItem[] = []

  if (payload.thought) {
    items.push({
      type: RichContentItemType.THINKING,
      content: payload.thought,
    })
  }

  if (payload.toolInvocations) {
    payload.toolInvocations.forEach((toolInvocation) => {
      items.push({
        type: RichContentItemType.TOOL,
        toolCallId: toolInvocation.id,
        toolName: toolInvocation.toolName,
        arguments: toToolArguments(toolInvocation.input),
        status: toolInvocation.error ? 'error' : 'done',
        result: toolInvocation.output,
        error: toolInvocation.error,
      })
    })
  }

  return items
}

export function createRichContentItem<T extends MessageRichContentItem>(
  type: T['type'],
  partial: Omit<T, 'type'>,
): T {
  return {
    type,
    ...partial,
  } as T
}

export function isRichContentItemType<TType extends MessageRichContentItem['type']>(
  item: MessageRichContentItem,
  type: TType,
): item is Extract<MessageRichContentItem, { type: TType }> {
  return item.type === type
}

export function parseMessageRichContent(
  richContent: string | null | undefined,
): MessageRichContent {
  if (!richContent) {
    return { items: [] }
  }

  try {
    const parsed = JSON.parse(richContent) as LegacyMessageRichContentPayload
    const { blocks, items, ...rest } = parsed

    if (Array.isArray(items)) {
      return { ...rest, items }
    }

    if (Array.isArray(blocks)) {
      return { ...rest, items: blocks }
    }

    return {
      ...rest,
      items: normalizeLegacyItems(parsed),
    }
  } catch {
    return { items: [] }
  }
}

export function parseMessageRichContentItems(
  richContent: string | null | undefined,
): MessageRichContentItem[] {
  return parseMessageRichContent(richContent).items ?? []
}

export function serializeMessageRichContent(content: MessageRichContent): string {
  return JSON.stringify(content)
}

export function serializeMessageRichContentItems(items: MessageRichContentItem[]): string {
  return serializeMessageRichContent({ items })
}
