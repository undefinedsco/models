const ABSOLUTE_IRI = /^[a-zA-Z][a-zA-Z\d+.-]*:/

declare const baseRelativeResourceIdBrand: unique symbol
declare const resourceIriBrand: unique symbol

export type BaseRelativeResourceId = string & {
  readonly [baseRelativeResourceIdBrand]: true
}

export type ResourceIri = string & {
  readonly [resourceIriBrand]: true
}

export interface RowWithResourceId {
  id: BaseRelativeResourceId
}

export type ResourceRow<T extends { id: string }> = T & {
  id: BaseRelativeResourceId
}

export type ResourceInsert<T extends { id?: string }> = T

export type ResourceUpdate<T extends { id?: string | null }> = T

export function isResourceIri(value: string | null | undefined): value is ResourceIri {
  return typeof value === 'string' && ABSOLUTE_IRI.test(value)
}

export function isBaseRelativeResourceId(value: string | null | undefined): value is BaseRelativeResourceId {
  return (
    typeof value === 'string'
    && value.length > 0
    && !isResourceIri(value)
    && !value.startsWith('/')
    && !value.startsWith('./')
    && !value.startsWith('../')
  )
}

export function asResourceIri(value: string, label = 'resource IRI'): ResourceIri {
  if (!isResourceIri(value)) {
    throw new Error(`${label} must be an absolute IRI.`)
  }
  return value
}

export function asBaseRelativeResourceId(
  value: string,
  label = 'resource id',
): BaseRelativeResourceId {
  if (!isBaseRelativeResourceId(value)) {
    throw new Error(`${label} must be a base-relative resource id, not a full RDF subject IRI.`)
  }
  return value
}

export function requireRowResourceId(
  row: { id?: string | null } | null | undefined,
  label = 'row',
): BaseRelativeResourceId {
  if (!row?.id) {
    throw new Error(`${label} is missing row.id.`)
  }
  return asBaseRelativeResourceId(row.id, `${label}.id`)
}
