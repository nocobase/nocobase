import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface AppPackageIdentity {
  readonly name?: string;
  readonly displayName?: string;
  readonly version?: string;
}

/**
 * Where an application manifest may live, relative to the application root, in lookup order.
 *
 * A source tree and a standalone build keep `package.json` at the root; an embedded release
 * archive keeps it under `dist`. A source manifest takes precedence over any old build.
 */
const APP_MANIFEST_PATHS = ['package.json', 'dist/package.json'] as const;

/** Read the application manifest in a source tree, a standalone build, or an embedded release archive. */
export async function readAppPackage(
  rootDir: string,
): Promise<AppPackageIdentity> {
  for (const relativePath of APP_MANIFEST_PATHS) {
    let content: string;
    try {
      content = await readFile(path.join(rootDir, relativePath), 'utf8');
    } catch (error) {
      if (isMissingFile(error)) continue;
      throw error;
    }
    return parseAppPackage(content);
  }
  return {};
}

/** Synchronous {@link readAppPackage}, for resolution that runs before the application starts. */
export function readAppPackageSync(rootDir: string): AppPackageIdentity {
  for (const relativePath of APP_MANIFEST_PATHS) {
    let content: string;
    try {
      content = readFileSync(path.join(rootDir, relativePath), 'utf8');
    } catch (error) {
      if (isMissingFile(error)) continue;
      throw error;
    }
    return parseAppPackage(content);
  }
  return {};
}

function parseAppPackage(content: string): AppPackageIdentity {
  const value: unknown = JSON.parse(content);
  if (typeof value !== 'object' || value === null) return {};
  const { name, displayName, version } = value as Record<string, unknown>;
  return {
    ...(typeof name === 'string' ? { name } : {}),
    ...(typeof displayName === 'string' ? { displayName } : {}),
    ...(typeof version === 'string' ? { version } : {}),
  };
}

function isMissingFile(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT';
}
