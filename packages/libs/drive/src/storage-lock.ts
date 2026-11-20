import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import Sqlite from 'better-sqlite3';

export type ReleaseStorageLock = () => void;

const pendingLocks = new Map<string, Promise<void>>();

/**
 * Use SQLite's process-scoped file locks, with no application data in the file.
 * A read transaction holds a shared lock until released. The OS releases either
 * mode if the holder exits, including on SIGKILL.
 */
export async function tryStorageLock(
  file: string,
  mode: 'shared' | 'exclusive',
): Promise<ReleaseStorageLock | undefined> {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const connection = new Sqlite(file, { timeout: 0 });
  try {
    connection.exec(mode === 'exclusive' ? 'BEGIN EXCLUSIVE' : 'BEGIN');
    connection.pragma('schema_version');
    return () => {
      if (connection.open) connection.close();
    };
  } catch (error) {
    connection.close();
    if (
      error instanceof Sqlite.SqliteError &&
      error.code.startsWith('SQLITE_BUSY')
    )
      return undefined;
    throw error;
  }
}

export async function withStorageLock<T>(
  file: string,
  operation: () => Promise<T>,
): Promise<T> {
  // Only the head of the local queue probes SQLite. Other processes still
  // coordinate through the same exclusive transaction.
  const path = resolve(file);
  const previous = pendingLocks.get(path) ?? Promise.resolve();
  const current = previous.then(async () => {
    let release: ReleaseStorageLock | undefined;
    while (!(release = await tryStorageLock(path, 'exclusive'))) {
      await setTimeout(25);
    }
    try {
      return await operation();
    } finally {
      release();
    }
  });
  const settled = current.then(
    () => {},
    () => {},
  );
  pendingLocks.set(path, settled);
  try {
    return await current;
  } finally {
    if (pendingLocks.get(path) === settled) pendingLocks.delete(path);
  }
}
