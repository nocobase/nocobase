import { realpath } from 'node:fs/promises';
import { resolveDefaultAppConfigFile } from '../config/index.js';
import { createHash } from 'node:crypto';
import { relative, resolve, sep } from 'node:path';
import { BackupError } from '@nocobase/backup';
import type {
  BackupConnection,
  BackupDisk,
  BackupReader,
  BackupTarget,
  FileReference,
  MigrationFingerprint,
} from '@nocobase/backup';
import { loadMigrations } from '@nocobase/db';
import type { ConnectionConfig } from '@nocobase/db';
import { createDriveManager, withDriveBackup } from '@nocobase/drive';
import type { Application } from '../application/index.js';
import { resolveConnections } from '../database/manager.js';
import {
  defaultConnectionName,
  planAppDatabaseTasks,
} from '../database/plan.js';
import type {
  AppDatabaseConfig,
  AppDatabaseMigrationConfig,
} from '../database/types.js';
import { resolveAppDriveConfig } from '../drive/config.js';
import type { AppLoggingConfig } from '../logging/config.js';
import { createSecretsService } from '../secrets/service.js';
import { readAppPackage } from '../support/app-package.js';
import type { AppBackupConfig, AppBackupFileReference } from './config.js';
import { enterRunningApplication, withStoppedApplication } from './guard.js';

function text(config: object, key: string): string | undefined {
  const value: unknown = Reflect.get(config, key);
  return typeof value === 'string' ? value : undefined;
}

function connectionConfig(
  name: string,
  source: ConnectionConfig,
  migration: AppDatabaseMigrationConfig | undefined,
  refs: readonly AppBackupFileReference[],
  preference: NonNullable<AppBackupConfig['connections']>[string] | undefined,
): BackupConnection {
  const schemaInput: unknown = Reflect.get(source, 'schema');
  const schema =
    source.dialect === 'postgres'
      ? typeof schemaInput === 'string'
        ? schemaInput
        : Array.isArray(schemaInput) && typeof schemaInput[0] === 'string'
          ? schemaInput[0]
          : 'public'
      : undefined;
  const common = {
    name,
    schemaManagement: source.schemaManagement ?? 'managed',
    async readMigrations(
      reader: BackupReader,
    ): Promise<MigrationFingerprint[]> {
      const table = {
        name: migration?.tableName ?? '__nocobase_migrations',
        schema,
      };
      if (!(await reader.hasTable(table))) return [];
      const records: { id: number; migration: MigrationFingerprint }[] = [];
      for await (const row of reader.readRows(table, [
        'id',
        'package_name',
        'name',
        'checksum',
      ])) {
        if (
          typeof row.package_name !== 'string' ||
          typeof row.name !== 'string' ||
          typeof row.checksum !== 'string'
        ) {
          throw new BackupError(
            'BACKUP_MIGRATION_HISTORY_INVALID',
            'The snapshot contains invalid migration history.',
            { connection: name },
          );
        }
        records.push({
          id: Number(row.id),
          migration: {
            packageName: row.package_name,
            name: row.name,
            checksum: row.checksum,
          },
        });
      }
      return records
        .sort((a, b) => a.id - b.id)
        .map((record) => record.migration);
    },
    async readMigrationCatalog(): Promise<MigrationFingerprint[]> {
      if (!migration) return [];
      const migrations = await loadMigrations({
        sources: migration.sources ?? [],
        extensions: migration.extensions,
      });
      return migrations.flatMap(
        ({ packageName, name, checksum, legacyChecksum }) => [
          { packageName, name, checksum },
          ...(legacyChecksum
            ? [{ packageName, name, checksum: legacyChecksum }]
            : []),
        ],
      );
    },
    async *readFileReferences(
      reader: BackupReader,
    ): AsyncGenerator<FileReference> {
      for (const table of await reader.findTables(['disk', 'key'])) {
        yield* readReferences(reader, table, 'key', { diskColumn: 'disk' });
      }
      for (const ref of refs) {
        const table = { name: ref.table, schema: ref.schema ?? schema };
        if (await reader.hasTable(table))
          yield* readReferences(reader, table, ref.keyColumn, ref);
      }
    },
  };

  if (source.dialect === 'sqlite') {
    const filename = text(source, 'filename');
    if (filename) return { ...common, dialect: 'sqlite', filename };
  }
  if (source.dialect === 'postgres' || source.dialect === 'mysql') {
    const database = text(source, 'database');
    const username = text(source, 'username');
    if (database && username) {
      const ssl: unknown = Reflect.get(source, 'ssl');
      const standardTls =
        typeof ssl === 'object' &&
        ssl !== null &&
        Reflect.get(ssl, 'rejectUnauthorized') === false
          ? 'require'
          : 'verify-full';
      if (
        typeof ssl === 'object' &&
        ssl !== null &&
        !preference?.tls &&
        Object.keys(ssl).some((key) => key !== 'rejectUnauthorized')
      ) {
        throw new BackupError(
          'BACKUP_TLS_CONFIG_REQUIRED',
          'Set backup connection TLS options for the database client.',
          { connection: name },
        );
      }
      const port: unknown = Reflect.get(source, 'port');
      const server = {
        ...common,
        database,
        username,
        host: text(source, 'host'),
        port: typeof port === 'number' ? port : undefined,
        password: text(source, 'password'),
        hosting: preference?.hosting,
        tls: preference?.tls ?? (ssl ? { mode: standardTls } : undefined),
      };
      return source.dialect === 'postgres'
        ? { ...server, dialect: 'postgres' }
        : {
            ...server,
            dialect: 'mysql',
            socketPath: text(source, 'socketPath'),
          };
    }
    throw new BackupError(
      'BACKUP_INVALID_TARGET',
      'The database connection requires a database and username.',
      { connection: name },
    );
  }
  throw new BackupError(
    'BACKUP_DIALECT_UNSUPPORTED',
    'The connection uses an unsupported backup dialect.',
    { connection: name, dialect: source.dialect },
  );
}

