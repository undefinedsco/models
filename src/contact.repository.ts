import { definePodRepository } from './repository'
import { contactResource, type ContactRow, type ContactInsert, type ContactUpdate } from './contact.schema'

export const contactRepository = definePodRepository<
  typeof contactResource,
  ContactRow,
  ContactInsert,
  ContactUpdate
>({
  namespace: 'contact',
  table: contactResource,
  searchableFields: ['name', 'alias', 'note'],
  defaultSort: { field: 'name', direction: 'asc' },
})
