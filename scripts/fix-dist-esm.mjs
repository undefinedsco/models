import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ensureExecutableBins,
  fixExtensionlessDeclarationImports,
  fixExtensionlessRelativeImports,
  fixJsonImportAttributes,
} from './lib/dist-rewrite.mjs'

const modelsRoot = fileURLToPath(new URL('..', import.meta.url))
const distRoot = join(modelsRoot, 'dist')

fixExtensionlessRelativeImports(distRoot)
fixExtensionlessDeclarationImports(distRoot)
fixJsonImportAttributes(distRoot)
ensureExecutableBins(distRoot)
