import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface AppPackageIdentity {
  readonly name?: string;
  readonly displayName?: string;
  readonly version?: string;
}

/** Read the application manifest in a source tree, a standalone build, or an embedded release archive. */
export function readAppPackage(rootDir: string): AppPackageIdentity {
  // Embedded archives keep package.json under dist; a source manifest takes precedence over any old build.
  for (const relativePath of ['package.json', 'dist/package.json']) {
    let content: string;
    try {
      content = readFileSync(path.join(rootDir, relativePath), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    const value: unknown = JSON.parse(content);
    if (typeof value !== 'object' || value === null) return {};
    const { name, displayName, version } = value as Record<string, unknown>;
    return {
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof displayName === 'string' ? { displayName } : {}),
      ...(typeof version === 'string' ? { version } : {}),
    };
  }
  return {};
}
