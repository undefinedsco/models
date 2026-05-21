import { definePodRepository } from './repository'
import {
  matrixAccountResource,
  matrixEventResource,
  matrixRoomResource,
  type MatrixAccountInsert,
  type MatrixAccountRow,
  type MatrixAccountUpdate,
  type MatrixEventInsert,
  type MatrixEventRow,
  type MatrixEventUpdate,
  type MatrixRoomInsert,
  type MatrixRoomRow,
  type MatrixRoomUpdate,
} from './matrix.schema'

export const matrixAccountRepository = definePodRepository<
  typeof matrixAccountResource,
  MatrixAccountRow,
  MatrixAccountInsert,
  MatrixAccountUpdate
>({
  namespace: 'matrixAccount',
  table: matrixAccountResource,
  searchableFields: ['matrixUserId', 'displayName'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
})

export const matrixRoomRepository = definePodRepository<
  typeof matrixRoomResource,
  MatrixRoomRow,
  MatrixRoomInsert,
  MatrixRoomUpdate
>({
  namespace: 'matrixRoom',
  table: matrixRoomResource,
  searchableFields: ['matrixRoomId', 'canonicalAlias', 'name', 'topic'],
  defaultSort: { field: 'updatedAt', direction: 'desc' },
})

export const matrixEventRepository = definePodRepository<
  typeof matrixEventResource,
  MatrixEventRow,
  MatrixEventInsert,
  MatrixEventUpdate
>({
  namespace: 'matrixEvent',
  table: matrixEventResource,
  searchableFields: ['matrixEventId', 'matrixRoomId', 'type', 'txnId'],
  defaultSort: { field: 'originServerTs', direction: 'asc' },
})

