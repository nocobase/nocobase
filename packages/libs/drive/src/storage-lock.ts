import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import Sqlite from 'better-sqlite3';

export type ReleaseStorageLock = () => void;

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
  let release: ReleaseStorageLock | undefined;
  while (!(release = await tryStorageLock(file, 'exclusive'))) {
    await setTimeout(25);
  }
  try {
    return await operation();
  } finally {
    release();
  }
}
