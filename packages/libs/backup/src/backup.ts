import { cleanAbandonedWork, temporaryName } from './temporary.js';
import { mkdir, mkdtemp, link, rm, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import {
  describeEntry,
  dumpExtension,
  migrationSummary,
  openArchive,
  withWorkspace,
  writeArchive,
} from './archive.js';
import type { OpenBackup } from './archive.js';
import type {
  DatabaseEngine,
  DatabaseExport,
  EngineContext,
  SnapshotData,
} from './engines.js';
import { asBackupError, BackupError, checkAbort, problem } from './errors.js';
import {
  copyDisk,
  discardDiskStage,
  fileExists,
  installDisk,
  missingFromArchive,
  resolveDisks,
  stageDisk,
  undoDisk,
} from './files.js';
import type { DiskStage } from './files.js';
import { hasOtherMysqlSessions, mysqlEngine } from './mysql.js';
import { assertName, canonical, fileStat } from './paths.js';
import { hasOtherPostgresSessions, postgresEngine } from './postgres.js';
import { sqliteEngine } from './sqlite.js';
import type {
  BackupConnection,
  BackupManifest,
  BackupReader,
  BackupTarget,
  BackupTools,
  ConnectionManifest,
  CreateBackupOptions,
  CreateBackupResult,
  FileReference,
  MigrationFingerprint,
  RestoreBackupOptions,
  RestoreBackupResult,
  RestoreItem,
  ServerInfo,
  VerifyBackupOptions,
  VerifyBackupResult,
} from './types.js';

interface BoundEngine {
  export(
    file: string,
    context: EngineContext & {
      online: boolean;
      collect?: (reader: BackupReader) => Promise<SnapshotData>;
    },
  ): Promise<DatabaseExport>;
  probe(): Promise<ServerInfo>;
  restore(
    file: string,
    server: ServerInfo,
    context: EngineContext,
  ): Promise<void>;
  read<T>(use: (reader: BackupReader) => Promise<T>): Promise<T>;
}

function bindEngine<Connection extends BackupConnection>(
  engine: DatabaseEngine<Connection>,
  connection: Connection,
): BoundEngine {
  return {
    export: (file, context) => engine.export(connection, file, context),
    probe: () => engine.probe(connection),
    restore: (file, server, context) =>
      engine.restore(connection, file, server, context),
    read: (use) => engine.read(connection, use),
  };
}

function database(connection: BackupConnection): BoundEngine {
  switch (connection.dialect) {
    case 'sqlite':
      if (
        !connection.filename ||
        /^(:memory:|file:.*[?&]mode=memory)/i.test(connection.filename)
      ) {
        throw new BackupError(
          'BACKUP_INVALID_TARGET',
          'SQLite backup requires an on-disk database file.',
        );
      }
      return bindEngine(sqliteEngine, connection);
    case 'postgres':
      return bindEngine(postgresEngine, connection);
    case 'mysql':
      return bindEngine(mysqlEngine, connection);
    default:
      throw new BackupError(
        'BACKUP_DIALECT_UNSUPPORTED',
        'The connection uses an unsupported database dialect.',
      );
  }
}

async function verifyDump(
  file: string,
  server: ServerInfo,
  context: EngineContext,
): Promise<void> {
  const engine =
    server.type === 'sqlite'
      ? sqliteEngine
      : server.type === 'postgres'
        ? postgresEngine
        : mysqlEngine;
  try {
    await engine.verify(file, server, context);
  } catch (error) {
    throw asBackupError(
      error,
      'BACKUP_DATABASE_INTEGRITY',
      'The database dump failed its integrity check.',
      context.signal,
    );
  }
}

function assertTarget(target: BackupTarget): void {
  const uniqueNames = (items: readonly { name: string }[]) => {
    for (const item of items) assertName(item.name);
    if (new Set(items.map(({ name }) => name)).size !== items.length) {
      throw new BackupError(
        'BACKUP_INVALID_TARGET',
        'Connection and disk names must be unique within their lists.',
      );
    }
  };
  uniqueNames(target.connections);
  uniqueNames(target.disks);
  if (
    !target.appName ||
    !target.appVersion ||
    target.skipPaths?.some((path) => !isAbsolute(path))
  ) {
    throw new BackupError(
      'BACKUP_INVALID_TARGET',
      'The backup target requires an application name, version, and absolute skip paths.',
    );
  }
  if (
    new Set(target.keyFingerprints.map(({ version }) => version)).size !==
      target.keyFingerprints.length ||
    target.keyFingerprints.some(
      ({ version, fingerprint }) =>
        !version || !/^[a-f0-9]{64}$/.test(fingerprint),
    )
  ) {
    throw new BackupError(
      'BACKUP_INVALID_TARGET',
      'Key fingerprints must be unique by version and use SHA-256.',
    );
  }
}

function select<T extends { name: string }>(
  items: readonly T[],
  include: readonly string[] | undefined,
  exclude: readonly string[] | undefined,
  defaultInclude: (item: T) => boolean,
): Map<string, 'external' | 'excluded' | 'unselected' | undefined> {
  const included = new Set(include ?? []);
  const excluded = new Set(exclude ?? []);
  for (const name of [...included, ...excluded]) {
    if (
      !items.some((item) => item.name === name) ||
      (included.has(name) && excluded.has(name))
    ) {
      throw new BackupError(
        'BACKUP_INVALID_SELECTION',
        'A selected name is unknown or appears in both include and exclude lists.',
        { name },
      );
    }
  }
  return new Map(
    items.map((item) => {
      if (excluded.has(item.name)) return [item.name, 'excluded'];
      if (included.has(item.name)) return [item.name, undefined];
      if (!include)
        return [item.name, defaultInclude(item) ? undefined : 'external'];
      return [item.name, 'unselected'];
    }),
  );
}

async function collectReferences(
  connection: BackupConnection,
  reader: BackupReader,
): Promise<FileReference[]> {
  const references: FileReference[] = [];
  for await (const entry of connection.readFileReferences?.(reader) ?? [])
    references.push(entry);
  return references;
}

async function collectSnapshot(
  connection: BackupConnection,
  reader: BackupReader,
): Promise<SnapshotData> {
  return {
    migrations: await connection.readMigrations(reader),
    references: await collectReferences(connection, reader),
  };
}

async function inConnection<T>(
  connection: BackupConnection,
  code: string,
  use: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  checkAbort(signal);
  try {
    return await use();
  } catch (error) {
    const failure = asBackupError(
      error,
      code,
      'The database operation failed.',
      signal,
    );
    throw new BackupError(failure.code, failure.message, {
      ...failure.details,
      connection: connection.name,
    });
  }
}

async function verifyDumps(
  backup: OpenBackup,
  context: EngineContext,
): Promise<void> {
  for (const entry of backup.manifest.connections) {
    checkAbort(context.signal);
    if (entry.mode !== 'dump') continue;
    try {
      await verifyDump(
        join(backup.directory, entry.path),
        entry.server,
        context,
      );
    } catch (error) {
      const failure = asBackupError(
        error,
        'BACKUP_DATABASE_INTEGRITY',
        'The database dump failed its integrity check.',
        context.signal,
      );
      throw new BackupError(failure.code, failure.message, {
        ...failure.details,
        connection: entry.name,
      });
    }
  }
}

type IncludedConnection = Exclude<ConnectionManifest, { mode: 'excluded' }>;

function assertServerMatches(
  archive: IncludedConnection,
  server: ServerInfo,
): void {
  const saved = archive.server;
  if (
    server.type !== saved.type ||
    server.majorVersion !== saved.majorVersion ||
    server.charset !== saved.charset ||
    server.lowerCaseTableNames !== saved.lowerCaseTableNames
  ) {
    throw new BackupError(
      'RESTORE_SERVER_MISMATCH',
      'The database server type, major version, character set, or table-name casing differs from the backup.',
      {
        connection: archive.name,
        expected: saved,
        actual: server,
      },
    );
  }
}

function migrationKey(migration: MigrationFingerprint): string {
  return JSON.stringify([migration.packageName, migration.name]);
}

async function assertDistinctDatabases(
  target: BackupTarget,
  touched: ReadonlySet<string>,
): Promise<void> {
  const seen = new Map<string, string>();
  for (const connection of target.connections) {
    const identity =
      connection.dialect === 'sqlite'
        ? [connection.dialect, await canonical(connection.filename)]
        : [
            connection.dialect,
            connection.dialect === 'mysql' && connection.socketPath
              ? await canonical(connection.socketPath)
              : (connection.host ?? '127.0.0.1')
                  .toLowerCase()
                  .replace(/^localhost$/, '127.0.0.1'),
            connection.port ??
              (connection.dialect === 'postgres' ? 5432 : 3306),
            connection.database,
          ];
    const key = JSON.stringify(identity);
    const duplicate = seen.get(key);
    if (duplicate && (touched.has(connection.name) || touched.has(duplicate))) {
      throw new BackupError(
        'BACKUP_DATABASE_SCOPE_CONFLICT',
        'Two connections share a database; restoring either connection would also change the other.',
        {
          connections: [duplicate, connection.name],
        },
      );
    }
    seen.set(key, connection.name);
  }
}

async function verifyTarget(
  backup: OpenBackup,
  target: BackupTarget,
  signal?: AbortSignal,
): Promise<void> {
  assertTarget(target);
  const { manifest } = backup;
  if (
    manifest.app.name !== target.appName ||
    manifest.app.version !== target.appVersion
  ) {
    throw new BackupError(
      'RESTORE_APP_VERSION_MISMATCH',
      'The application name or version differs from the backup.',
      {
        expected: manifest.app,
        actual: { name: target.appName, version: target.appVersion },
      },
    );
  }
  const keys = new Map(
    target.keyFingerprints.map(({ version, fingerprint }) => [
      version,
      fingerprint,
    ]),
  );
  for (const { version, fingerprint } of manifest.secrets.fingerprints) {
    if (keys.get(version) !== fingerprint) {
      throw new BackupError(
        'RESTORE_KEY_FINGERPRINT_MISMATCH',
        'A secrets key version is missing or its fingerprint differs from the backup.',
        { version },
      );
    }
  }
  await assertDistinctDatabases(
    target,
    new Set(
      manifest.connections
        .filter(({ mode }) => mode !== 'excluded')
        .map(({ name }) => name),
    ),
  );
  const connections = new Map(
    target.connections.map((connection) => [connection.name, connection]),
  );
  for (const entry of manifest.connections) {
    if (entry.mode === 'excluded') continue;
    const connection = connections.get(entry.name);
    if (!connection) {
      throw new BackupError(
        'RESTORE_CONNECTION_MISSING',
        'A database connection in the backup is missing from the target.',
        { connection: entry.name },
      );
    }
    if (entry.dialect !== connection.dialect) {
      throw new BackupError(
        'RESTORE_SERVER_MISMATCH',
        'The database dialect differs from the backup.',
        { connection: entry.name },
      );
    }
    await inConnection(
      connection,
      'RESTORE_PREFLIGHT_FAILED',
      async () => {
        assertServerMatches(entry, await database(connection).probe());
        const catalog = new Set(
          (await connection.readMigrationCatalog()).map((entry) =>
            JSON.stringify([migrationKey(entry), entry.checksum]),
          ),
        );
        const mismatch = entry.migrations.history.find(
          (entry) =>
            !catalog.has(JSON.stringify([migrationKey(entry), entry.checksum])),
        );
        if (mismatch) {
          throw new BackupError(
            'RESTORE_MIGRATION_MISMATCH',
            'An applied migration is missing or its checksum differs from the backup.',
            {
              packageName: mismatch.packageName,
              migration: mismatch.name,
            },
          );
        }
      },
      signal,
    );
  }
}

async function stopped<T>(
  target: BackupTarget,
  operation: () => Promise<T>,
): Promise<T> {
  if (!target.withStoppedApp) {
    throw new BackupError(
      'RESTORE_STOP_GUARD_REQUIRED',
      'A stopped-application guard is required for this operation.',
    );
  }
  return target.withStoppedApp(operation);
}

export async function createBackup(
  target: BackupTarget,
  options: CreateBackupOptions,
): Promise<CreateBackupResult> {
  try {
    assertTarget(target);
    checkAbort(options.signal);
    const online = options.online ?? true;
    const connections = select(
      target.connections,
      options.includeConnections,
      options.excludeConnections,
      ({ schemaManagement }) => schemaManagement === 'managed',
    );
    const disks = select(
      target.disks,
      options.includeDisks,
      options.excludeDisks,
      () => true,
    );
    await assertDistinctDatabases(
      target,
      new Set(
        [...connections].filter(([, reason]) => !reason).map(([name]) => name),
      ),
    );
    const file = await canonical(options.output);
    const diskNames = target.disks
      .filter(({ name, driver }) => driver === 'fs' && !disks.get(name))
      .map(({ name }) => name);
    const execute = () =>
      withWorkspace(options.tmpDir, async (workspace) => {
        if (await fileStat(file))
          throw new BackupError(
            'BACKUP_OUTPUT_EXISTS',
            'The requested backup output already exists.',
          );
        const payload = join(workspace, 'payload');
        const prefix = `.${basename(file)}.partial-`;
        await cleanAbandonedWork(dirname(file), prefix, 'file');
        const partial = join(dirname(file), temporaryName(prefix));
        const resolved = await resolveDisks(target, [
          dirname(file),
          workspace,
          options.tmpDir ?? tmpdir(),
        ]);
        const tools = target.tools ?? {};
        const entries: Awaited<ReturnType<typeof describeEntry>>[] = [];
        const references: FileReference[] = [];
        let capturedPaths: Set<string> | undefined;
        const manifest: BackupManifest = {
          formatVersion: 1,
          app: { name: target.appName, version: target.appVersion },
          createdAt: new Date().toISOString(),
          online,
          connections: [],
          disks: [],
          secrets: {
            fingerprints: target.keyFingerprints.map((key) => ({ ...key })),
          },
          indexSha256: '',
          limitations: [],
        };
        const capture = async () => {
          await mkdir(join(payload, 'db'), { recursive: true, mode: 0o700 });
          for (const connection of target.connections) {
            const { name, dialect } = connection;
            const reason = connections.get(name);
            if (reason) {
              manifest.connections.push({
                name,
                dialect,
                mode: 'excluded',
                reason,
              });
              continue;
            }
            await inConnection(
              connection,
              'BACKUP_EXPORT_FAILED',
              async () => {
                const path = `db/${name}.${dumpExtension[dialect]}`;
                const filename = join(payload, path);
                const data = await clientWorkspace(
                  workspace,
                  tools,
                  options.signal,
                  (context) =>
                    database(connection).export(filename, {
                      ...context,
                      online,
                      collect: (reader) => collectSnapshot(connection, reader),
                    }),
                );
                const entry = {
                  name,
                  dialect,
                  server: data.server,
                  snapshot: data.snapshot,
                  migrations: migrationSummary(data.migrations),
                };
                for (const reference of data.references)
                  references.push(reference);
                const info = await describeEntry(payload, path, options.signal);
                manifest.connections.push({
                  ...entry,
                  mode: 'dump',
                  ...info,
                });
                entries.push(info);
              },
              options.signal,
            );
          }
          for (const disk of target.disks) {
            checkAbort(options.signal);
            const reason = disks.get(disk.name);
            if (reason && reason !== 'external') {
              manifest.disks.push({
                name: disk.name,
                driver: disk.driver,
                mode: 'excluded',
                reason,
              });
            } else if (disk.driver === 'fs') {
              const local = await copyDisk(
                resolved.get(disk.name)!,
                payload,
                options.signal,
              );
              manifest.disks.push(local.manifest);
              for (const entry of local.entries) entries.push(entry);
            } else {
              manifest.disks.push({ ...disk, mode: 'reference' });
            }
          }
          capturedPaths = new Set(entries.map(({ path }) => path));
          const missing = missingFromArchive(
            references,
            new Set(diskNames),
            capturedPaths,
          );
          if (missing.length) {
            throw new BackupError(
              'BACKUP_REFERENCED_FILE_MISSING',
              'A database snapshot references files missing from the backup.',
              { missing },
            );
          }
        };
        if (online && target.withDeferredDeletes) {
          await target.withDeferredDeletes(diskNames, capture, (file) =>
            diskNames.find((name) => {
              const key = relative(resolved.get(name)!.root, file)
                .split(sep)
                .join('/');
              return capturedPaths?.has(`files/${name}/${key}`);
            }),
          );
        } else {
          if (online && diskNames.length) {
            throw new BackupError(
              'BACKUP_DELETE_GUARD_REQUIRED',
              'Online backup of a local disk requires a Drive deletion deferral guard.',
            );
          }
          await capture();
        }
        try {
          await writeArchive(
            payload,
            partial,
            entries,
            manifest,
            options.signal,
          );
          const backup = await openArchive(
            partial,
            join(workspace, 'verified'),
            undefined,
            options.signal,
          );
          await verifyDumps(backup, {
            directory: workspace,
            tools,
            signal: options.signal,
          });
          const size = (await stat(partial)).size;
          checkAbort(options.signal);
          // A hard link publishes the verified inode atomically and refuses to overwrite an existing archive.
          try {
            await link(partial, file);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              !('code' in error) ||
              error.code !== 'EEXIST'
            )
              throw error;
            throw new BackupError(
              'BACKUP_OUTPUT_EXISTS',
              'The requested backup output already exists.',
            );
          }
          return {
            file,
            size,
            sha256: backup.sha256,
            manifest: backup.manifest,
          };
        } finally {
          await rm(partial, { force: true });
        }
      });
    return online ? await execute() : await stopped(target, execute);
  } catch (error) {
    throw asBackupError(
      error,
      'BACKUP_CREATE_FAILED',
      'The backup could not be created.',
      options.signal,
    );
  }
}

