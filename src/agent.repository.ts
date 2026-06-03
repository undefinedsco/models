import { definePodRepository } from './repository'
import { agentResource, type AgentRow, type AgentInsert, type AgentUpdate } from './agent.schema'

export const agentRepository = definePodRepository<
  typeof agentResource,
  AgentRow,
  AgentInsert,
  AgentUpdate
>({
  namespace: 'agent',
  resource: agentResource,
  searchableFields: ['name', 'description', 'instructions'],
})
