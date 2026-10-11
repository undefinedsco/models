# Addressable file metadata and reader coverage Notes

`@undefineds.co/models/file-reader-notes` remains the pure constants/types entry.
`@undefineds.co/models/file-reader-notes.schema` exports the two ORM resources,
repository descriptors and input-to-insert shape adapters. Both resources use
`UDFS.Note`, the canonical predicates, and the existing `/.data/` storage base.
They intentionally have no default id or subject template. `noteKind` expresses
classification; filenames and path segments never determine the Note kind.

For persisted Notes, caller-supplied `subject` must be a full HTTP(S) IRI with
an optional fragment. The shape adapters preserve it verbatim as ORM `id`.
`about` is a separately supplied absolute URI (including URN) using `sioc:about`.
It neither selects a container nor changes the subject. Existing content
serializers can still serialize blank/URN subjects; those do not identify
addressable Pod documents and cannot be used by these CRUD shape adapters.

```ts
import { drizzle } from '@undefineds.co/drizzle-solid'
import { fileMetadataNoteResource, fileMetadataNoteValues } from '@undefineds.co/models/file-reader-notes.schema'

const db = drizzle(session)
const values = fileMetadataNoteValues(input) // input.subject and input.about supplied by caller
await db.insert(fileMetadataNoteResource).values(values).execute()
const row = await db.findByIri(fileMetadataNoteResource, input.subject)
await db.updateByIri(fileMetadataNoteResource, input.subject, { description: 'Updated' })
await db.deleteByIri(fileMetadataNoteResource, input.subject)
```

A base-relative id supplied directly to the ORM is relative to the resource's
`/.data/` base. Do not feed an already relative path into the `subject` adapter:
its contract is a complete persisted IRI, and it does not derive a Pod URL.
Use exact IRI APIs rather than treating `where(id)` as exact addressing.

`fileMetadataNoteRepository` and `readerCoverageNoteRepository` use the existing
shared repository factory, with a `noteKind` filter for collections. Exact
operations deliberately address the supplied IRI; a table's RDF class alone
cannot distinguish two Note shapes. The ORM returns `id` relative to the bound base and `@id` as the complete subject;
compare `@id` with the supplied subject. Callers must check returned `noteKind`
before treating an arbitrary existing Note as a particular shape. The two
resources do not declare new RDF subclasses or a second namespace.

These resources are in `solidResources`. They are not registered as two class
entries in `officialPodModelDescriptors`: that discovery registry currently
assumes one descriptor per RDF class, while both shapes intentionally share
`UDFS.Note`. The exported ORM repository descriptors are the CRUD binding;
class-discovery discrimination is a separate contract and must not fabricate
new class IRIs to work around that limitation.

Schema/type/runtime fixture tests and packaged consumers do not establish
real authenticated Pod read/write. Actual Gateway acceptance must use a real
identity, acceptance-owned resources, compare returned data, and clean up only
those owned resources through the same ORM API.
