import { lstat, realpath } from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { BackupError } from './errors.js';

/** Path in the portable archive namespace. */
export function assertArchivePath(path: string): void {
  const segments = path.split('/');
  if (
    /[\\:]/.test(path) ||
    [...path].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) ||
    segments.some((part) => !part || part === '.' || part === '..')
  ) {
    throw new BackupError(
      'BACKUP_UNSAFE_PATH',
      'An archive or file reference contains an unsafe path.',
    );
  }
}

export function assertName(name: string): void {
  assertArchivePath(name);
  if (name.includes('/')) {
    throw new BackupError(
      'BACKUP_INVALID_TARGET',
      'Connection and disk names must be single path segments.',
    );
  }
}

export function contains(parent: string, child: string): boolean {
  const sub = relative(parent, child);
  return (
    sub === '' ||
    (!isAbsolute(sub) && sub !== '..' && !sub.startsWith('..' + sep))
  );
}

/** Resolve symlinks in existing ancestors, including for paths that do not yet exist. */
export async function canonical(path: string): Promise<string> {
  const absolute = resolve(path);
  try {
    return await realpath(absolute);
  } catch (error) {
    if (!isMissing(error)) throw error;
    // A dangling symlink must never be treated as a missing pathname.
    if (await fileStat(absolute)) throw error;
    return join(await canonical(dirname(absolute)), basename(absolute));
  }
}

export function isMissing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export async function fileStat(
  path: string,
): Promise<Awaited<ReturnType<typeof lstat>> | undefined> {
  try {
    return await lstat(path);
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}