export async function verifyBackup(
  file: string,
  options: VerifyBackupOptions = {},
): Promise<VerifyBackupResult> {
  try {
    checkAbort(options.signal);
    return await withWorkspace(options.tmpDir, async (workspace) => {
      const backup = await openArchive(
        file,
        join(workspace, 'archive'),
        options.sha256,
        options.signal,
      );
      await verifyDumps(backup, {
        directory: workspace,
        tools: options.target?.tools ?? options.tools ?? {},
        signal: options.signal,
      });
      if (options.target)
        await verifyTarget(backup, options.target, options.signal);
      return {
        ok: true,
        problems: [],
        manifest: backup.manifest,
        sha256: backup.sha256,
      };
    });
  } catch (error) {
    return {
      ok: false,
      problems: [
        problem(
          error,
          'BACKUP_VERIFY_FAILED',
          'The backup could not be verified.',
        ),
      ],
    };
  }
}

export async function inspectBackup(
  file: string,
  options: Pick<VerifyBackupOptions, 'sha256' | 'tmpDir' | 'signal'> = {},
): Promise<BackupManifest> {
  checkAbort(options.signal);
  try {
    return await withWorkspace(
      options.tmpDir,
      async (workspace) =>
        (
          await openArchive(
            file,
            join(workspace, 'archive'),
            options.sha256,
            options.signal,
          )
        ).manifest,
    );
  } catch (error) {
    throw asBackupError(
      error,
      'BACKUP_INSPECT_FAILED',
      'The backup could not be inspected.',
      options.signal,
    );
  }
}

