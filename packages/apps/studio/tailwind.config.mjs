// Tells Tailwind which plugin files to scan for utility classes.
//
// `@source "../node_modules/@nocobase/app-plugin-*/client"` cannot do this job. pnpm links every dependency as a
// symlink into its store, and Tailwind's scanner does not expand a wildcard through one — the glob silently matches
// nothing, in this repository and in a generated application alike. Reading the directory first and resolving each
// match to its real path gets past that, because `readdirSync` sees the symlinks and `realpathSync` resolves them.
//
// Client runtime files and canonical Registry source are both searched. A workspace plugin exposes TypeScript sources,
// while an installed one may expose build output plus application-owned Registry recipes. Missing directories are skipped.
import { existsSync, globSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

const SOURCE_DIRECTORIES = [
  'client',
  'dist/client',
  'src',
  'dist/src',
  'registry',
];
const SCANNED_FILES = '**/*.{js,jsx,ts,tsx}';

/** Every scannable directory a workspace or installed `@nocobase` package exposes. */
function scannedDirectories(appRoot) {
  const scope = path.resolve(appRoot, 'node_modules/@nocobase');
  if (!existsSync(scope)) {
    return [];
  }

  const directories = [];
  for (const packageName of readdirSync(scope)) {
    // app-client contributes the shared components an application renders; the plugins contribute their own pages.
    if (
      !packageName.startsWith('app-plugin-') &&
      packageName !== 'app-client'
    ) {
      continue;
    }
    for (const directory of SOURCE_DIRECTORIES) {
      const candidate = path.join(scope, packageName, directory);
      if (existsSync(candidate)) {
        directories.push(realpathSync(candidate));
      }
    }
  }
  return directories;
}

/** Exported so a test can drive the resolution over a fixture laid out the way pnpm lays out an installed package. */
export function contentFilesIn(appRoot) {
  const files = [];
  for (const directory of scannedDirectories(appRoot)) {
    for (const file of globSync(SCANNED_FILES, { cwd: directory })) {
      files.push(path.join(directory, file));
    }
  }
  return files;
}

export default { content: contentFilesIn(import.meta.dirname) };
