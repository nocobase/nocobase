import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { listWorkspacePackageDirectories } from '../tools/scripts/utils/workspace-packages.mjs';

const DEFAULT_WORKSPACE_APP = 'app-template-default';
// Without a `pnpm-workspace.yaml` declaring `packages`, one root is enough: the scan below recurses, so it reaches every
// package under `packages/`, whichever category directory it sits in.
const WORKSPACE_PACKAGE_ROOTS = ['packages'] as const;
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.pnpm',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

export interface WorkspaceApp {
  readonly packageName: string;
  readonly root: string;
}

export interface ResolveAppRootOptions {
  readonly app?: string;
  readonly dir?: string;
  readonly workspaceRoot?: string;
}

/** Resolves either a normal app directory or an app selected from a monorepo workspace. */
export async function resolveAppRoot({
  app,
  dir,
  workspaceRoot,
}: ResolveAppRootOptions): Promise<string> {
  if (workspaceRoot === undefined) {
    if (app !== undefined) {
      throw new Error('--app requires --workspace-root.');
    }
    return path.resolve(dir ?? process.cwd());
  }
  if (dir !== undefined) {
    throw new Error('--dir and --workspace-root cannot be used together.');
  }
  return (
    await resolveWorkspaceApp(
      path.resolve(workspaceRoot),
      app ?? DEFAULT_WORKSPACE_APP,
    )
  ).root;
}

/** Finds an application by workspace directory name or full package name. */
export async function resolveWorkspaceApp(
  workspaceRoot: string,
  selector: string,
): Promise<WorkspaceApp> {
  const normalized = selector.trim();
  if (normalized.length === 0) {
    throw new Error('--app must be a non-empty application name.');
  }
  if (
    normalized.includes('\\') ||
    (normalized.includes('/') && !normalized.startsWith('@'))
  ) {
    throw new Error(
      '--app must be a workspace directory name or a scoped package name, not a path.',
    );
  }

  const matches: WorkspaceApp[] = [];
  for (const packageJsonPath of await listPackageJsonFiles(workspaceRoot)) {
    const manifest = await readPackageManifest(packageJsonPath);
    if (
      path.basename(path.dirname(packageJsonPath)) !== normalized &&
      manifest.name !== normalized
    ) {
      continue;
    }
    if (typeof manifest.name !== 'string') {
      throw new Error(
        `Application package must define a name: ${packageJsonPath}`,
      );
    }
    matches.push({
      packageName: manifest.name,
      root: path.dirname(packageJsonPath),
    });
  }

  if (matches.length === 0) {
    throw new Error(`Application package not found for --app ${normalized}.`);
  }
  if (matches.length > 1) {
    const details = matches
      .map(({ root }) => `  ${path.relative(workspaceRoot, root)}`)
      .join('\n');
    throw new Error(
      `Application selector ${normalized} is ambiguous:\n${details}\nUse the full package name with --app.`,
    );
  }
  return matches[0];
}

/**
 * The manifests of the packages the workspace declares in `pnpm-workspace.yaml`, so an application outside `packages/`,
 * such as a product package at the repository root, can be selected too.
 */
async function listPackageJsonFiles(workspaceRoot: string): Promise<string[]> {
  const declared = existsSync(path.join(workspaceRoot, 'pnpm-workspace.yaml'))
    ? listWorkspacePackageDirectories(workspaceRoot)
    : undefined;
  if (declared !== undefined) {
    return declared.map((directory) => path.join(directory, 'package.json'));
  }
  const files: string[] = [];
  for (const directory of WORKSPACE_PACKAGE_ROOTS) {
    files.push(
      ...(await findPackageJsonFiles(path.join(workspaceRoot, directory))),
    );
  }
  return files;
}

async function findPackageJsonFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error, 'ENOENT') || isNodeError(error, 'ENOTDIR')) {
      return [];
    }
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name)) {
      files.push(...(await findPackageJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name === 'package.json') {
      files.push(entryPath);
    }
  }
  return files;
}

async function readPackageManifest(
  packageJsonPath: string,
): Promise<{ readonly name?: unknown }> {
  try {
    return JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
      readonly name?: unknown;
    };
  } catch (error) {
    throw new Error(`Invalid package manifest: ${packageJsonPath}`, {
      cause: error,
    });
  }
}

function isNodeError(
  error: unknown,
  code: string,
): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
