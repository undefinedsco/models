# Models Skills

This directory contains shared modeling skills owned by `@undefineds.co/models`.

`models` owns reusable Solid/RDF resource semantics for LinX, Xpod, and other
Pod-facing shells. Product shells should consume these skills and model
resources instead of keeping private copies of durable Pod modeling rules.

Current public skills:

- `solid-modeling` - shared Solid Pod, RDF, drizzle-solid, and resource-schema
  modeling guidance.

Release automation validates this directory and packages:

- a generic skill archive for tools that understand `SKILL.md`
- a Codex plugin archive that contains the same skill source
- a Claude Code plugin archive that contains the same skill source

The publish workflow uploads those artifacts to the GitHub Release for the
version tag. It does not directly submit entries to Codex Marketplace or Claude
Code Marketplace.

Codex users can install the skill from the repository path once these files are
on `main`:

```bash
npx codex-marketplace add undefinedsco/models/skills/solid-modeling --skill --global
```

Marketplace-specific submission steps should be added only when the target
platform has a documented publishing API or CLI.
