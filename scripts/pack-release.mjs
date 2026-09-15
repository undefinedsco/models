import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import {
  ensureExecutableBins,
  fixExtensionlessDeclarationImports,
  fixExtensionlessRelativeImports,
  fixJsonImportAttributes,
} from './lib/dist-rewrite.mjs'

const modelsRoot = fileURLToPath(new URL('..', import.meta.url))
const outRoot = join(modelsRoot, 'preview')
const args = parseArgs(process.argv.slice(2))
const pkg = JSON.parse(readFileSync(join(modelsRoot, 'package.json'), 'utf-8'))
const version = args.version ?? pkg.version
const workRoot = join(tmpdir(), `undefineds-models-release-${Date.now()}`)

/** Lockfiles are development artifacts; they must not ride along in the tarball. */
const LOCKFILES = new Set(['bun.lock', 'bun.lockb', 'yarn.lock', 'package-lock.json'])

rmSync(workRoot, { recursive: true, force: true })
mkdirSync(workRoot, { recursive: true })
mkdirSync(outRoot, { recursive: true })

copyPackage(modelsRoot, workRoot)
fixExtensionlessRelativeImports(join(workRoot, 'dist'))
fixExtensionlessDeclarationImports(join(workRoot, 'dist'))
fixJsonImportAttributes(join(workRoot, 'dist'))
ensureExecutableBins(join(workRoot, 'dist'))
writeJson(join(workRoot, 'package.json'), createPublishablePackage(pkg, version))

const tarball = npmPack(workRoot)
const out = join(outRoot, `undefineds-co-models-${version}.tgz`)
cpSync(tarball, out)
console.log(out)

function copyPackage(from, to) {
  cpSync(from, to, {
    recursive: true,
    filter: (src) => shouldCopyPackagePath(from, src),
  })
}

function shouldCopyPackagePath(root, path) {
  const relativePath = relative(root, path)
  if (!relativePath) return true

  const segments = relativePath.split(sep)
  return !segments.includes('node_modules')
    && !segments.includes('.tmp-dev-emit')
    && !segments.includes('test')
    && !segments.includes('tests')
    && !segments.includes('src')
    && !LOCKFILES.has(relativePath)
    && !(segments[0] === 'dist' && segments[1] === 'storage')
}

function createPublishablePackage(packageJson, packageVersion) {
  const exports = structuredClone(packageJson.exports ?? {})
  assertPublishExportsMatch(packageJson.exports ?? {}, exports)

  return {
    ...packageJson,
    version: packageVersion,
    private: false,
    main: './dist/index.js',
    types: './dist/index.d.ts',
    bin: {
      udfs: './dist/bin/udfs.js',
    },
    dependencies: pickPublishDependencies(packageJson.dependencies ?? {}),
    files: [
      'dist',
      'skills',
      'README.md',
      'package.json',
    ],
    exports,
    publishConfig: {
      access: 'public',
    },
  }
}

function assertPublishExportsMatch(sourceExports, publishExports) {
  const sourceKeys = Object.keys(sourceExports).sort()
  const publishKeys = Object.keys(publishExports).sort()
  if (JSON.stringify(sourceKeys) !== JSON.stringify(publishKeys)) {
    throw new Error(
      `Release exports drifted from package.json: source=${sourceKeys.join(',')} publish=${publishKeys.join(',')}`,
    )
  }
}

function pickPublishDependencies(dependencies) {
  return pick(dependencies, [
    '@comunica/query-sparql-solid',
    '@inrupt/vocab-common-rdf',
    '@undefineds.co/drizzle-solid',
    'n3',
    'zod',
  ])
}

function pick(object, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => Object.prototype.hasOwnProperty.call(object, key))
      .map((key) => [key, object[key]]),
  )
}

function npmPack(cwd) {
  const packCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const pack = spawnSync(packCommand, ['pack'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      npm_config_cache: join(cwd, '.npm-cache'),
    },
  })
  if ((pack.status ?? 1) !== 0) {
    process.exit(pack.status ?? 1)
  }

  const filename = pack.stdout.trim().split('\n').at(-1)
  if (!filename) {
    throw new Error(`npm pack did not print a tarball name for ${cwd}`)
  }
  const tarball = join(cwd, filename)
  if (!existsSync(tarball)) {
    throw new Error(`npm pack output was not found: ${tarball}`)
  }
  return tarball
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function parseArgs(argv) {
  const parsed = {
    version: undefined,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--version') {
      parsed.version = argv[i + 1]
      i += 1
      continue
    }
    if (arg.startsWith('--version=')) {
      parsed.version = arg.slice('--version='.length)
      continue
    }
    throw new Error(`Unknown option: ${arg}`)
  }

  return parsed
}
