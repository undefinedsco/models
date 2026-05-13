# LinX Data Model Diagram

This diagram summarizes the current shared model contract in
`@undefineds.co/models`. The authoritative field definitions remain in `src/*`.

## Runtime Graph

```text
┌──────────────┐
│   Contact    │
│ relationship │
│ projection   │
└──────┬───────┘
       │ entityUri
       ▼
┌──────────────┐        ┌──────────────┐
│    Agent     │        │    Person    │
│ executable   │        │ human id     │
│ capability   │        └──────────────┘
└──────┬───────┘
       │ owns defaults/capability
       ▼
/.data/agents/{agentId}/
  profile.ttl
  config/
  rules/
  skills/
  mcp/
  backends/
  compaction/
  memory/
  snapshots/
```

Contact is the visible address-book/chat projection. Agent is the executable
runtime root. A Contact can point to an Agent, but it is not the Agent itself.

## Chat Graph

```text
┌──────────────┐
│     Chat     │  who/what the user is talking with
│ #this        │
└──────┬───────┘
       │ has child timeline/place
       ▼
┌──────────────┐
│    Thread    │  concrete timeline/runtime/workspace place
│ #{threadId}  │
└──────┬───────┘
       │ contains messages
       ▼
┌──────────────┐
│   Message    │  belongs to both Chat and Thread
│ #{messageId} │
└──────────────┘
```

Important relation rules:

- `message.chat` is a URI relation to the Chat resource.
- `message.thread` is a URI relation to the Thread resource.
- `message.maker` is the author entity URI, for example a user WebID, Agent URI,
  or external Contact URI.
- `chatId` and `threadId` can exist as UI/helper parameters, but persistent RDF
  links should use `chat` and `thread` URI fields.

Representative storage:

```text
/.data/chat/{chatId}/index.ttl#this
/.data/chat/{chatId}/index.ttl#{threadId}
/.data/chat/{chatId}/{yyyy}/{MM}/{dd}/messages.ttl#{messageId}
```

## Session / Workspace / Repository

```text
┌──────────────┐
│   Session    │ one runtime execution
└──────┬───────┘
       │ references
       ├────────► Agent profile URI
       ├────────► Thread URI
       └────────► Workspace URI

┌──────────────┐        ┌──────────────┐
│  Workspace   │ ─────► │ Repository   │
│ worktree/cwd │ link   │ source meta  │
└──────────────┘        └──────────────┘
```

Session is intentionally light. It should not duplicate Git remote, branch,
commit, cwd, dirty state, or repository metadata. Those belong to Workspace
metadata. A Session may point to a Workspace snapshot when reproducibility is
needed.

Representative storage:

```text
/.data/sessions/{yyyy}/{MM}.ttl#{sessionId}
/.data/workspaces/{workspaceId}/
/.data/workspaces/{workspaceId}/.meta
/.data/repositories/{repositoryId}.ttl
```

## AI Service Configuration

```text
┌──────────────┐
│    Agent     │
│ provider     │ runtime default provider id
│ model        │ runtime default model id
└──────┬───────┘
       │ selects from shared pool
       ▼
┌──────────────┐        ┌──────────────┐
│ AI Provider  │ ─────► │   AI Model   │
│ endpoint     │        │ provider set │
└──────┬───────┘        └──────────────┘
       │
       ▼
┌──────────────┐
│ Credential   │ named secret, default flag, rotation state
└──────────────┘
```

Agent and AI service configuration are separate:

- Agent stores runtime preference and capability settings.
- Provider stores endpoint/catalog metadata.
- Model stores provider-scoped model metadata.
- Credential stores API secret and routing state.

Credential selection is centralized in `selectAIConfigCredential`:

- Prefer active `service = "ai"` credentials marked `isDefault`.
- If no default exists, rotate by oldest `lastUsedAt`.
- Use `failCount` and stable id as tie breakers.
- Callers update `lastUsedAt` after a credential is used.

Representative storage:

```text
/settings/ai/providers.ttl#{providerId}
/settings/ai/models/{providerId}.ttl#{modelId}
/settings/credentials.ttl#{credentialId}
```

## Resource Ownership Rule

Shared durable semantics live in this package. App, CLI, desktop, sidecar, and
plugin code should call the exported resources, repositories, and helpers rather
than redefining storage predicates or Pod paths locally.
