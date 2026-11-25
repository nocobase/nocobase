import { lstat, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

import type { InProcessCommandRunner } from './app-command.ts';
import { HostManagementError } from './scopes.ts';

interface RestoreStorage {
  readonly files: readonly { path: string; database: boolean }[];
  readonly postgres: readonly { database: string; username: string }[];
}

/** Use the release's own runtime config and backup adapter, including its defaults and environment overrides. */
const INSPECT_STORAGE = `
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolveAppBackupTarget } from '@nocobase/app-server';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { createApp } from './server/app.js';
import definition from './server/runtime.js';

const runtime = await resolveStandaloneAppRuntime(definition, {
  rootDir: process.cwd(),
  consoleLogStream: 'stderr',
});
try {
  const app = await createApp(runtime);
  try {
    const target = await resolveAppBackupTarget(app);
    const files = [];
    const postgres = [];
    for (const disk of target.disks) {
      if (disk.driver !== 'fs') throw Error('Unsupported restore disk.');
      files.push({ path: disk.root, database: false });
    }
    for (const connection of target.connections) {
      if (connection.dialect === 'sqlite') {
        files.push({ path: connection.filename, database: true });
      } else if (connection.dialect === 'postgres') {
        if (process.argv[1] === 'target') await assertDatabaseOwner(connection);
        postgres.push({ database: connection.database, username: connection.username });
      } else {
        throw Error('Unsupported restore database.');
      }
    }
    process.stdout.write(JSON.stringify({ files, postgres }));
  } finally {
    await app.shutdown();
  }
} finally {
  await runtime.scope.destroy();
}

async function assertDatabaseOwner(connection) {
  const require = createRequire(import.meta.resolve('@nocobase/db-postgres'));
  const { Client } = require('pg');
  const { database, username, password, host, port, tls } = connection;
  const ssl = tls && {
    rejectUnauthorized: tls.mode === 'verify-full',
    ca: tls.caFile && await readFile(tls.caFile, 'utf8'),
  };
  const client = new Client({
    database, user: username, password: password ?? '',
    host: host ?? 'localhost', port: port ?? 5432, ssl: ssl ?? false,
    connectionTimeoutMillis: 10000, statement_timeout: 10000,
  });
  try {
    await client.connect();
    const { rows: [row] } = await client.query(
      "SELECT d.datname, r.rolname, d.datdba = r.oid " +
      "AND NOT (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls) " +
      "AND NOT EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member = r.oid) AS owned " +
      "FROM pg_database d JOIN pg_roles r ON r.rolname = current_user WHERE d.datname = current_database()"
    );
    if (row?.datname !== database || row.rolname !== username || !row.owned)
      throw Error('The application role must own the target database and have no administrative privileges.');
  } finally {
    await client.end();
  }
}
`;

function unsafe(message: string): never {
  throw new HostManagementError(message, 'BACKUP_TARGET_UNSAFE');
}

async function inspectStorage(
  runner: InProcessCommandRunner,
  checkDatabaseOwner: boolean,
): Promise<RestoreStorage> {
  try {
    const result = await runner.inspectStorage(
      INSPECT_STORAGE,
      checkDatabaseOwner,
    );
    if (result.exitCode !== 0) throw new Error('Storage inspection failed.');
    return JSON.parse(result.stdout) as RestoreStorage;
  } catch {
    // Release diagnostics can contain database credentials or private configuration paths.
    unsafe(
      checkDatabaseOwner
        ? 'The target must use local storage and a dedicated SQLite or PostgreSQL database.'
        : 'The source App storage could not be identified.',
    );
  }
}

function contains(parent: string, file: string): boolean {
  const relative = path.relative(parent, file);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function canonical(file: string): Promise<string> {
  try {
    return await realpath(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = path.dirname(file);
    if (parent === file) throw error;
    return path.join(await canonical(parent), path.basename(file));
  }
}

export async function managedVolume(
  volumesDir: string,
  appId: string,
): Promise<string> {
  const expected = path.join(await canonical(volumesDir), appId);
  for (const dir of [
    expected,
    path.join(expected, 'storage'),
    path.join(expected, 'preflight'),
    path.join(expected, 'configs'),
  ]) {
    const entry = await lstat(dir).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
    if (entry && !entry.isDirectory())
      unsafe('A managed restore volume must use real directories.');
  }
  return expected;
}

export async function assertCopyStorage(
  appId: string,
  targetStorageDir: string,
  source: InProcessCommandRunner,
  target: InProcessCommandRunner,
): Promise<void> {
  const [sourceStorage, targetStorage] = await Promise.all([
    inspectStorage(source, false),
    inspectStorage(target, true),
  ]);
  const targetRoot = await realpath(targetStorageDir);
  const sourceFiles = await Promise.all(
    sourceStorage.files.map((file) => canonical(file.path)),
  );
  for (const file of targetStorage.files) {
    const destination = await canonical(file.path);
    if (
      !contains(targetRoot, destination) ||
      sourceFiles.some(
        (sourcePath) =>
          contains(sourcePath, destination) ||
          contains(destination, sourcePath),
      )
    ) {
      unsafe(
        'Target database files and disks must be inside its own storage and separate from the source.',
      );
    }
    if (file.database) {
      const entry = await stat(destination).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        },
      );
      if (!entry?.isFile() || entry.nlink !== 1)
        unsafe(
          'A target SQLite database must be a separate, pre-provisioned file.',
        );
    }
  }
  for (const targetDatabase of targetStorage.postgres) {
    if (targetDatabase.database !== appId || targetDatabase.username !== appId)
      unsafe(
        'The target PostgreSQL database and its owner must be named for the target App.',
      );
    // Also refuse equal names on different endpoints, which may be aliases of one PostgreSQL server.
    if (
      sourceStorage.postgres.some(
        (sourceDatabase) =>
          sourceDatabase.database === targetDatabase.database ||
          sourceDatabase.username === targetDatabase.username,
      )
    ) {
      unsafe(
        'A target PostgreSQL database and owner must be distinct from the source.',
      );
    }
  }
}
