import {
  createRepositoryDescriptor as createDrizzleRepositoryDescriptor,
  initSolidResources,
  initSolidTables,
  type AnyPodResource,
  type AnyPodTable,
  type PodRepositoryOptions as DrizzlePodRepositoryOptions,
} from '@undefineds.co/drizzle-solid'

export {
  type PodRepositoryDescriptor,
  type RepositoryCacheOptions,
  type RepositoryInvalidations,
  type RepositoryScope,
  type SolidDatabase,
} from '@undefineds.co/drizzle-solid'

export { initSolidResources }
export type { AnyPodResource }

type ResourceRepositoryFilter<
  TResource extends AnyPodResource,
  Row extends Record<string, unknown>,
  Filters extends Record<string, unknown>,
> = (
  context: { resource: TResource; filters?: Filters },
) => ReturnType<NonNullable<DrizzlePodRepositoryOptions<TResource, Row, Filters>['filter']>>

export type PodResourceRepositoryOptions<
  TResource extends AnyPodResource,
  Row extends Record<string, unknown> = TResource['$inferSelect'],
  Filters extends Record<string, unknown> = Record<string, unknown>,
> = Omit<DrizzlePodRepositoryOptions<TResource, Row, Filters>, 'table' | 'filter'> & {
  resource: TResource
  filter?: ResourceRepositoryFilter<TResource, Row, Filters>
}

export function createResourceRepositoryDescriptor<
  TResource extends AnyPodResource,
  Row extends Record<string, unknown> = TResource['$inferSelect'],
  Insert = TResource['$inferInsert'],
  Update = TResource['$inferUpdate'],
  Filters extends Record<string, unknown> = Record<string, unknown>,
>(
  options: PodResourceRepositoryOptions<TResource, Row, Filters>,
) {
  const { resource, filter, ...rest } = options
  return createDrizzleRepositoryDescriptor<TResource, Row, Insert, Update, Filters>({
    ...rest,
    table: resource,
    filter: filter
      ? ({ table, filters }) => filter({ resource: table as TResource, filters })
      : undefined,
  })
}

export const definePodRepository = createResourceRepositoryDescriptor

// Compatibility exports for older call sites. New shared-model code should use
// resource names.
export const createRepositoryDescriptor = createDrizzleRepositoryDescriptor
export { initSolidTables }
export type { AnyPodTable }

type PodResourceTemplateTarget = Parameters<typeof import('@undefineds.co/drizzle-solid').extractPodResourceTemplateValue>[0]

export function asPodResourceTemplateTarget(resource: AnyPodResource): PodResourceTemplateTarget {
  return resource as unknown as PodResourceTemplateTarget
}
