import { chmodSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Post-processing shared by the build (`scripts/fix-dist-esm.mjs`) and the
 * release packer (`scripts/pack-release.mjs`), so both stages ship the same
 * specifier shape.
 *
 * `dist` is compiled with `moduleResolution: Node`, which lets TypeScript emit
 * extensionless relative specifiers. That is fine for `node10` resolution but
 * breaks `moduleResolution: node16 | nodenext`, where every relative specifier
 * in an ES module needs its file extension. The package is `"type": "module"`,
 * so its published `.js` *and* `.d.ts` files are both ESM to the compiler:
 * `.js` was rewritten here from the start, `.d.ts` was not, and consumers
 * running `skipLibCheck: false` failed with TS2834/TS2835 while
 * `skipLibCheck: true` silently degraded every re-export to `any`.
 */
const SCRIPT_SUFFIXES = ['.js']
const DECLARATION_SUFFIXES = ['.d.ts']

const FROM_PATTERN = /(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g
const SIDE_EFFECT_IMPORT_PATTERN = /(import\s+['"])(\.{1,2}\/[^'"]+)(['"])/g
/** `import('./x').Foo` type queries only exist in declarations. */
const DYNAMIC_IMPORT_PATTERN = /(import\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g

/** Give extensionless relative specifiers in emitted scripts the `.js` suffix. */
export function fixExtensionlessRelativeImports(root) {
  rewriteSpecifiers(root, SCRIPT_SUFFIXES, [FROM_PATTERN, SIDE_EFFECT_IMPORT_PATTERN])
}

/** Same treatment for emitted declarations, plus `import('./x')` type queries. */
export function fixExtensionlessDeclarationImports(root) {
  rewriteSpecifiers(root, DECLARATION_SUFFIXES, [
    FROM_PATTERN,
    SIDE_EFFECT_IMPORT_PATTERN,
    DYNAMIC_IMPORT_PATTERN,
  ])
}

export function fixJsonImportAttributes(root) {
  const jsonImportPattern = /(import\s+[^;]*?from\s+['"][^'"]+\.json['"])(\s*;)/g
  for (const file of walkFiles(root, SCRIPT_SUFFIXES)) {
    const source = readFileSync(file, 'utf8').replace(jsonImportPattern, (_match, statement, suffix) => {
      if (statement.includes(' with { type: \'json\' }') || statement.includes(' with { type: "json" }')) {
        return `${statement}${suffix}`
      }
      return `${statement} with { type: 'json' }${suffix}`
    })
    writeFileSync(file, source)
  }
}

export function ensureExecutableBins(root) {
  const udfsBin = join(root, 'bin', 'udfs.js')
  if (existsSync(udfsBin)) {
    chmodSync(udfsBin, 0o755)
  }
}

function rewriteSpecifiers(root, suffixes, patterns) {
  for (const file of walkFiles(root, suffixes)) {
    let source = readFileSync(file, 'utf8')
    for (const pattern of patterns) {
      source = source.replace(pattern, (_match, before, specifier, after) => (
        `${before}${resolveRelativeSpecifier(file, specifier)}${after}`
      ))
    }
    writeFileSync(file, source)
  }
}

function walkFiles(dir, suffixes, files = []) {
  if (!existsSync(dir)) {
    return files
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(next, suffixes, files)
    } else if (entry.isFile() && hasSuffix(next, suffixes)) {
      files.push(next)
    }
  }
  return files
}

function hasSuffix(file, suffixes) {
  return suffixes.some((suffix) => file.endsWith(suffix))
}

/**
 * Non-relative, already-suffixed, query and fragment specifiers are left
 * untouched; everything else is pointed at the emitted `.js` file (or the
 * `index.js` of an emitted directory) that TypeScript also wrote beside it.
 */
function resolveRelativeSpecifier(fromFile, specifier) {
  if (
    specifier.endsWith('.js')
    || specifier.endsWith('.json')
    || specifier.includes('?')
    || specifier.includes('#')
  ) {
    return specifier
  }

  const targetBase = join(dirname(fromFile), specifier)
  if (existsSync(`${targetBase}.js`)) {
    return `${specifier}.js`
  }

  if (existsSync(join(targetBase, 'index.js'))) {
    return `${specifier}/index.js`
  }

  return specifier
}
