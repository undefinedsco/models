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
       │ about
       ▼
┌──────────────┐        ┌──────────────┐
│    Agent     │        │    Person    │
│ executable   │        │ human id     │
│ capability   │        └──────────────┘
└──────┬───────┘
       │ owns defaults/capability
       ▼
/agents/{agentKey}/
  .meta
  system/
  user/
  rules/
  skills/
  mcp/
  backends/
  compaction/
  memory/
  snapshots/
```

Contact is the visible address-book/chat projection. Agent is the executable
runtime context root. A Contact can point to an Agent, but it is not the Agent
itself. The Agent resource identity is the container root, for example
`/agents/__secretary__/`; `.meta` is only the storage document describing that
container.

## Chat Graph

```text
┌──────────────┐
│ Chat / Task  │  parent command surface
│ #this / #task│
└──────┬───────┘
       │ sioc:has_parent
       ▼
┌──────────────┐
│    Thread    │  concrete timeline/runtime/workspace place
│ #{threadId}  │
└──────┬───────┘
       │ contains messages
       ▼
┌──────────────┐
│   Message    │  belongs to Chat and optionally Thread
│ #{messageId} │
└──────────────┘
```

Important relation rules:

- `thread.parent` is a URI relation using the standard `sioc:has_parent` predicate.
- `message.chat` is a URI relation to the Chat resource when the message is chat-scoped.
- `message.thread` is a URI relation to the Thread resource when it participates in a concrete timeline.
- `message.maker` is the author resource IRI, for example a user WebID, Agent URI,
  or external Contact URI.
- `chatId` and `threadId` can exist as UI/helper parameters, but persistent RDF
  links should use `parent`, `chat`, and `thread` URI fields.

Representative storage:

```text
/.data/chat/{chatId}/index.ttl#this
/.data/chat/{chatId}/index.ttl#{threadId}
/.data/task/{taskId}/index.ttl#{threadId}
/.data/chat/{chatId}/{yyyy}/{MM}/{dd}/messages.ttl#{messageId}
```

## Session / Workspace / Repository

```text
┌──────────────┐
│   Session    │ lightweight lifecycle projection
└──────┬───────┘
       │ references
       ├────────► Owner WebID / Agent URI
       ├────────► optional Chat URI
       └────────► Thread URI

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│     Run      │ ─────► │  Workspace   │ ─────► │ Repository   │
│ execution    │ link   │ worktree/cwd │ link   │ source meta  │
└──────────────┘        └──────────────┘        └──────────────┘
```

Session is intentionally light. It should not duplicate Git remote, branch,
commit, cwd, dirty state, or repository metadata. Those belong to Workspace
metadata. Concrete execution attempts, workspace binding, lease/heartbeat, and
external runtime ids belong to Run.

Representative storage:

```text
/.data/sessions/{yyyy}/{MM}/{dd}/{sessionId}.ttl
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
/settings/providers/{providerId}.ttl
/settings/providers/{providerId}.ttl#{modelId}
/settings/credentials.ttl#{credentialId}
```

## Resource Ownership Rule

Shared durable semantics live in this package. App, CLI, desktop, sidecar, and
plugin code should call the exported resources, repositories, and helpers rather
than redefining storage predicates or Pod paths locally.
