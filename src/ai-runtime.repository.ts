import { credentialResource, type CredentialInsert, type CredentialRow, type CredentialUpdate } from './credential.schema'

export type AiRuntimeDeployment = 'local' | 'cloud' | string

export interface AiRuntimeCredentialTargetInput {
  deployment: AiRuntimeDeployment
  provider: string
}

export interface AiRuntimeCredentialUpsertInput {
  deployment: AiRuntimeDeployment
  provider: string
  values: Partial<CredentialInsert> & Record<string, unknown>
}

export interface AiRuntimeCredentialDb {
  findById<T = unknown>(resource: typeof credentialResource, id: string): Promise<T | null>
  updateById<T = unknown>(
    resource: typeof credentialResource,
    id: string,
    patch: Partial<CredentialUpdate> & Record<string, unknown>,
  ): Promise<T | null>
  insert(resource: typeof credentialResource): {
    values(value: CredentialInsert & Record<string, unknown>): {
      execute(): Promise<unknown[]>
    }
  }
}

export function buildAiRuntimeCredentialTarget(input: AiRuntimeCredentialTargetInput): { id: string } {
  return {
    id: `${normalizeCredentialKeyPart(input.deployment)}-${normalizeCredentialKeyPart(input.provider)}`,
  }
}

export function buildAiRuntimeCredentialId(input: AiRuntimeCredentialTargetInput): string {
  return credentialResource.buildId(buildAiRuntimeCredentialTarget(input))
}

export function buildAiRuntimeCredentialIri(
  webIdOrPodUrl: string,
  input: AiRuntimeCredentialTargetInput,
): string {
  return credentialResource.buildIri(webIdOrPodUrl, buildAiRuntimeCredentialTarget(input))
}

export async function getAiRuntimeProviderCredential<TRow = CredentialRow>(
  db: Pick<AiRuntimeCredentialDb, 'findById'>,
  input: AiRuntimeCredentialTargetInput,
): Promise<TRow | null> {
  return db.findById<TRow>(credentialResource, buildAiRuntimeCredentialId(input))
}

export async function upsertAiRuntimeProviderCredential<TRow = CredentialRow>(
  db: AiRuntimeCredentialDb,
  input: AiRuntimeCredentialUpsertInput,
): Promise<TRow> {
  const id = buildAiRuntimeCredentialId(input)
  const existing = await db.findById<TRow>(credentialResource, id)
  const values = {
    ...input.values,
    id,
    provider: normalizeCredentialKeyPart(input.provider),
    service: typeof input.values.service === 'string' ? input.values.service : 'ai',
  } as CredentialInsert & Record<string, unknown>
  if (existing) {
    const updated = await db.updateById<TRow>(credentialResource, id, values)
    return (updated ?? { ...existing as Record<string, unknown>, ...values }) as TRow
  }
  await db.insert(credentialResource).values(values).execute()
  return values as TRow
}

export const aiRuntimeRepository = {
  credentialTarget: buildAiRuntimeCredentialTarget,
  credentialId: buildAiRuntimeCredentialId,
  credentialIri: buildAiRuntimeCredentialIri,
  getProviderCredential: getAiRuntimeProviderCredential,
  upsertProviderCredential: upsertAiRuntimeProviderCredential,
}

function normalizeCredentialKeyPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]+/gu, '-').replace(/^-+|-+$/gu, '')
  if (!normalized) {
    throw new Error('AI runtime credential target requires a non-empty deployment and provider')
  }
  return normalized
}
