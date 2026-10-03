import { mkdir, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type {
  TestDatabaseEnvironment,
  TestDatabaseProvisioner,
} from '@nocobase/db/testing';
import { sqlite, sqliteDriver } from './index.js';

const EXTENSION = '.sqlite';

/**
 * Where isolated test databases are created: `NOCOBASE_TEST_DB_SQLITE_DIRECTORY`,
 * or a directory under the system's temporary directory.
 */
export function sqliteTestDirectory(env: TestDatabaseEnvironment): string {
  return (
    env.NOCOBASE_TEST_DB_SQLITE_DIRECTORY ??
    path.join(tmpdir(), 'nocobase-test-databases')
  );
}

/**
 * Each test database is a file of its own rather than `:memory:`, so that a
 * second Database Manager — an application restarted on the database the
 * first one seeded, or another process — opens the same database, as it does
 * on every server dialect.
 */
export const testDatabaseProvisioner: TestDatabaseProvisioner = {
  dialect: 'sqlite',
  capabilities: sqliteDriver.capabilities ?? {},
  provision: async ({ name, env }) => {
    const directory = sqliteTestDirectory(env);
    await mkdir(directory, { recursive: true });
    return {
      connection: sqlite({ filename: path.join(directory, name + EXTENSION) }),
      drop: () => removeDatabaseFiles(directory, name),
    };
  },
  listProvisioned: async ({ prefix, env }) => {
    let entries: string[];
    try {
      entries = await readdir(sqliteTestDirectory(env));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    return entries
      .filter((entry) => entry.startsWith(prefix) && entry.endsWith(EXTENSION))
      .map((entry) => entry.slice(0, -EXTENSION.length));
  },
  dropProvisioned: ({ name, env }) =>
    removeDatabaseFiles(sqliteTestDirectory(env), name),
};

async function removeDatabaseFiles(
  directory: string,
  name: string,
): Promise<void> {
  // A write-ahead log or rollback journal may sit beside the database.
  await Promise.all(
    ['', '-wal', '-shm', '-journal'].map((suffix) =>
      rm(path.join(directory, name + EXTENSION + suffix), { force: true }),
    ),
  );
}
