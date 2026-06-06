import { DCTerms, SIOC, UDFS } from '../namespaces'

export const ThreadVocab = {
  scope: UDFS.inScope,
  chat: SIOC.has_parent,
  task: UDFS.task,
  title: DCTerms.title,
  starred: UDFS.favorite,
  metadata: UDFS.metadata,
  createdAt: DCTerms.created,
  updatedAt: DCTerms.modified,

  // Execution context: workspace URI for the runnable root
  workspace: UDFS.workspace,

  // Type marker (for SPARQL convenience)
  type: SIOC.Thread,
} as const
