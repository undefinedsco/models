# Class, Capability, and Product Role Modeling

This guide defines how shared Solid models distinguish semantic identity,
composable abilities, and product configuration. It prevents flat discriminator
fields and product workload names from becoming an accidental shared ontology.

## The three questions

| Layer | Question | Representation | AI example |
|---|---|---|---|
| Class | What is this resource? | RDF class and `SolidSchema.extend()` | `ChatModel` is an `AIModel` |
| Capability | What can it do? | URI-valued `hasCapability` relation | vision, OCR, tool calling |
| Role | How is it used here? | config relation pointing to a model | `AIConfig.ocrModel` |

These layers are intentionally independent. A resource has one or more semantic
classes, can advertise several capabilities, and can fill several product roles.

## When to use inheritance

Use a subclass when the relationship is a stable, cross-product `is-a`
statement and the child may own fields or constraints that do not apply to every
parent instance.

```ts
export const aiModelSchema = solidSchema('AIModel', {
  id: id('id'),
  displayName: string('name'),
  capabilities: uri('hasCapability').array(),
})

export const embeddingModelSchema = aiModelSchema.extend('EmbeddingModel', {
  dimension: integer('dimension'),
})
```

This expresses that every `EmbeddingModel` is also an `AIModel`. Shared columns
are inherited; embedding-only data is not added as an optional field to every
other model kind.

Do not use a literal `modelType` as the authoritative persisted discriminator
when RDF classes already express the distinction. API adapters may expose a
legacy string for compatibility, but must translate it at the persistence
boundary.

## When to use capabilities

Use a capability URI when an ability can vary independently from the resource's
class or combine with other abilities.

```text
qwen-vl-max
  rdf:type          udfs:ChatModel
  udfs:hasCapability udfs:VisionCapability
  udfs:hasCapability udfs:OCRCapability
```

Qwen-VL is still a chat model. Vision and OCR describe what it can do; they do
not replace its semantic class. The same rule applies to reasoning, web access,
tool calling, structured output, and document understanding.

Capability values are resource URIs, not unscoped strings. A UI can display
`vision` or `ocr`, while the shared Pod representation remains unambiguous and
extensible.

## When to use configuration roles

A role names a workload selection, not a new kind of model:

```text
AIConfig
  chatModel       -> qwen-vl-max
  ocrModel        -> qwen-vl-max
  embeddingModel  -> text-embedding-v4
  indexerModel    -> another eligible model
```

`ocrModel`, `readerModel`, and `indexerModel` answer “which model should this
workload use?” They must not imply that the selected resource is a chat model or
create shared classes named after product pipeline stages. Selection code checks
the candidate's class and capabilities to determine eligibility.

## Ownership boundary

Being stored in a Pod does not automatically make a setting shared.

Shared models own semantics reused by multiple products:

- AI model subclasses;
- canonical capability resources and predicates;
- provider/model relationships;
- reusable model assignment and document-processing policy.

The product owns operational behavior specific to itself:

- FTS5 and vector-index enablement;
- progressive or automatic indexing;
- local text/vector backend selection;
- product migration status and progress.

Product-owned settings may still live in the user's Pod, but use the product's
namespace and schema. A product store can compose the shared config resource and
its own policy resource into one UI DTO without moving product semantics into
`@undefineds.co/models`.

## Decision procedure

For every proposed field or discriminator:

1. Complete the sentence “X is a Y.” If it remains true across products and has
   useful child-specific semantics, model Y as a subclass with `extend()`.
2. Complete “X can do Y.” If Y composes independently, model it as a capability
   URI relation.
3. Complete “this product uses X as Y.” Model Y as a configuration relation;
   keep it product-owned unless the role is genuinely shared.
4. If none apply, determine whether the value is adapter metadata, runtime
   state, or UI-only state instead of adding it to the shared ontology.

## Common mistakes

- `modelType: "embedding"` as the only durable type: use
  `rdf:type udfs:EmbeddingModel`.
- `OCRModel` solely because a chat model can read images: keep `ChatModel` and
  add `OCRCapability` or `DocumentUnderstandingCapability`.
- `IndexerModel` solely because Xpod selected it for indexing: keep the actual
  model class and point `AIConfig.indexerModel` to it.
- Moving Xpod's VEC/FTS5 switches into the shared package because they are
  stored in a Pod: persistence location does not change semantic ownership.