type Dump = Extract<ConnectionManifest, { mode: 'dump' }>;

interface RestoreDatabase {
  config: BackupConnection;
  archive: Dump;
  status: RestoreItem;
  previous: string;
  engine: BoundEngine;
}

interface RestoreDisk {
  stage: DiskStage;
  status: RestoreItem;
}

async function clientWorkspace<T>(
  workspace: string,
  tools: BackupTools,
  signal: AbortSignal | undefined,
  operation: (context: EngineContext) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(join(workspace, 'client-'));
  try {
    return await operation({ directory, tools, signal });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function restoreSelection(
  manifest: BackupManifest,
  options: RestoreBackupOptions,
): Dump[] {
  const partial = Boolean(options.connections?.length);
  if (
    partial !== Boolean(options.allowPartial) ||
    (partial && options.filesOnly)
  ) {
    throw new BackupError(
      'RESTORE_PARTIAL_NOT_ALLOWED',
      'Partial restore requires named connections and allowPartial. Files-only restore does not accept a connection selection.',
    );
  }
  if (options.filesOnly) return [];
  const dumps = manifest.connections.filter(
    (entry): entry is Dump => entry.mode === 'dump',
  );
  const selected = new Set(options.connections);
  if (partial) {
    for (const name of selected) {
      if (!dumps.some((entry) => entry.name === name)) {
        throw new BackupError(
          'RESTORE_CONNECTION_NOT_IN_BACKUP',
          'A selected connection has no database dump in the backup.',
          { connection: name },
        );
      }
    }
    return dumps.filter((entry) => selected.has(entry.name));
  }
  return dumps;
}

async function findMissingReferences(
  target: BackupTarget,
  backup: OpenBackup,
  disks: Awaited<ReturnType<typeof resolveDisks>>,
  signal?: AbortSignal,
): Promise<FileReference[]> {
  const missing = new Map<string, FileReference>();
  const included = new Set(
    backup.manifest.connections
      .filter(({ mode }) => mode !== 'excluded')
      .map(({ name }) => name),
  );
  for (const connection of target.connections) {
    if (!included.has(connection.name) || !connection.readFileReferences)
      continue;
    const engine = database(connection);
    const references = await inConnection(
      connection,
      'RESTORE_REFERENCE_CHECK_FAILED',
      () => engine.read((reader) => collectReferences(connection, reader)),
      signal,
    );
    for (const ref of references) {
      checkAbort(signal);
      const disk = disks.get(ref.disk);
      const exists = disk
        ? await fileExists(disk, ref.key)
        : await target.remoteFileExists?.(ref);
      if (exists === false)
        missing.set(JSON.stringify([ref.disk, ref.key]), ref);
    }
  }
  return [...missing.values()];
}

async function restoreVerified(
  file: string,
  backup: OpenBackup,
  target: BackupTarget,
  options: RestoreBackupOptions,
  workspace: string,
): Promise<RestoreBackupResult> {
  const { manifest } = backup;
  const tools = target.tools ?? {};
  await verifyDumps(backup, {
    directory: workspace,
    tools,
    signal: options.signal,
  });
  await verifyTarget(backup, target, options.signal);
  const selection = restoreSelection(manifest, options);
  const selected = new Set(selection.map(({ name }) => name));
  const restoreFiles = !options.connections?.length;
  const disks = await resolveDisks(target, [
    file,
    workspace,
    options.tmpDir ?? tmpdir(),
  ]);
  const connections = manifest.connections.map(({ name }): RestoreItem => ({
    name,
    status: selected.has(name) ? 'pending' : 'skipped',
  }));
  const diskStatuses = manifest.disks.map(({ name, mode }): RestoreItem => ({
    name,
    status: restoreFiles && mode === 'files' ? 'pending' : 'skipped',
  }));
  const stages: RestoreDisk[] = [];
  const attempted: RestoreDatabase[] = [];
  const preservedStages = new Set<DiskStage>();
  let recoveryDirectory: string | undefined;
  let preserveDatabaseExports = false;
  let active: RestoreItem | undefined;
  let success = false;
  try {
    for (const [index, entry] of manifest.disks.entries()) {
      if (!restoreFiles || entry.mode !== 'files') continue;
      active = diskStatuses[index]!;
      const disk = disks.get(entry.name);
      if (!disk)
        throw new BackupError(
          'RESTORE_DISK_MISSING',
          'A local disk in the backup is missing from the target.',
          { disk: entry.name },
        );
      const stage = await stageDisk(
        disk,
        entry,
        join(backup.directory, 'files', entry.name),
        options.signal,
      );
      stages.push({ stage, status: active });
    }
    const prepared: RestoreDatabase[] = [];
    if (selection.length) {
      recoveryDirectory = await mkdtemp(
        join(options.tmpDir ?? tmpdir(), 'nocobase-pre-restore-'),
      );
      for (const archive of selection) {
        active = connections.find(({ name }) => name === archive.name)!;
        const config = target.connections.find(
          ({ name }) => name === archive.name,
        )!;
        const engine = database(config);
        const previous = join(recoveryDirectory, basename(archive.path));
        await inConnection(
          config,
          'RESTORE_PRE_EXPORT_FAILED',
          () =>
            clientWorkspace(
              workspace,
              tools,
              options.signal,
              async (context) => {
                const snapshot = await engine.export(previous, {
                  ...context,
                  online: false,
                });
                assertServerMatches(archive, snapshot.server);
                await verifyDump(previous, snapshot.server, context);
              },
            ),
          options.signal,
        );
        prepared.push({ config, archive, engine, previous, status: active });
      }
    }
    for (const item of prepared) {
      active = item.status;
      checkAbort(options.signal);
      attempted.push(item);
      await inConnection(
        item.config,
        'RESTORE_DATABASE_FAILED',
        () =>
          clientWorkspace(workspace, tools, options.signal, (context) =>
            item.engine.restore(
              join(backup.directory, item.archive.path),
              item.archive.server,
              context,
            ),
          ),
        options.signal,
      );
      active.status = 'restored';
    }
    for (const disk of stages) {
      active = disk.status;
      await installDisk(disk.stage, options.signal);
      active.status = 'restored';
    }
    active = undefined;
    const missingFiles = await findMissingReferences(
      target,
      backup,
      disks,
      options.signal,
    );
    checkAbort(options.signal);
    success = true;
    return { connections, disks: diskStatuses, missingFiles };
  } catch (error) {
    const primary = problem(
      error,
      'RESTORE_FAILED',
      'The restore could not be completed.',
    );
    if (active) {
      active.status = 'failed';
      active.problem = primary;
    }
    for (const { stage, status } of [...stages].reverse()) {
      if (!stage.applied.length && status.status !== 'restored') continue;
      try {
        await undoDisk(stage);
        status.status = 'rolled-back';
      } catch (rollbackError) {
        status.status = 'rollback-failed';
        status.problem = problem(
          rollbackError,
          'RESTORE_DISK_ROLLBACK_FAILED',
          'The previous contents of the disk could not be put back.',
        );
        preservedStages.add(stage);
      }
    }
    for (const item of [...attempted].reverse()) {
      try {
        await clientWorkspace(workspace, tools, undefined, (context) =>
          item.engine.restore(item.previous, item.archive.server, context),
        );
        item.status.status = 'rolled-back';
      } catch (rollbackError) {
        preserveDatabaseExports = true;
        item.status.status = 'rollback-failed';
        item.status.problem = problem(
          rollbackError,
          'RESTORE_DATABASE_ROLLBACK_FAILED',
          'The previous database contents could not be imported.',
        );
      }
    }
    const code =
      preserveDatabaseExports || preservedStages.size
        ? 'RESTORE_ROLLBACK_FAILED'
        : primary.code;
    throw new BackupError(
      code,
      code === 'RESTORE_ROLLBACK_FAILED'
        ? 'Restore failed and some previous data could not be put back.'
        : primary.message,
      {
        connections,
        disks: diskStatuses,
        cause: primary,
        recoveryDirectory: preserveDatabaseExports
          ? recoveryDirectory
          : undefined,
        diskRecoveryDirectories: [...preservedStages].map(
          ({ directory }) => directory,
        ),
      },
    );
  } finally {
    for (const { stage } of [...stages].reverse()) {
      if (!preservedStages.has(stage)) await discardDiskStage(stage, success);
    }
    if (recoveryDirectory && !preserveDatabaseExports)
      await rm(recoveryDirectory, { recursive: true, force: true });
  }
}

export async function restoreBackup(
  file: string,
  target: BackupTarget,
  options: RestoreBackupOptions = {},
): Promise<RestoreBackupResult> {
  try {
    checkAbort(options.signal);
    return await stopped(target, () =>
      withWorkspace(options.tmpDir, async (workspace) => {
        const backup = await openArchive(
          file,
          join(workspace, 'archive'),
          options.sha256,
          options.signal,
        );
        return restoreVerified(file, backup, target, options, workspace);
      }),
    );
  } catch (error) {
    throw asBackupError(
      error,
      'RESTORE_FAILED',
      'The backup could not be restored.',
      options.signal,
    );
  }
}

/** Check server sessions before an offline operation. Local startup coordination is held by the caller. */
export async function assertBackupDatabasesIdle(
  connections: readonly BackupConnection[],
): Promise<void> {
  for (const connection of connections) {
    if (
      connection.dialect === 'sqlite' ||
      connection.schemaManagement === 'external'
    )
      continue;
    await inConnection(connection, 'RESTORE_SESSION_CHECK_FAILED', async () => {
      const busy =
        connection.dialect === 'postgres'
          ? await hasOtherPostgresSessions(connection)
          : await hasOtherMysqlSessions(connection);
      if (busy)
        throw new BackupError(
          'RESTORE_APP_RUNNING',
          'Database sessions are still connected. Stop the application and disconnect clients.',
        );
    });
  }
}
