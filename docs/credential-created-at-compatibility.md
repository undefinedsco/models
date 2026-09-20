# Credential creation timestamps and older Pods

`credentialResource.createdAt` is additive metadata. Credentials written before models 0.2.55 can omit `dcterms:created`; queries must still return those resources. The column therefore remains nullable with `defaultNow()` for new writes. Readers must not invent a creation time for existing credentials.

`tests/credential-created-at-compatibility.test.ts` locks the write default and the optional SPARQL pattern. Xpod's real Local QLever credential repository regression covers both current UI writes and historical documents without this predicate. This change does not relax product-specific requirements for newly issued Gateway client credentials.
