import type {
  PodResource,
  PodResourceTarget,
} from '@undefineds.co/drizzle-solid'

type ModelResource = PodResource<any>

export type ModelResourceTarget = PodResourceTarget

/**
 * @deprecated New code should call `resource.buildId(target)` directly.
 */
export function buildModelResourceId(
  resource: ModelResource,
  target: ModelResourceTarget,
): string {
  return resource.buildId(target)
}

/**
 * @deprecated New code should call `resource.buildIri(webIdOrPodUrl, target)` directly.
 */
export function buildModelResourceIri(
  webIdOrPodUrl: string,
  resource: ModelResource,
  target: ModelResourceTarget,
): string {
  return resource.buildIri(webIdOrPodUrl, target)
}

/**
 * @deprecated New code should call `resource.buildIriForDatabase(database, target)` directly.
 */
export function buildModelResourceIriForDatabase(
  database: unknown,
  resource: ModelResource,
  target: ModelResourceTarget,
): string {
  return resource.buildIriForDatabase(database, target)
}

/**
 * @deprecated New code should call `resource.buildIri(...)` and catch only when
 * a nullable result is part of the business contract.
 */
export function resolveModelResourceIri(
  webIdOrPodUrl: string,
  resource: ModelResource,
  target: ModelResourceTarget | null | undefined,
): string | null {
  if (!target) return null
  try {
    return buildModelResourceIri(webIdOrPodUrl, resource, target)
  } catch {
    return null
  }
}

/**
 * @deprecated New code should call `resource.resolveIriForDatabase(database, target)`.
 */
export function resolveModelResourceIriForDatabase(
  database: unknown,
  resource: ModelResource,
  target: ModelResourceTarget | null | undefined,
): string | null {
  if (!target) return null
  try {
    return buildModelResourceIriForDatabase(database, resource, target)
  } catch {
    return null
  }
}
