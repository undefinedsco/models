/**
 * AI model modality and capability vocabulary.
 *
 * Single source of truth shared by the catalog, the applet and host apps.
 * Naming follows models.dev (modalities + tool_call/reasoning); `web` is an
 * undefineds extension for provider-side web search.
 */

export const AI_MODEL_MODALITIES = ['text', 'image', 'audio', 'video', 'pdf'] as const
export type AIModelModality = (typeof AI_MODEL_MODALITIES)[number]

export const AI_MODEL_CAPABILITIES = ['tool_call', 'reasoning', 'web'] as const
export type AIModelCapability = (typeof AI_MODEL_CAPABILITIES)[number]

const modalitySet: ReadonlySet<string> = new Set(AI_MODEL_MODALITIES)
const capabilitySet: ReadonlySet<string> = new Set(AI_MODEL_CAPABILITIES)

export function isAIModelModality(value: unknown): value is AIModelModality {
  return typeof value === 'string' && modalitySet.has(value)
}

export function isAIModelCapability(value: unknown): value is AIModelCapability {
  return typeof value === 'string' && capabilitySet.has(value)
}

export function filterAIModelModalities(value: unknown): AIModelModality[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isAIModelModality))]
}

export function filterAIModelCapabilities(value: unknown): AIModelCapability[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isAIModelCapability))]
}
