# Agent Runtime Model

This document defines the durable Pod semantics for LinX agent runtime state.
It is the shared models-level contract for app, CLI, desktop, sidecar, and
future workers. UI shells must not redefine these relationships locally.

## Core Principle

LinX uses an Agent-centered runtime model.

```text
Agent owns capability.
Thread owns the chat sub-timeline.
Repository owns source-control metadata.
Workspace owns the concrete working code area.
Session binds Agent + Thread + Workspace for one runtime execution.
```

The important correction is that rules, skills, MCP, backend, and compaction
belong to the Agent, not to a filesystem folder. A workspace/worktree can
contribute rule sources such as `AGENTS.md`, but the Agent's loader decides how
to read, merge, and snapshot them.

Runtime sessions still distinguish workspaces. The same Agent home can run in
different repositories, workspaces/worktrees, branches, or cwd values across
sessions. The workspace/worktree is an execution binding, not the owner of Agent
capability.

## Resource Ownership

### Agent

An Agent is a durable actor/capability root in the Pod. Every Agent must have an
Agent home container. LinX no longer supports executable Agents without an
Agent filesystem/home.

```text
/.data/agents/{agentId}/
  index.ttl#this
  .meta
  profile/card
  config/
  rules/
  skills/
  mcp/
  backends/
  compaction/
  memory/
  snapshots/
```

Agent home owns:

- rules loading policy
- enabled skills
- MCP profile
- backend profiles and defaults
- compaction policy
- durable memory/index state
- effective runtime snapshots

The Agent resource identity is `index.ttl#this` inside the context-root
container, for example `/.data/agents/__secretary__/index.ttl#this`. A Solid
`.meta` document may describe that container, but `.meta` is not the Agent
identity.

### Contact / Person / Agent

Contact, Person, and Agent must remain distinct.

Contact is the address-book/social projection: the object a user sees in
Contacts and Chat lists. It answers "who or what am I talking to". Contact is
the user's relationship/card for an entity; it is not necessarily the entity's
canonical identity.

Person is a natural human identity. A Person may have a WebID/profile and may
be represented by one or more Contacts in different users' Pods.

Agent is the executable runtime/capability root: the object that owns rules,
skills, MCP, backend, compaction, memory, and snapshots. It answers "what can
execute work".

AI Secretary has both a Contact projection and an Agent identity:

```text
Contact
  type: AgentContact
  display name: AI Secretary
  links to Agent context-root URI

Agent
  id: /.data/agents/__secretary__/index.ttl#this
  root: /.data/agents/__secretary__/
  meta: /.data/agents/__secretary__/.meta
  owns runtime capability/config
```

Humans usually have Person identity plus Contact projection. They do not get
Agent home containers unless they are also executable LinX Agents.

External people, services, or bots can appear as Contact projections without
being LinX Agents. If something is modeled as an Agent in LinX, it must have an
Agent home container and owned runtime filesystem state.

Recommended rule:

```text
Contact is for relationship and UI discoverability.
Person is for human identity.
Agent is for execution capability and owned runtime state.
```

This allows the Contacts module to group people, AI agents, organizations, and
groups, while keeping Agent runtime configuration under Agent home.

### Thread

Thread is the chat refinement concept: a concrete sub-timeline/place under a
Chat. It answers "which run/timeline/place does this message belong to".

Thread does not own rules, skills, MCP, backend, or compaction.

### Repository

Repository is a durable Pod resource representing source-control metadata. It
is not the working code area and does not need a product management page in the
first version. Use an internal Pod resource URI as the subject, not the GitHub
URL or local filesystem path.

Recommended shape:

```text
/.data/repositories/{repositoryId}.ttl
```

The repository resource may store:

- display name
- provider/origin metadata in its metadata fields
- remote URL(s) as literal metadata values
- default branch name as a literal
- content identity/fingerprint if available

Do not use a GitHub URL as the repository subject. A repository can be private,
local-only, cloned by SSH, moved between remotes, or have multiple remotes.
Store GitHub/GitLab/local origin details inside the Repository resource
metadata instead.

Repository is for identity and metadata, not navigation. Product surfaces should
normally open Workspace, not Repository.

Example Repository metadata:

```text
provider        "github"
owner           "undefinedsco"
name            "LinX"
primaryRemote   "git@github.com:undefinedsco/LinX.git"
webUrl          "https://github.com/undefinedsco/LinX"
defaultBranch   "main"
remotes         [{ name: "origin", url: "..." }]
```

### Workspace / Worktree

