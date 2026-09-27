import { existsSync, readFileSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { EXIT_INVALID, InstallerError } from './errors.ts';
import type { Layout } from './layout.ts';

/** A SQLite database is the main file plus whichever journal files exist beside it. */
const SQLITE_SUFFIXES = ['', '-wal', '-shm', '-journal'];

/** Written into every backup, so a restore knows where each database goes even after `config.yml` changes. */
const MANIFEST = 'backup.json';

export interface SqliteDatabase {
  /** The connection name under `database.connections`. */
  connection: string;
  /** Absolute path of the database file. */
  file: string;
}

export interface DatabaseInventory {
  /** The connection the application treats as its own, `database.default`, `main` unless configured. */
  defaultConnection: string;
  sqlite: SqliteDatabase[];
  /** Connections on any other dialect, which the installer cannot back up. */
  external: string[];
  /** SQLite connections whose file path could not be resolved, such as one naming an unset variable. */
  unresolved: string[];
}

interface ConnectionConfig {
  dialect?: unknown;
  database?: unknown;
  filename?: unknown;
}

/** `${NAME}` references, resolved the way the runtime resolves them from its environment; `undefined` if one is unset. */
function interpolate(
  value: string,
  env: Record<string, string | undefined>,
): string | undefined {
  let missing = false;
  const resolved = value.replace(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/gu,
    (_, name: string) => {
      const found = env[name];
      if (found === undefined) missing = true;
      return found ?? '';
    },
  );
  return missing ? undefined : resolved;
}

/**
 * The application's databases as `config.yml` declares them. A SQLite path is resolved against the storage directory,
 * as the runtime resolves it; `:memory:` holds nothing to back up. A connection `config.yml` does not declare is not
 * seen, which is why an upgrade stops when the default connection is SQLite and its file is missing.
 */
export function readDatabaseInventory(
  layout: Layout,
  env: Record<string, string | undefined>,
): DatabaseInventory {
  let document: {
    database?: { default?: unknown; connections?: Record<string, unknown> };
  } = {};
  try {
    document = (parse(readFileSync(layout.configFile, 'utf8')) ??
      {}) as typeof document;
  } catch (error) {
    // Treating this as "no databases" would let an upgrade proceed without a backup and without --backup-done.
    throw new InstallerError(
      'CONFIG_UNREADABLE',
      `${layout.configFile} could not be read as YAML, so the databases to back up are unknown: ${error instanceof Error ? error.message : String(error)}`,
      { exitCode: EXIT_INVALID, cause: error },
    );
  }
  const inventory: DatabaseInventory = {
    defaultConnection:
      typeof document.database?.default === 'string'
        ? document.database.default
        : 'main',
    sqlite: [],
    external: [],
    unresolved: [],
  };
  const lookup = { ...process.env, ...env };
  for (const [connection, raw] of Object.entries(
    document.database?.connections ?? {},
  )) {
    const config = (raw ?? {}) as ConnectionConfig;
    if (config.dialect !== 'sqlite') {
      inventory.external.push(connection);
      continue;
    }
    const declared = config.database ?? config.filename;
    if (typeof declared !== 'string' || declared === '') {
      inventory.unresolved.push(connection);
      continue;
    }
    const file = interpolate(declared, lookup);
    if (file === undefined) {
      inventory.unresolved.push(connection);
      continue;
    }
    if (file === ':memory:') continue;
    inventory.sqlite.push({
      connection,
      file: path.resolve(layout.storageDir, file),
    });
  }
  return inventory;
}

/** UTC, so backups taken on machines in different time zones sort the same way. */
function stamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function backupName(from: string, to: string, date: Date): string {
  return `${stamp(date)}_${from}_to_${to}`;
}

async function existingFiles(file: string): Promise<string[]> {
  const base = path.basename(file);
  const present = new Set(
    await readdir(path.dirname(file)).catch(() => [] as string[]),
  );
  return SQLITE_SUFFIXES.map((suffix) => `${base}${suffix}`).filter((name) =>
    present.has(name),
  );
}

export interface BackedUpDatabase extends SqliteDatabase {
  /** The main file and its journals as copied, by name; empty when the database did not exist yet. */
  files: string[];
}

interface BackupManifest {
  databases: BackedUpDatabase[];
}

async function readManifest(
  layout: Layout,
  backupRelative: string,
): Promise<BackupManifest | undefined> {
  try {
    return JSON.parse(
      await readFile(path.join(layout.root, backupRelative, MANIFEST), 'utf8'),
    ) as BackupManifest;
  } catch {
    return undefined;
  }
}

/**
 * Whether a backup holds a database that can be restored. An upgrade of an application on an external database backs
 * up only `config.yml` and `app.env`, and a backup interrupted before its copy finished has no manifest at all.
 */
export function backupHasDatabase(
  layout: Layout,
  backupRelative: string,
): boolean {
  const file = path.join(layout.root, backupRelative, MANIFEST);
  if (!existsSync(file)) return false;
  try {
    const manifest = JSON.parse(readFileSync(file, 'utf8')) as BackupManifest;
    return manifest.databases.some((database) => database.files.length > 0);
  } catch {
    return false;
  }
}

export async function removeBackup(
  layout: Layout,
  backupRelative: string,
): Promise<void> {
  await rm(path.join(layout.root, backupRelative), {
    recursive: true,
    force: true,
  });
}

export interface BackupResult {
  /** Relative to the root, as recorded in `installer.json`. */
  relative: string;
  databases: BackedUpDatabase[];
}

/** Where a connection's files go inside a backup: one directory per connection, so equal file names never collide. */
function backupDatabaseDir(target: string, connection: string): string {
  return path.join(target, 'sqlite', connection);
}

/**
 * Copies the application's SQLite databases, `config.yml` and `app.env` while the application is stopped, so the files
 * are consistent. The manifest is written last: a backup cut short has none and is never restored from. This is what
 * a failed upgrade restores, not a replacement for regular backups of `storage/`, whose uploaded files it leaves out.
 */
export async function backupForUpgrade(
  layout: Layout,
  name: string,
  databases: readonly SqliteDatabase[],
): Promise<BackupResult> {
  const target = path.join(layout.backupsDir, name);
  await mkdir(target, { recursive: true });
  await copyFile(layout.configFile, path.join(target, 'config.yml'));
  await copyFile(layout.appEnv, path.join(target, 'app.env'));
  const copied: BackedUpDatabase[] = [];
  for (const database of databases) {
    const files = await existingFiles(database.file);
    const directory = backupDatabaseDir(target, database.connection);
    await mkdir(directory, { recursive: true });
    for (const file of files) {
      await copyFile(
        path.join(path.dirname(database.file), file),
        path.join(directory, file),
      );
    }
    copied.push({ ...database, files });
  }
  const manifest: BackupManifest = { databases: copied };
  await writeFile(
    path.join(target, MANIFEST),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return { relative: path.relative(layout.root, target), databases: copied };
}

/**
 * Puts backed-up databases back where the manifest says they were. Journal files that exist now but were not in the
 * backup are removed, since SQLite would otherwise replay a newer write-ahead log onto the older database; a database
 * that did not exist when the backup was taken is removed, since it was created by the release being undone.
 */
export async function restoreDatabase(
  layout: Layout,
  backupRelative: string,
): Promise<BackedUpDatabase[]> {
  const source = path.join(layout.root, backupRelative);
  const manifest = await readManifest(layout, backupRelative);
  if (
    !manifest ||
    !manifest.databases.some((database) => database.files.length > 0)
  ) {
    throw new Error(`${source} holds no SQLite database to restore.`);
  }
  for (const database of manifest.databases) {
    const directory = path.dirname(database.file);
    await mkdir(directory, { recursive: true });
    for (const leftover of await existingFiles(database.file)) {
      if (!database.files.includes(leftover)) {
        await rm(path.join(directory, leftover), { force: true });
      }
    }
    for (const file of database.files) {
      await copyFile(
        path.join(backupDatabaseDir(source, database.connection), file),
        path.join(directory, file),
      );
    }
  }
  return manifest.databases;
}
