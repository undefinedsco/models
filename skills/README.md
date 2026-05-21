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
version tag. The repo also contains Codex and Claude Code marketplace manifests,
so both tools can register the models repo as a Git marketplace and install the
bundled plugin directly.

Codex users can install the skill from the repository path once these files are
on `main`:

```bash
npx codex-marketplace add undefinedsco/models/skills/solid-modeling --skill --global
```

Codex plugin users can register the Git marketplace and then install the plugin:

```bash
codex plugin marketplace add undefinedsco/models --ref main
codex plugin add solid-modeling@undefineds
```

Claude Code users can register the same Git marketplace and install the plugin
with the matching selector:

```bash
claude plugin marketplace add undefinedsco/models
claude plugin install solid-modeling@undefineds
```

Pi users can install the same skill through the package manifest:

```bash
pi install npm:@undefineds.co/models
```

The npm package includes `skills/` and declares `pi.skills` in `package.json`,
so Pi discovers `skills/solid-modeling/SKILL.md` as a package skill.

Marketplace-specific submission steps should be added only when the target
platform has a documented publishing API or CLI.
