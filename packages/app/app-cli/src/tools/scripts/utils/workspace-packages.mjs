import fs from 'node:fs';
import path from 'node:path';

import { parse } from 'yaml';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const WORKSPACE_FILE = 'pnpm-workspace.yaml';

/** The nearest directory at or above `startDir` holding a `pnpm-workspace.yaml`, as pnpm finds it; `undefined` when none does. */
export const findWorkspaceRoot = (startDir) => {
  let directory = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(directory, WORKSPACE_FILE))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
};

/**
 * The package directories the `packages` globs of a workspace's `pnpm-workspace.yaml` select, with its `!` exclusions
 * applied and `node_modules` never entered. `undefined` when the file declares no `packages`: a generated
 * application's own `pnpm-workspace.yaml` carries only build settings and makes it a workspace of one.
 */
export const listWorkspacePackageDirectories = (workspaceRoot) => {
  const patterns = parse(
    fs.readFileSync(path.join(workspaceRoot, WORKSPACE_FILE), 'utf8'),
  )?.packages;
  if (!Array.isArray(patterns)) return undefined;

  const declared = patterns.filter(
    (pattern) => typeof pattern === 'string' && pattern.trim() !== '',
  );
  const excluded = declared
    .filter((pattern) => pattern.startsWith('!'))
    .map((pattern) => pattern.slice(1));
  const directories = new Set();
  for (const pattern of declared.filter((entry) => !entry.startsWith('!'))) {
    const manifests = fs.globSync(path.posix.join(pattern, 'package.json'), {
      cwd: workspaceRoot,
      exclude: (entry) => path.basename(entry) === 'node_modules',
    });
    for (const manifest of manifests) {
      const relative = path.dirname(manifest).split(path.sep).join('/');
      if (excluded.some((glob) => path.matchesGlob(relative, glob))) continue;
      directories.add(path.join(workspaceRoot, relative));
    }
  }
  return [...directories].sort();
};

// Without a workspace declaration, the neighbours are found from the directory layout. Workspace packages are grouped one directory below the packages root — `packages/plugins/app-plugin-file` rather than `packages/app-plugin-file` — so this application's own parent directory holds only the other templates. Scanning it alone finds no plugins at all, which is why the packages root is located first and the group directories are scanned below it.
//
// A flat `packages/<name>` layout keeps working because the scan falls back to a single level, and a generated application, whose parent is an ordinary directory rather than a workspace, keeps the same single-level behaviour it had before.
const resolveLayoutPackagesRoot = (rootDir) => {
  const groupedRoot = path.resolve(rootDir, '../..');
  if (path.basename(groupedRoot) === 'packages') {
    return { root: groupedRoot, depth: 2 };
  }

  return { root: path.resolve(rootDir, '..'), depth: 1 };
};

const collectPackageDirectories = (directory, depth) => {
  if (depth < 1 || !fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (fs.existsSync(path.join(entryPath, 'package.json'))) {
        return [entryPath];
      }

      return collectPackageDirectories(entryPath, depth - 1);
    });
};

// An application may sit anywhere its workspace declares — under `packages/templates/`, or at the repository root as a
// product package does — so the declaration is read first and the layout is only the fallback.
const listNeighbourDirectories = (rootDir) => {
  const workspaceRoot = findWorkspaceRoot(rootDir);
  const declared =
    workspaceRoot === undefined
      ? undefined
      : listWorkspacePackageDirectories(workspaceRoot);
  if (declared !== undefined) return declared;

  const { root, depth } = resolveLayoutPackagesRoot(rootDir);
  return collectPackageDirectories(root, depth);
};

/** Maps every workspace package name that neighbours this application to its directory. */
export const listWorkspacePackages = (rootDir) => {
  return new Map(
    listNeighbourDirectories(rootDir)
      .map((packageDir) => [
        readJson(path.join(packageDir, 'package.json')).name,
        packageDir,
      ])
      .filter(([name]) => typeof name === 'string'),
  );
};