async function* readReferences(
  reader: BackupReader,
  table: { name: string; schema?: string },
  keyColumn: string,
  source: { disk?: string; diskColumn?: string },
): AsyncGenerator<FileReference> {
  const columns = source.diskColumn
    ? [keyColumn, source.diskColumn]
    : [keyColumn];
  for await (const row of reader.readRows(table, columns)) {
    const key = row[keyColumn];
    const disk =
      source.disk ?? (source.diskColumn ? row[source.diskColumn] : undefined);
    if (typeof key === 'string' && key && typeof disk === 'string' && disk)
      yield { key, disk };
  }
}

function contains(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    !rel ||
    (rel !== '..' &&
      !rel.startsWith('..' + sep) &&
      resolve(parent, rel) === child)
  );
}

export async function resolveAppBackupTarget(
  app: Application,
): Promise<BackupTarget> {
  const backup = app.config.get<AppBackupConfig>('backup') ?? {};
  const manifest = await readAppPackage(app.paths.root());
  if (!manifest.version)
    throw new BackupError(
      'BACKUP_APP_VERSION_MISSING',
      'The application package manifest must declare its version.',
    );
  const database = app.config.get<AppDatabaseConfig>('database');
  const connections: BackupConnection[] = [];
  if (database && database.default !== 'none') {
    const plan = planAppDatabaseTasks(database, ['migrations'], {
      all: true,
      paths: app.paths,
      contributions: app.databaseTaskContributions,
    });
    const phases = new Map(plan.map((task) => [task.connection, task.config]));
    const resolved = resolveConnections(
      database.connections,
      app.paths,
      database.drivers,
      database.metadataStore,
      database,
    );
    for (const [name, config] of Object.entries(resolved)) {
      connections.push(
        connectionConfig(
          name,
          config,
          phases.get(name),
          (backup.fileReferences ?? []).filter(
            (ref) =>
              (ref.connection ?? defaultConnectionName(database)) === name,
          ),
          backup.connections?.[name],
        ),
      );
    }
  }
  const drive = resolveAppDriveConfig(app.config);
  const manager = drive && createDriveManager(drive);
  const disks: BackupDisk[] = [];
  for (const [name, definition] of Object.entries(drive?.disks ?? {})) {
    if (typeof definition === 'function') continue;
    if (definition.driver === 'fs') {
      const root = await realpath(definition.location).catch(
        (error: unknown) => {
          if (
            !(error instanceof Error) ||
            !('code' in error) ||
            error.code !== 'ENOENT'
          )
            throw error;
          return resolve(definition.location);
        },
      );
      disks.push({
        name,
        driver: 'fs',
        root,
        excludePaths: backup.excludePaths,
      });
    } else {
      disks.push({
        name,
        driver: definition.driver,
        bucket: definition.bucket,
      });
    }
  }
  const roots = disks.flatMap((disk) =>
    disk.driver === 'fs' ? [{ name: disk.name, root: disk.root }] : [],
  );
  const secrets =
    app.config.get<Parameters<typeof createSecretsService>[0]>('secrets') ?? {};
  const keys = secrets.keys?.length
    ? createSecretsService(secrets).keyring('nocobase/backup/fingerprint')
    : [];
  const logger = app.config.get<AppLoggingConfig>('logging');
  const configurationRoots = new Set([
    app.paths.deploymentRootDir,
    app.paths.rootDir,
    app.paths.configDir,
  ]);
  const configs = [...configurationRoots].flatMap((root) =>
    [
      '.env',
      '.env.local',
      '.env.production',
      '.env.production.local',
      '.env.development',
      '.env.development.local',
      'config.yml',
      'config.yaml',
      'config.json',
    ].map((file) => resolve(root, file)),
  );
  return {
    appName: app.appName,
    appVersion: manifest.version,
    connections,
    disks,
    keyFingerprints: keys.map(({ version, value }) => ({
      version: String(version),
      fingerprint: createHash('sha256').update(value).digest('hex'),
    })),
    skipPaths: [
      ...configs,
      app.configurationFile
        ? app.paths.root(app.configurationFile)
        : resolveDefaultAppConfigFile(app.paths),
      ...[
        'jobs',
        'queue',
        'sessions',
        'logs',
        'deployment/hosts',
        '.dev-server.lock',
      ].map((name) => app.paths.storage(name)),
      ...(logger?.file?.directory ? [resolve(logger.file.directory)] : []),
      ...(app.runtimeLogging?.file?.directory
        ? [resolve(app.runtimeLogging.file.directory)]
        : []),
    ],
    tools: backup.tools,
    async remoteFileExists({ disk, key }) {
      if (manager && drive && Object.hasOwn(drive.disks, disk))
        return manager.use(disk).exists(key);
    },
    withStoppedApp: (operation) =>
      withStoppedApplication(app, connections, operation),
    async withDeferredDeletes(selected, operation) {
      const release = await enterRunningApplication(app.paths);
      try {
        const protectedRoots = roots.filter(({ name }) =>
          selected.includes(name),
        );
        return await withDriveBackup(
          roots
            .filter(({ root }) =>
              protectedRoots.some(
                (entry) =>
                  contains(entry.root, root) || contains(root, entry.root),
              ),
            )
            .map(({ root }) => root),
          operation,
        );
      } finally {
        release();
      }
    },
  };
}
