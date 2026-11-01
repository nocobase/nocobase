import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface AppPackageIdentity {
  readonly name?: string;
  readonly displayName?: string;
  readonly version?: string;
}

/** Read the root manifest, or the built manifest when an embedded deployment has no root manifest. */
export function readAppPackage(rootDir: string): AppPackageIdentity {
  const packagePath = [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'dist/package.json'),
  ].find((candidate) => existsSync(candidate));
  if (!packagePath) return {};
  const value = JSON.parse(readFileSync(packagePath, 'utf8')) as unknown;
  if (typeof value !== 'object' || value === null) return {};
  const { name, displayName, version } = value as Record<string, unknown>;
  return {
    ...(typeof name === 'string' ? { name } : {}),
    ...(typeof displayName === 'string' ? { displayName } : {}),
    ...(typeof version === 'string' ? { version } : {}),
  };
}