Workspace is the concrete working code area that a runtime can operate on. In
Git-backed coding flows, Workspace is usually a worktree/checkout. It is
separate from Repository because one repository can have many workspaces,
worktrees, branches, paths, and dirty states.

Recommended shape:

```text
/.data/workspaces/{workspaceId}/
  .meta
```

Workspace should be modeled as a container resource. The workspace WebID/URI is
the container URI itself. Its metadata belongs in `.meta`, which is the Solid
container metadata document.

The Workspace `.meta` should link to the Repository metadata resource and store:

- local path/cwd as literal values
- current branch/ref as snapshot literal values
- current commit SHA as literal value
- dirty state
- runtime-safe workspace metadata

Workspace URI should be an internal Pod container URI. Local paths are
machine-local facts and should be literals, not resource identities.

### Session

Session is one Agent runtime execution. It should be light.

Session should reference:

- Agent context-root URI
- Thread URI
- Workspace URI

Session should snapshot, not explode, Agent internals. Do not hang every rules,
skills, MCP, backend, or compaction file from Session as individual relations.
The Agent context root is the Agent resource URI. Do not derive identity from
the `.meta` storage document.

Recommended Session fields:

```text
agent                      Agent context-root URI
thread                     Thread URI
workspace                  Workspace URI
workspaceSnapshot          optional Workspace metadata snapshot URI/hash
effectiveConfigHash        literal hash
effectiveConfigSnapshot    optional Agent-owned snapshot URI
status                     runtime lifecycle state
```

Session should not duplicate repository or Git metadata such as GitHub URL,
branch, commit SHA, cwd, owner, dirty state, or default branch. Those belong to
Workspace metadata. If a Session needs reproducible audit, record a
`workspaceSnapshot` URI/hash that points to the Workspace metadata snapshot used
at launch/completion.

## Branch / Ref Modeling

Branch should be recorded on Workspace metadata, but it should not be a
first-class URI by default.

Git branches are mutable refs inside a repository. They are usually better
stored as literals on Workspace snapshots:

```text
branchRef   "refs/heads/feat/login-experience-v2"
branchName  "feat/login-experience-v2"
startCommit "ac968f9..."
endCommit   "..."
```

Always record the commit SHA when recording a branch. The branch name is a
mutable convenience; the commit SHA is the reproducible source identity. This is
Workspace metadata, not Session metadata.

Detached HEAD case:

```text
branchRef   null
branchName  null
startCommit "..."
```

Upgrade branch/ref to a Pod URI only if the product needs to attach durable
state to the ref itself across sessions, for example branch-level review
history, ownership, policy, or release readiness.

If upgraded later, model it as a repository-owned resource, not as a global URL:

```text
/.data/repositories/{repositoryId}.ttl#ref-{encodedRefName}
```

or:

```text
/.data/repositories/{repositoryId}/refs/{encodedRefName}.ttl
```

Until that need exists, literals are simpler and more correct.

## Namespace Rule

Custom predicates and classes must use the company namespace:

```text
https://undefineds.co/ns#
```

Use `udfs:` terms in models-level RDF contracts.

Example predicates:

```text
udfs:agent
udfs:repository
udfs:workspace
udfs:branchRef
udfs:branchName
udfs:startCommit
udfs:endCommit
udfs:workspaceSnapshot
udfs:effectiveConfigHash
udfs:effectiveConfigSnapshot
```

Actual Pod resource subjects should be user-owned Pod URLs, for example:

```text
</.data/agents/__secretary__/index.ttl#this>
</.data/repositories/linx.ttl>
</.data/workspaces/linx-feature-login/>
</.data/sessions/2026/05/14/sess-123.ttl>
```

The namespace identifies predicate semantics. The Pod URL identifies the user's
resource instance. Do not confuse the two.

## Example

```ttl
<#sess-123>
  a udfs:Session ;
  udfs:agent </.data/agents/__secretary__/index.ttl#this> ;
  udfs:inThread </.data/chat/chat-1/index.ttl#thread-1> ;
  udfs:workspace </.data/workspaces/linx-feature-login/> ;
  udfs:workspaceSnapshot </.data/workspaces/linx-feature-login/snapshots/2026-05-13T120000Z.ttl> ;
  udfs:effectiveConfigHash "sha256:..." ;
  udfs:effectiveConfigSnapshot </.data/agents/__secretary__/snapshots/2026-05-13T120000Z.ttl> .
```

This keeps Session light and replayable: it references the Agent and the
Workspace, and optionally records snapshot pointers for audit. Repository and
Git metadata are reached through the Workspace metadata instead of being
duplicated on every Session.
