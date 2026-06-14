# Release Process

`@undefineds.co/models` releases are **tag-driven**. Do not use local
`npm publish` as the normal release path.

The source of truth is `.github/workflows/publish.yml`:

- pushing a tag matching `v*` starts the publish workflow;
- the tag version must match `package.json.version` exactly;
- CI builds, tests, validates skills, packs skill/plugin artifacts, publishes
  them to the GitHub Release, packs the npm release tarball, and publishes npm
  using the repository `NPM_TOKEN` secret.

## Preflight

Start from a clean, up-to-date `main`:

```bash
git checkout main
git pull --ff-only origin main
git status --short --branch
```

Pick the next version and update every checked-in version field that must match:

- `package.json`
- `plugins/solid-modeling/.codex-plugin/plugin.json`
- `plugins/solid-modeling/.claude-plugin/plugin.json`

`yarn skills:check` enforces the plugin manifest versions.

Run the same checks the release workflow will run:

```bash
yarn build
yarn test:ci
yarn skills:check
```

Optional local packaging checks:

```bash
yarn skills:pack
yarn pack:release
```

These commands only validate/package locally. They are not the release trigger.

## Commit

Commit the release-ready changes before tagging. Use the repository commit style
and include tested evidence in the commit message.

```bash
git add package.json \
  plugins/solid-modeling/.codex-plugin/plugin.json \
  plugins/solid-modeling/.claude-plugin/plugin.json \
  <changed source/docs/tests>

git diff --cached --check
git diff --cached --stat
git commit
```

Do not use `git add -A` unless you have inspected the full working tree and are
intentionally staging every file.

## Tag and publish

Create an annotated version tag whose name matches `package.json.version`:

```bash
VERSION=$(node -p "require('./package.json').version")
git tag -a "v${VERSION}" -m "Release @undefineds.co/models ${VERSION}"
```

Push the commit and the tag:

```bash
git push origin main
git push origin "v${VERSION}"
```

The tag push is the release. It triggers GitHub Actions; do not run local
`npm publish` as a substitute.

## Monitor release automation

Watch the workflow started by the tag push:

```bash
gh run list --repo undefinedsco/models --workflow publish.yml --limit 5
gh run watch --repo undefinedsco/models <run-id>
```

Confirm the GitHub Release and npm dist-tag after the workflow succeeds:

```bash
gh release view "v${VERSION}" --repo undefinedsco/models
npm view @undefineds.co/models version dist-tags --json
```

Expected result:

- `Publish NPM and Release Skill Artifacts` succeeds for the tag;
- GitHub Release contains the skill/plugin archives;
- npm `latest` equals the released version.

## Failure handling

- If the workflow fails because `package.json.version` does not match the tag,
  fix the version in a new commit, delete the failed local/remote tag only if no
  public release/npm publish happened, recreate it, and push again.
- If npm publish fails because `NPM_TOKEN` or npm permissions are broken, fix the
  repository secret/permissions and rerun the failed GitHub Actions workflow.
  Do not publish from a developer laptop.
- If npm already contains the version, the workflow skips npm publish for that
  version. Do not overwrite npm versions; bump a new patch version instead.
- Once a tag has produced public npm or Release artifacts, do not move that tag.
  Use a new version for follow-up fixes.

## Current workflow contract

As of this document, `.github/workflows/publish.yml` performs:

1. `yarn install --non-interactive --ignore-engines`
2. tag/package version check
3. `yarn build`
4. `yarn test:ci`
5. `yarn skills:check`
6. `yarn skills:pack`
7. GitHub Release upload for skill/plugin artifacts
8. npm version existence check
9. `yarn pack:release`
10. `npm publish --access public ./preview/undefineds-co-models-<version>.tgz`
