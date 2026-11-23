// Installs and uninstalls a plugin package in a generated application.
//
// In this repository a plugin is a workspace directory and `pnpm install` links it. A generated application has no
// workspace, so the package has to come from the registry, which is the one step of registration that does not exist
// on the monorepo side.
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { detectPackageManager } from './package-manager.ts';
import type { PackageManager } from './package-manager.ts';

export interface PackageManagerInvocation {
  readonly args: readonly string[];
  readonly packageManager: PackageManager;
}

/** Install enabled plugins for deployment and preinstalled plugins for development. */
export function addDependencyCommand(
  packageManager: PackageManager,
  specifier: string,
  development = false,
): PackageManagerInvocation {
  const save = development ? '--save-dev' : '--save-prod';
  const args =
    packageManager === 'npm'
      ? ['install', save, specifier]
      : packageManager === 'pnpm'
        ? ['add', save, specifier]
        : ['add', ...(development ? ['--dev'] : []), specifier];
  return { args, packageManager };
}

/** How each package manager spells "drop this dependency". */
export function removeDependencyCommand(
  packageManager: PackageManager,
  packageName: string,
): PackageManagerInvocation {
  const args =
    packageManager === 'npm'
      ? ['uninstall', packageName]
      : ['remove', packageName];
  return { args, packageManager };
}

/** The package manager an application already uses, so registration never introduces a second lockfile. */
export async function appPackageManager(
  appRoot: string,
): Promise<PackageManager> {
  let declared: string | undefined;
  try {
    const manifest = JSON.parse(
      await readFile(path.join(appRoot, 'package.json'), 'utf8'),
    ) as { packageManager?: unknown };
    declared =
      typeof manifest.packageManager === 'string'
        ? manifest.packageManager
        : undefined;
  } catch {
    declared = undefined;
  }
  return detectPackageManager(appRoot, declared);
}

/** Where an installed plugin package lives, or undefined when it is not installed. */
export async function installedPluginDirectory(
  appRoot: string,
  packageName: string,
): Promise<string | undefined> {
  const directory = path.join(appRoot, 'node_modules', packageName);
  try {
    await access(path.join(directory, 'package.json'));
    return directory;
  } catch {
    return undefined;
  }
}

/** The version an installed package reports, used to record a range when the manifest has none yet. */
export async function installedPluginVersion(
  appRoot: string,
  packageName: string,
): Promise<string | undefined> {
  try {
    const manifest = JSON.parse(
      await readFile(
        path.join(appRoot, 'node_modules', packageName, 'package.json'),
        'utf8',
      ),
    ) as { version?: unknown };
    return typeof manifest.version === 'string' ? manifest.version : undefined;
  } catch {
    return undefined;
  }
}

/** The range an application records for a dependency, checking both dependency fields. */
export async function declaredDependencyRange(
  appRoot: string,
  packageName: string,
): Promise<string | undefined> {
  let manifest: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    manifest = JSON.parse(
      await readFile(path.join(appRoot, 'package.json'), 'utf8'),
    ) as typeof manifest;
  } catch {
    return undefined;
  }
  return (
    manifest.dependencies?.[packageName] ??
    manifest.devDependencies?.[packageName]
  );
}
