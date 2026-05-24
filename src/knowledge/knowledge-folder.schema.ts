export type KnowledgeFolderScope = "read" | "contribute";

export const knowledgeFolderSchema = {
  folderId: "uuid",
  owner: "uri",
  storageType: ["solid-pod", "client-local"],
  defaultKnowledgeScope: Boolean
};
