import {
  initSolidTables,
  type AnyPodTable,
} from '@undefineds.co/drizzle-solid'

export {
  createRepositoryDescriptor,
  definePodRepository,
  type PodRepositoryDescriptor,
  type RepositoryCacheOptions,
  type RepositoryInvalidations,
  type RepositoryScope,
  type SolidDatabase,
} from '@undefineds.co/drizzle-solid'

export { initSolidTables }
export type { AnyPodTable }

// Resource-first aliases for shared Solid model call sites. The underlying
// drizzle-solid API still uses table-shaped arguments for compatibility.
export const initSolidResources = initSolidTables
export type AnyPodResource = AnyPodTable
