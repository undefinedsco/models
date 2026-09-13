# AI Model Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat AI model type/capability literals with shared RDF class inheritance and URI capability relations, then migrate Xpod consumers without rewriting AI Connections.

**Architecture:** `aiModelSchema` is the shared `SolidSchema` parent. Stable API-contract subclasses use `.extend()` and instantiate resources over the same `/settings/providers/` storage. Capabilities are canonical URI values, while AI Config slots remain workload relations to the `AIModel` parent and enforce capability eligibility in application helpers.

**Tech Stack:** TypeScript, drizzle-solid `SolidSchema`, RDF/Pod resources, Vitest, Bun, React.

---

### Task 1: Lock the shared inheritance contract

**Files:**
- Modify: `tests/ai-runtime-schema.test.ts`
- Create: `tests/ai-model-inheritance.test.ts`

- [ ] Add failing assertions that `ChatModel`, `EmbeddingModel`, `DocumentModel`, `RerankingModel`, image, speech, and video schemas inherit `AIModel`, inherit its common columns, and protect inherited predicates.
- [ ] Add failing assertions that specialized columns live only on their appropriate subclasses, including embedding `dimension` and chat token/context limits.
- [ ] Run `yarn vitest run tests/ai-model-inheritance.test.ts tests/ai-runtime-schema.test.ts` and confirm failures are caused by missing exported schemas/resources.

### Task 2: Implement shared AI model schemas

**Files:**
- Modify: `src/ai-model.schema.ts`
- Modify: `src/namespaces.ts`
- Modify: `src/index.ts`

- [ ] Replace the direct parent `podTable` definition with an exported `aiModelSchema = solidSchema(...)` and instantiate the compatibility `aiModelResource` from it.
- [ ] Define each stable model subclass with `aiModelSchema.extend(...)`, then instantiate resources over the same provider base and SPARQL endpoint.
- [ ] Add canonical class terms to `UDFS`, export inferred row/insert/update types, and retain compatibility aliases only where downstream source currently imports them.
- [ ] Run the focused inheritance/schema tests and confirm they pass.

### Task 3: Replace capability literals with URI semantics

**Files:**
- Modify: `src/ai-model-vocab.ts`
- Modify: `src/ai-model.schema.ts`
- Modify: `src/ai-config/index.ts`
- Modify: `tests/ai-model-vocab.test.ts`
- Modify: `tests/ai-config.test.ts`

- [ ] Write failing tests for canonical capability URIs, legacy literal normalization, deduplication, and workload eligibility checks.
- [ ] Change the durable capability column to a URI array using a semantic `hasCapability` predicate; keep adapter DTO strings at the discovery boundary and map them before Pod writes.
- [ ] Implement compatibility normalization so existing Pod literals remain readable while all new writes use canonical URIs.
- [ ] Add a workload eligibility helper that checks capability requirements independently of the model subclass.
- [ ] Run focused vocab/config tests and confirm they pass.

### Task 4: Keep shared and Xpod-owned AI Config fields separate

**Files:**
- Modify: `src/ai-runtime.schema.ts`
- Modify: `src/namespaces.ts`
- Modify: `tests/ai-runtime-schema.test.ts`
- Create in Xpod: `src/api/ai-config/XpodAiConfigSchema.ts`
- Modify in Xpod: `src/api/ai-config/AiConfigStore.ts`
- Modify in Xpod: `tests/api/ai-config/AiConfigStore.test.ts`

- [ ] Write failing tests proving shared `AIConfig` contains model roles and cross-product document intent but excludes Xpod indexing/backend predicates.
- [ ] Write failing Xpod tests proving product fields round-trip through the same exact configuration subject without redefining shared predicates.
- [ ] Remove Xpod-specific fields from the shared resource and define them in Xpod's product namespace/schema.
- [ ] Update the store to compose shared and product rows into the existing API DTO.
- [ ] Run both repositories' focused AI Config tests.

### Task 5: Migrate existing AI Connections consumption

**Files:**
- Modify in Xpod: `packages/ai-connections/src/ai-connections-client.ts`
- Modify in Xpod: `packages/ai-connections/src/controller.tsx`
- Modify in Xpod: `ui/src/pages/settings/ai-config/AiConfigContext.tsx`
- Modify corresponding existing tests under `packages/ai-connections/test/` and `ui/src/pages/settings/ai-config/`

- [ ] Add failing tests showing the existing AI Connections model catalogue exposes class and canonical capability information without changing provider-management UI behavior.
- [ ] Map existing provider model metadata into shared subclass/capability semantics at the persistence boundary.
- [ ] Filter each AI Config workload selector with the shared eligibility helper while continuing to reuse the current AI Connections list and controller.
- [ ] Run AI Connections interaction tests and AI Config UI tests.

### Task 6: Make the modeling guidance authoritative

**Files:**
- Modify: `skills/solid-modeling/SKILL.md`
- Modify: `README.md`
- Create: `docs/class-capability-role-modeling.md`
- Modify: `plugins/solid-modeling/.codex-plugin/plugin.json` only if the release version changes again
- Modify: `plugins/solid-modeling/.claude-plugin/plugin.json` only if the release version changes again

- [ ] Document the Class/Capability/Role test with positive and negative examples.
- [ ] Document `SolidSchema.extend()` as the required shared subclass mechanism, including predicate protection, multi-level inheritance, and same-resource storage.
- [ ] State that `is-a` uses inheritance, `can-do` uses a URI capability relation, and `used-as` uses a product/config relation.
- [ ] Replace README examples that present `modelType` as durable truth with RDF class examples and a migration note.
- [ ] Run `yarn skills:check` and scan the documentation for contradictory flat-type guidance.

### Task 7: Verify migration and release artifacts

**Files:**
- Modify tests only if a real uncovered regression requires a test-first fix.

- [ ] Run `yarn build`, focused model/config tests, and `yarn test:ci` in a clean dependency environment.
- [ ] Run Xpod `bun run build`, AI Connections tests, AI Config tests, and `bun run test:integration`.
- [ ] Pack the next models release tarball and inspect it for subclass schemas, capability URI helpers, and corrected shared AI Config columns.
- [ ] Run `git diff --check` in both repositories and record any remaining compatibility or live-Pod migration risk.
