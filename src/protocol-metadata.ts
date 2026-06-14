export type ProtocolMetadataRecord = Record<string, unknown>

export const PROTOCOL_METADATA_KEY = 'protocols'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function withoutUndefined(values: ProtocolMetadataRecord): ProtocolMetadataRecord {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  )
}

/**
 * Read opaque API/protocol metadata from `metadata.protocols.<namespace>`.
 *
 * Use this for adapter ids such as Matrix room/event/txn ids or ChatKit
 * chat/thread ids. Shared RDF relations and promoted runtime ids should remain
 * explicit schema fields instead.
 */
export function getProtocolMetadata(
  metadata: ProtocolMetadataRecord | null | undefined,
  namespace: string,
): ProtocolMetadataRecord | undefined {
  if (!metadata) return undefined

  const protocols = metadata[PROTOCOL_METADATA_KEY]
  if (!isRecord(protocols)) return undefined

  const value = protocols[namespace]
  return isRecord(value) ? value : undefined
}

/**
 * Merge opaque API/protocol metadata into `metadata.protocols.<namespace>`.
 * Undefined values are omitted; null is retained for explicit protocol
 * round-trip state.
 */
export function withProtocolMetadata(
  metadata: ProtocolMetadataRecord | null | undefined,
  namespace: string,
  values: ProtocolMetadataRecord,
): ProtocolMetadataRecord {
  const base = metadata ?? {}
  const protocols = isRecord(base[PROTOCOL_METADATA_KEY])
    ? base[PROTOCOL_METADATA_KEY] as ProtocolMetadataRecord
    : {}
  const current = isRecord(protocols[namespace])
    ? protocols[namespace] as ProtocolMetadataRecord
    : {}

  return {
    ...base,
    [PROTOCOL_METADATA_KEY]: {
      ...protocols,
      [namespace]: {
        ...current,
        ...withoutUndefined(values),
      },
    },
  }
}

/**
 * Remove root-level API projection keys before persisting durable metadata.
 * This keeps API response shapes such as `chat_id` at the adapter boundary
 * while storing the canonical copy under `metadata.protocols.<namespace>`.
 */
export function withoutProtocolProjectionKeys(
  metadata: ProtocolMetadataRecord | null | undefined,
  keys: readonly string[],
): ProtocolMetadataRecord | undefined {
  if (!metadata) return undefined

  const result = { ...metadata }
  for (const key of keys) {
    delete result[key]
  }

  return Object.keys(result).length > 0 ? result : undefined
}
