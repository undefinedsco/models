#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'
import ts from 'typescript'

/**
 * Published-surface type gate.
 *
 * `tsc -p tsconfig.types.json` (the `test:types` half of `test:ci`) compiles
 * the type tests against `../src`, so it never sees what ships. This gate
 * compiles the **built** declarations instead: every `.d.ts` under `dist/` plus
 * `tests/dist-entry.types.ts`, which exercises the entry's exported descriptor
 * types, under `moduleResolution: bundler` and `moduleResolution: nodenext`
 * with `skipLibCheck: false`.
 *
 * `skipLibCheck: false` is the point. With `skipLibCheck: true` an unresolved
 * relative specifier inside `dist/index.d.ts` degrades every re-export to `any`,
 * so the same program passes while consumers silently lose the descriptor
 * types — `row.providerId` compiles again. The probe's `@ts-expect-error`
 * negatives turn that degradation into a hard error (TS2578).
 *
 * Tolerated, and reported on every run: `dist/*.d.ts` references internal
 * subpaths of declared dependencies (`@undefineds.co/drizzle-solid/dist/...`)
 * that the dependency's `exports` map does not expose. They are unresolvable
 * for every `moduleResolution` except `node10` and are a separate packaging gap
 * owned by the dependency, not fixable from this package's specifiers. A
 * diagnostic about a package this one does not declare is still fatal.
 *
 * Dependency declarations are marked `@ts-nocheck` through the gate's compiler
 * host, so `skipLibCheck: false` applies to *this package's* shipped
 * declarations. Without that, the gate spends ~5s per mode type-checking
 * third-party declarations that are already broken for unrelated reasons
 * (drizzle-orm 0.28 under TypeScript 6) and reports noise instead of signal.
 */

const modelsRoot = fileURLToPath(new URL('..', import.meta.url))
const distRoot = join(modelsRoot, 'dist')
const probeFile = join(modelsRoot, 'tests', 'dist-entry.types.ts')
const packageJson = JSON.parse(readFileSync(join(modelsRoot, 'package.json'), 'utf8'))
const declaredDependencies = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
])
const modes = [
  { name: 'bundler', module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler },
  { name: 'nodenext', module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext },
]

if (!existsSync(join(distRoot, 'index.d.ts'))) {
  console.error('dist type gate: dist/index.d.ts is missing — run the build first.')
  process.exit(1)
}

const rootNames = [probeFile, ...walkDeclarations(distRoot)]
let failed = false

for (const mode of modes) {
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: mode.module,
    moduleResolution: mode.moduleResolution,
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    types: [],
  }
  const program = ts.createProgram({ rootNames, options, host: createGateHost(options) })
  const fatal = []
  const dependencyGaps = new Map()
  let thirdParty = 0

  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const verdict = classify(diagnostic)
    if (verdict.kind === 'fatal') {
      fatal.push(formatDiagnostic(diagnostic))
    } else if (verdict.kind === 'dependency') {
      dependencyGaps.set(verdict.specifier, (dependencyGaps.get(verdict.specifier) ?? 0) + 1)
    } else {
      thirdParty += 1
    }
  }

  console.log(`dist type gate · moduleResolution: ${mode.name} · skipLibCheck: false`)
  console.log(`  files: ${program.getSourceFiles().length} in program, ${rootNames.length} roots (${relative(modelsRoot, probeFile)} + ${rootNames.length - 1} dist declarations)`)
  for (const line of fatal.slice(0, 20)) {
    console.log(`  ✗ ${line}`)
  }
  if (fatal.length > 20) {
    console.log(`  ✗ … ${fatal.length - 20} more`)
  }
  if (dependencyGaps.size > 0) {
    const total = [...dependencyGaps.values()].reduce((sum, count) => sum + count, 0)
    console.log(`  ! tolerated: ${total} unresolved dependency-internal subpaths (${dependencyGaps.size} distinct, see the header note)`)
    for (const [specifier, count] of [...dependencyGaps].sort((a, b) => b[1] - a[1])) {
      console.log(`      ${specifier} ×${count}`)
    }
  }
  if (thirdParty > 0) {
    console.log(`  · ignored: ${thirdParty} diagnostics inside dependency declarations`)
  }
  console.log(`  ${fatal.length === 0 ? '✓ no failures' : `✗ ${fatal.length} failure(s)`}`)
  failed = failed || fatal.length > 0
}

function classify(diagnostic) {
  const file = diagnostic.file?.fileName
  if (!file) {
    return { kind: 'fatal' }
  }
  if (!isPublishedFile(file)) {
    return { kind: 'third-party' }
  }

  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
  const specifier = /Cannot find module '([^']+)'/.exec(message)?.[1]
  if (diagnostic.code === 2307 && specifier && !specifier.startsWith('.')) {
    const dependency = [...declaredDependencies].find((name) => specifier === name || specifier.startsWith(`${name}/`))
    if (dependency) {
      return { kind: 'dependency', specifier }
    }
  }

  return { kind: 'fatal' }
}

function isPublishedFile(file) {
  return file === probeFile || file.startsWith(`${distRoot}${sep}`)
}

/**
 * `skipLibCheck: false` for the shipped declarations without type-checking the
 * dependency graph they sit on: every other declaration file in `node_modules`
 * is handed to the compiler as `@ts-nocheck`, which suppresses checking of that
 * file only. Module resolution, and therefore every diagnostic raised in `dist`
 * or in the probe, is unaffected.
 */
function createGateHost(options) {
  const host = ts.createCompilerHost(options, true)
  const getSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) => {
    const sourceFile = getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile)
    if (!sourceFile || isPublishedFile(fileName) || !fileName.includes(`${sep}node_modules${sep}`)) {
      return sourceFile
    }
    return ts.createSourceFile(
      fileName,
      `// @ts-nocheck\n${sourceFile.text}`,
      languageVersionOrOptions,
      true,
      sourceFile.scriptKind,
    )
  }
  return host
}

function walkDeclarations(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDeclarations(next, files)
    } else if (entry.isFile() && next.endsWith('.d.ts')) {
      files.push(next)
    }
  }
  return files
}

function formatDiagnostic(diagnostic) {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
  if (!diagnostic.file) {
    return `TS${diagnostic.code}: ${message}`
  }
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0)
  return `${relative(modelsRoot, diagnostic.file.fileName)}:${line + 1}:${character + 1} - error TS${diagnostic.code}: ${message}`
}

console.log(failed ? 'dist type gate: FAILED' : 'dist type gate: OK (bundler, nodenext)')
process.exit(failed ? 1 : 0)
