import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export function resolveTypeScript(rootDir) {
  const legacy = {
    name: 'TypeScript (tsc)',
    command: 'pnpm',
    args: ['exec', 'tsc'],
  };
  if (process.env.NOCOBASE_TSC === 'tsc') return legacy;

  const appManifest = path.join(rootDir, 'package.json');
  if (!existsSync(appManifest)) return legacy;
  const { devDependencies } = JSON.parse(readFileSync(appManifest, 'utf8'));
  if (!devDependencies?.['@nocobase/typescript7']) return legacy;

  const requireFromApp = createRequire(appManifest);
  let compilerPackage;
  try {
    compilerPackage = requireFromApp.resolve(
      '@nocobase/typescript7/package.json',
    );
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') return legacy;
    throw error;
  }

  const requireFromCompiler = createRequire(compilerPackage);
  const manifest = requireFromCompiler.resolve('typescript7/package.json');
  return {
    name: 'TypeScript 7',
    command: process.execPath,
    args: [path.join(path.dirname(manifest), 'bin', 'tsc'), '--checkers', '1'],
  };
}
