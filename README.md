# LinX Models

`@undefineds.co/models` is the shared Solid Pod data model contract for LinX
apps, desktop, CLI, sidecars, and future workers.

Application shells should use these schemas, repositories, and helpers directly.
Do not duplicate shared predicates, subject templates, Turtle serializers,
resource state machines, or cross-app use-case logic in `apps/*`.

## Package

```bash
yarn workspace @undefineds.co/models build
yarn workspace @undefineds.co/models test
```

```ts
import {
  UDFS,
  agentResource,
  aiModelResource,
  aiProviderResource,
  chatResource,
  contactResource,
  credentialResource,
  messageResource,
  selectAIConfigCredential,
  threadResource,
} from '@undefineds.co/models'
```

## Pi Package

`@undefineds.co/models` is also a Pi package. It exposes the shared
`solid-modeling` skill through the package manifest, so Pi users can install it
from npm or git:

```bash
pi install npm:@undefineds.co/models
```

After installation, Pi can load the skill from `skills/solid-modeling/SKILL.md`.

## Namespaces

LinX-owned predicates and classes use the company namespace:

```text
https://undefineds.co/ns#
```

Use `udfs:` terms in models-level RDF contracts.

## Core Runtime Semantics

The shared chat/runtime model is:

```text
Chat       = who or what the user is talking with
Thread     = the concrete timeline/place/runtime context under a Chat
Message    = a message in both a Chat and a Thread
Session    = one Agent runtime execution bound to Agent + Thread + Workspace
Agent      = executable capability root with its own home/config filesystem
Workspace  = concrete working code area/worktree metadata
Repository = durable source-control metadata, not the working directory
```

Detailed Agent-centered runtime, Repository/Workspace, branch/ref, Agent home,
and Session binding rules live in:

- [`docs/agent-runtime-model.md`](docs/agent-runtime-model.md)

## Agent vs AI Config

`agentResource` and `ai-config` intentionally both mention provider/model, but
they are not the same resource.

`agentResource` answers: which executable actor is this, and what defaults
should it use at runtime?

Current Agent fields include:

```ts
{
  name: string
  description?: string
  avatarUrl?: string
  instructions?: string
  provider?: string
  model?: string
  temperature?: number
  tools?: string[]
  contextRound?: number
  ttsModel?: string
  videoModel?: string
}
```

Agent owns runtime preference and capability state. It should not own shared
API keys, endpoint catalogs, provider model lists, or credential rotation
policy.

`ai-config` answers: which AI services are available, which models belong to a
provider, and which credential should be used for a provider call?

The resources are:

```text
aiProviderResource   /settings/providers/{providerId}.ttl
aiModelResource      /settings/providers/{providerId}.ttl#{modelId}
credentialResource   /settings/credentials.ttl#{credentialId}
```

The separation is:

```text
Agent.provider / Agent.model
  runtime default selection for one Agent

AI Provider
  endpoint/catalog/family metadata such as baseUrl, proxyUrl, defaultModel

AI Model
  provider-provided model metadata linked by isProvidedBy

Credential
  named secret and routing state linked to a provider
```

Credential selection uses the shared helper:

```ts
const selected = selectAIConfigCredential('openai', credentialRows, providerRows)
```

Selection semantics:

- Only active `service = "ai"` credentials with an API key are candidates.
- A credential marked `isDefault` is preferred.
- If multiple defaults exist, the oldest `lastUsedAt` wins.
- If no default exists, credentials rotate by oldest `lastUsedAt`.
- `failCount` and stable id are tie breakers.
- Callers should update `lastUsedAt` after using the selected credential.

This means `ai-config` is a shared service/credential pool. Agent records only
refer to a provider/model default and runtime parameters.

## Contact / Person / Agent

Contact, Person, and Agent are distinct:

```text
Contact = address-book/social projection shown in Contacts and Chat
Person  = natural human identity
Agent   = executable runtime/capability root with an Agent home
```

AI Secretary has both:

```text
Contact
  contactType: agent
  entity: Agent context-root URI

Agent
  root: /agents/__secretary__/
  meta: /agents/__secretary__/.meta
```

External people, services, or bots may appear as Contacts without being LinX
Agents. If something is modeled as an executable LinX Agent, the Agent resource
identity is the context-root container itself.

## Resource Ownership

Use Resource-first names in shared code:

```text
contactResource
chatResource
threadResource
messageResource
agentResource
aiProviderResource
aiModelResource
credentialResource
sessionResource
approvalResource
grantResource
auditResource
inboxNotificationResource
```

`*Table` exports are compatibility aliases for existing drizzle-solid call
sites. New shared model code should prefer `*Resource`.

## Pod Storage Patterns

Representative paths:

```text
/.data/contacts/{contactId}.ttl
/.data/chat/{chatId}/index.ttl#this
/.data/chat/{chatId}/index.ttl#{threadId}
/.data/chat/{chatId}/{yyyy}/{MM}/{dd}/messages.ttl#{messageId}
/agents/{agentId}/
/.data/sessions/{yyyy}/{MM}/{dd}/{sessionId}.ttl
/settings/providers/{providerId}.ttl
/settings/providers/{providerId}.ttl#{modelId}
/settings/credentials.ttl#{credentialId}
```

Schema fields that are RDF relations should store resource URIs, not hidden
`xxxId` foreign keys. Short ids are acceptable at repository/helper boundaries
when the helper derives the canonical URI internally. If a fact must be
queried, synced, approved, audited, or used to reconstruct shared state, model
it as an explicit field or URI relation instead of hiding it in `metadata`.
`metadata` is only for opaque protocol ids, local cache keys, UI state,
compatibility data, and non-structural context. Prefer semantic relation names
such as `chat`, `thread`, `message`, `task`, `delivery`, `session`,
`workspace`, `source`, and `trigger`.

## Design Rules

- Prefer standard RDF vocabularies such as VCARD, FOAF, SIOC, DCTerms,
  Schema.org, LDP, and Solid Chat vocabularies.
- Use `UDFS` only when a standard predicate does not describe the product
  concept.
- Keep UI-only state outside the Pod.
- Put durable shared state in Pod resources owned by this package.
- Add missing query/mutation helpers here before copying storage logic into
  CLI, web, desktop, or plugins.
- Do not store API secrets on Agent, Chat, Thread, Session, or Workspace.
- Do not duplicate repository/Git metadata on Session; keep it on Workspace
  metadata and snapshot it when audit requires reproducibility.

## Development Checklist

When adding or changing a durable model:

1. Add or update the schema/resource in `src/`.
2. Add namespace terms in `src/namespaces.ts` when needed.
3. Export the resource, row, insert, update, and repository/helper from
   `src/index.ts`.
4. Add tests for RDF predicates, subject templates, and cross-app helper
   semantics.
5. Update this README or the focused document under `docs/`.

## References

- [Solid Protocol](https://solidproject.org/TR/protocol)
- [Linked Data Platform](https://www.w3.org/TR/ldp/)
- [WebID Profile](https://www.w3.org/2005/Incubator/webid/spec/)
- [VCARD RDF](https://www.w3.org/TR/vcard-rdf/)
- [FOAF Vocabulary](http://xmlns.com/foaf/spec/)
- [SIOC Ontology](http://rdfs.org/sioc/spec/)
- [Dublin Core Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/)
- [Schema.org](https://schema.org/)
