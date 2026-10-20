/** The directories of this computer that sessions may work in, and listing their folders for a person choosing one. */
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { MAX_FOLDERS, type FolderListing } from './protocol.js';

/** Whether `dir`, absolute, is one of `roots` or inside one. */
export function isWithin(roots: readonly string[], dir: string): boolean {
  return roots.some((root) => {
    const relative = path.relative(root, dir);
    return (
      relative === '' ||
      (!relative.startsWith('..') && !path.isAbsolute(relative))
    );
  });
}

/** `dir` resolved, when it is absolute and under `roots`; otherwise an error that says where sessions may work. */
export function allowedDir(roots: readonly string[], dir: string): string {
  const resolved = path.resolve(dir);
  if (!path.isAbsolute(dir) || !isWithin(roots, resolved)) {
    throw new Error(
      `Sessions on this computer work only under ${roots.join(', ')}; ${dir} is not.`,
    );
  }
  return resolved;
}

/** The folders in `dir`, hidden ones left out, sorted as a person reads them. */
export async function listFolders(
  roots: readonly string[],
  dir: string,
): Promise<FolderListing> {
  const resolved = allowedDir(roots, dir);
  const entries = await readdir(resolved, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  return {
    path: resolved,
    folders: folders.slice(0, MAX_FOLDERS),
    truncated: folders.length > MAX_FOLDERS,
  };
}
