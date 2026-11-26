import {
  collectChecksumMismatches,
  describeChecksumMismatch,
  upgradeTaskChecksums,
  writeTaskChecksums,
} from './checksum-history.js';
import { assertManagedSchema } from '../database/schema-management.js';
import type { Knex } from 'knex';
import {
  createMigrationConnection,
  createMigrationContext,
} from './internal/context.js';
import {
  DEFAULT_MIGRATION_TABLE,
  deleteMigrationHistoryRecord,
  ensureMigrationTable,
  readMigrationHistory,
  recordMigrationCompleted,
} from './internal/history.js';
import {
  DEFAULT_MIGRATION_LOCK_TABLE,
  readTaskLockState,
  releaseTaskLock,
  withMigrationLock,
} from './internal/lock.js';
import { loadMigrations } from './loader.js';
import type {
  CreateMigratorOptions,
  LoadedMigration,
  MigrationHistoryRecord,
  MigrationRepairOptions,
  MigrationRepairResult,
  MigrationRollbackOptions,
  MigrationRollbackResult,
  MigrationRunResult,
  MigrationWarning,
  MissingMigrationSource,
  MigrationConnection,
  MigrationContext,
  TaskLockReleaseOptions,
  TaskLockReleaseResult,
  TaskLockState,
} from './types.js';

/** Executes and rolls back ordered migrations for one database connection. */
export interface Migrator {
  /** Applies every pending migration. */
  latest(): Promise<MigrationRunResult>;
  /** Applies pending migrations through the named migration, inclusive. */
  upTo(name: string): Promise<MigrationRunResult>;
  /** Rolls back the most recently applied migration batch. */
  rollback(
    options?: MigrationRollbackOptions,
  ): Promise<MigrationRollbackResult>;
  /**
   * Rewrites recorded checksums to match the current sources, clearing drift
   * reported by a run. Executes no migration and changes no schema.
   */
  repair(options?: MigrationRepairOptions): Promise<MigrationRepairResult>;
  /**
   * Migrations already applied on the connection, oldest first. Reads only:
   * a connection without a history table yields an empty list rather than
   * getting one created.
   */
  history(): Promise<MigrationHistoryRecord[]>;
  /**
   * The lock as it stands, or undefined when no run holds it. Reads only, and
   * creates no table.
   */
  lock(): Promise<TaskLockState | undefined>;
  /**
   * Deletes the lock row so a later run can proceed. An expired lock — one
   * whose holder stopped sending heartbeats — is released; an active one needs
   * `force`, because releasing it lets a second run start beside the first.
   */
  unlock(options?: TaskLockReleaseOptions): Promise<TaskLockReleaseResult>;
}

/** Creates a migration runner backed by the supplied database manager. */
export function createMigrator(options: CreateMigratorOptions): Migrator {
  return new DefaultMigrator(options);
}

class DefaultMigrator implements Migrator {
  constructor(private readonly options: CreateMigratorOptions) {}

  async latest(): Promise<MigrationRunResult> {
    return this.runPendingMigrations();
  }

  async upTo(name: string): Promise<MigrationRunResult> {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Migration target name must be a non-empty string.');
    }
    return this.runPendingMigrations(name);
  }

  private async runPendingMigrations(
    targetName?: string,
  ): Promise<MigrationRunResult> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    assertManagedSchema(
      {
        connectionName: connection.name,
        mode: connection.schemaManagement,
      },
      targetName === undefined ? 'migration.latest' : 'migration.upTo',
    );
    const migrations = await loadMigrations(this.options);
    const selectedMigrations = selectMigrations(migrations, targetName);
    const migrationConnection = createMigrationContext(
      connection,
      this.options.config,
      this.options.container,
    ).connection;

    const result = await withMigrationLock(
      migrationConnection,
      {
        tableName: this.options.lockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE,
        acquireTimeoutMs: this.options.lockAcquireTimeoutMs,
        onStaleLock: this.options.onStaleLock,
      },
      async () => {
        await ensureMigrationTable(
          migrationConnection,
          this.options.tableName ?? DEFAULT_MIGRATION_TABLE,
        );

        const history = await readMigrationHistory(
          migrationConnection,
          this.options.tableName,
        );
        const warnings = this.validateAppliedHistory(migrations, history);
        await upgradeTaskChecksums(
          migrationConnection,
          this.options.tableName ?? DEFAULT_MIGRATION_TABLE,
          migrations,
          history,
        );

        const appliedNames = new Set(history.map((record) => record.name));
        const pending = selectedMigrations.filter(
          (migration) => !appliedNames.has(migration.name),
        );
        const skipped = selectedMigrations
          .filter((migration) => appliedNames.has(migration.name))
          .map((migration) => migration.name);
        let batch = currentBatch(history);
        const executed: string[] = [];

        for (const migration of pending) {
          if (this.options.taskFilter && !this.options.taskFilter(migration))
            continue;
          if (migration.migration.shouldRun) {
            const shouldRun = await migration.migration.shouldRun({
              ...createMigrationContext(
                connection,
                this.options.config,
                this.options.container,
              ),
              parameters: migration.parameters,
              configuration: migration.configuration,
            });
            if (typeof shouldRun !== 'boolean') {
              throw new Error(
                `Migration "${migration.name}" shouldRun must return a boolean.`,
              );
            }
            if (!shouldRun) {
              skipped.push(migration.name);
              continue;
            }
          }
          batch = nextBatch(history);
          await this.runUpMigration(connection, migration, batch);
          executed.push(migration.name);
        }

        return { batch, executed, skipped, warnings };
      },
    );
    return result;
  }

  async history(): Promise<MigrationHistoryRecord[]> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    return this.readHistoryIfPresent(createMigrationConnection(connection));
  }

  /**
   * The history as it stands, without creating its table: a database no
   * migration has run on has none, and its history is empty. What reads
   * history without changing anything — `history()` and every dry run — goes
   * through here.
   */
  private async readHistoryIfPresent(
    migrationConnection: MigrationConnection,
  ): Promise<MigrationHistoryRecord[]> {
    const tableName = this.options.tableName ?? DEFAULT_MIGRATION_TABLE;
    const knex = await migrationConnection.client<Knex>();
    if (!(await knex.schema.hasTable(tableName))) return [];
    return readMigrationHistory(migrationConnection, tableName);
  }

  async lock(): Promise<TaskLockState | undefined> {
    return readTaskLockState(this.lockConnection(), this.lockTableName());
  }

  async unlock(
    options: TaskLockReleaseOptions = {},
  ): Promise<TaskLockReleaseResult> {
    return releaseTaskLock(
      this.lockConnection(),
      this.lockTableName(),
      options,
    );
  }

  private lockConnection(): MigrationConnection {
    return createMigrationConnection(
      this.options.database.connection(this.options.connection),
    );
  }

  private lockTableName(): string {
    return this.options.lockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE;
  }

  async rollback(
    options: MigrationRollbackOptions = {},
  ): Promise<MigrationRollbackResult> {
    const dryRun = options.dryRun ?? false;
    const connection = this.options.database.connection(
      this.options.connection,
    );
    assertManagedSchema(
      {
        connectionName: connection.name,
        mode: connection.schemaManagement,
      },
      'migration.rollback',
    );
    const migrations = await loadMigrations(this.options);
    const migrationConnection = createMigrationContext(
      connection,
      this.options.config,
      this.options.container,
    ).connection;

    const rollbackFrom = async (
      history: MigrationHistoryRecord[],
    ): Promise<MigrationRollbackResult> => {
      const batch = currentBatch(history);
      if (batch === 0) {
        return { batch: 0, rolledBack: [], records: [], warnings: [], dryRun };
      }

      const migrationsByName = new Map(
        migrations.map((migration) => [migration.name, migration]),
      );
      const records = history
        .filter((record) => record.batch === batch)
        .sort((a, b) => b.id - a.id);
      const rollbackItems: LoadedMigration[] = [];
      const problems: string[] = [];
      for (const record of records) {
        const migration = migrationsByName.get(record.name);
        if (!migration) {
          problems.push(describeMissingSource(record));
        } else if (migration.migration.irreversible === true) {
          problems.push(
            `Migration "${record.name}" is irreversible and cannot be rolled back. Package: "${record.packageName}".`,
          );
        } else if (!migration.migration.down) {
          problems.push(
            `Migration "${record.name}" does not define down(context). Package: "${record.packageName}".`,
          );
        } else {
          rollbackItems.push(migration);
        }
      }
      if (problems.length) {
        throw new Error(
          `Cannot roll back migration batch ${batch}:\n${problems.join('\n')}\nRestore compatible versions of the affected plugins or packages, roll back before uninstalling them, or use a new forward migration to adjust the schema.`,
        );
      }
      const warnings = this.validateAppliedHistory(migrations, history, batch);
      // Validation above already rejected an irreversible batch, so a dry run
      // reports what a run would undo and why it could not, without running
      // any `down`.
      if (dryRun) {
        return {
          batch,
          rolledBack: rollbackItems.map((migration) => migration.name),
          records,
          warnings,
          dryRun,
        };
      }

      await upgradeTaskChecksums(
        migrationConnection,
        this.options.tableName ?? DEFAULT_MIGRATION_TABLE,
        migrations,
        records,
      );

      const rolledBack: string[] = [];

      for (const migration of rollbackItems) {
        await this.runDownMigration(connection, migration);
        rolledBack.push(migration.name);
      }

      return { batch, rolledBack, records, warnings, dryRun };
    };
    // A dry run only reads: taking the lock or ensuring the history table
    // would create both on a database no migration has run on. Reading
    // without the lock can at worst show a preview that a concurrent run has
    // already overtaken, which a preview is anyway.
    const result = dryRun
      ? await rollbackFrom(await this.readHistoryIfPresent(migrationConnection))
      : await withMigrationLock(
          migrationConnection,
          {
            tableName:
              this.options.lockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE,
            acquireTimeoutMs: this.options.lockAcquireTimeoutMs,
            onStaleLock: this.options.onStaleLock,
          },
          async () => {
            await ensureMigrationTable(
              migrationConnection,
              this.options.tableName ?? DEFAULT_MIGRATION_TABLE,
            );
            return rollbackFrom(
              await readMigrationHistory(
                migrationConnection,
                this.options.tableName,
              ),
            );
          },
        );
    return result;
  }

  async repair(
    options: MigrationRepairOptions = {},
  ): Promise<MigrationRepairResult> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    const tableName = this.options.tableName ?? DEFAULT_MIGRATION_TABLE;
    const migrations = await loadMigrations(this.options);
    const migrationConnection = createMigrationConnection(connection);

    // A dry run only reads, for the reason `rollback` gives.
    if (options.dryRun) {
      const history = await this.readHistoryIfPresent(migrationConnection);
      return {
        repaired: collectChecksumMismatches(migrations, history),
        dryRun: true,
      };
    }
    return withMigrationLock(
      migrationConnection,
      {
        tableName: this.options.lockTableName ?? DEFAULT_MIGRATION_LOCK_TABLE,
        acquireTimeoutMs: this.options.lockAcquireTimeoutMs,
        onStaleLock: this.options.onStaleLock,
      },
      async () => {
        await ensureMigrationTable(migrationConnection, tableName);
        const history = await readMigrationHistory(
          migrationConnection,
          this.options.tableName,
        );
        const repaired = collectChecksumMismatches(migrations, history);
        await writeTaskChecksums(migrationConnection, tableName, repaired);
        return { repaired, dryRun: false };
      },
    );
  }

  /**
   * Forward runs validate participating packages. Rollback only enforces
   * checksum policy on its target batch; older missing sources merely warn.
   */
  private validateAppliedHistory(
    migrations: LoadedMigration[],
    history: MigrationHistoryRecord[],
    rollbackBatch?: number,
  ): MigrationWarning[] {
    const participatingPackages = participatingPackageNames(this.options);
    const migrationsByName = new Map(
      migrations.map((migration) => [migration.name, migration]),
    );
    const newestByPackage = new Map<string, string>();
    for (const migration of migrations) {
      const newest = newestByPackage.get(migration.packageName);
      const name = migration.migration.name;
      if (
        !newest ||
        migrationVersion(name).localeCompare(migrationVersion(newest)) > 0
      )
        newestByPackage.set(migration.packageName, name);
    }
    const missing: MissingMigrationSource[] = [];
    for (const record of history) {
      if (
        !migrationsByName.has(record.name) &&
        (rollbackBatch !== undefined ||
          participatingPackages.has(record.packageName))
      ) {
        if (rollbackBatch === undefined) {
          const newest = newestByPackage.get(record.packageName);
          if (
            newest &&
            migrationVersion(record.name).localeCompare(
              migrationVersion(newest),
            ) > 0
          ) {
            throw new Error(
              `${describeMissingSource(record)} The database is newer than the code: this record is newer than the package's newest source migration "${newest}". Restore a compatible package version before migrating.`,
            );
          }
          if (this.options.onMissingSource === 'error')
            throw new Error(describeMissingSource(record));
        }
        missing.push({
          kind: 'missing-source',
          packageName: record.packageName,
          name: record.name,
        });
      }
    }
    const mismatches = collectChecksumMismatches(migrations, history);
    const targetNames = new Set(
      history
        .filter((record) => record.batch === rollbackBatch)
        .map((record) => record.name),
    );
    const blockingMismatch = mismatches.find(
      (mismatch) =>
        rollbackBatch === undefined || targetNames.has(mismatch.name),
    );
    if (this.options.onChecksumMismatch === 'error' && blockingMismatch) {
      throw new Error(describeChecksumMismatch(blockingMismatch, 'migration'));
    }
    return [...missing, ...mismatches];
  }

  private async runUpMigration(
    connection: ReturnType<CreateMigratorOptions['database']['connection']>,
    loaded: LoadedMigration,
    batch: number,
  ): Promise<void> {
    await this.runMigration(connection, loaded, async (context) => {
      const startedAt = Date.now();
      await loaded.migration.up(context);
      await recordMigrationCompleted(context.connection, {
        tableName: this.options.tableName,
        packageName: loaded.packageName,
        name: loaded.name,
        batch,
        checksum: loaded.checksum,
        durationMs: Date.now() - startedAt,
      });
    });
  }

  private async runDownMigration(
    connection: ReturnType<CreateMigratorOptions['database']['connection']>,
    loaded: LoadedMigration,
  ): Promise<void> {
    await this.runMigration(connection, loaded, async (context) => {
      await loaded.migration.down?.(context);
      await deleteMigrationHistoryRecord(context.connection, {
        tableName: this.options.tableName,
        name: loaded.name,
      });
    });
  }

  private async runMigration(
    connection: ReturnType<CreateMigratorOptions['database']['connection']>,
    loaded: LoadedMigration,
    execute: (context: MigrationContext) => Promise<void>,
  ): Promise<void> {
    const run = (bound: typeof connection): Promise<void> =>
      execute({
        ...createMigrationContext(
          bound,
          this.options.config,
          this.options.container,
        ),
        parameters: loaded.parameters,
        configuration: loaded.configuration,
      });
    // The non-transactional path must remain registered across partial DDL
    // commits. Each operation, including a failed one, settles its own entry.
    if (loaded.migration.transaction === false) {
      await connection.notifySchemaChange(() => run(connection));
      return;
    }
    try {
      await connection.transaction(
        (transaction) => transaction.notifySchemaChange(() => run(transaction)),
        { collectionCache: 'isolated' },
      );
    } catch (error) {
      // Run after the rollback releases the pool connection.
      try {
        await connection.notifySchemaChange(async () => {});
      } catch (notificationError) {
        throw new AggregateError(
          [error, notificationError],
          'Migration and schema invalidation both failed.',
          { cause: notificationError },
        );
      }
      throw error;
    }
  }
}

function selectMigrations(
  migrations: LoadedMigration[],
  targetName?: string,
): LoadedMigration[] {
  if (targetName === undefined) return migrations;

  const targetIndex = migrations.findIndex(
    (migration) => migration.name === targetName,
  );
  if (targetIndex === -1) {
    throw new Error(`Migration target "${targetName}" was not found.`);
  }
  return migrations.slice(0, targetIndex + 1);
}

function participatingPackageNames(
  options: CreateMigratorOptions,
): ReadonlySet<string> {
  if (options.sources) {
    return new Set(options.sources.map((source) => source.packageName));
  }

  return new Set([options.packageName ?? 'app']);
}

function describeMissingSource(
  record: Pick<MigrationHistoryRecord, 'name' | 'packageName'>,
): string {
  return `Executed migration "${record.name}" is missing from migration sources. Package: "${record.packageName}".`;
}

function nextBatch(history: MigrationHistoryRecord[]): number {
  return currentBatch(history) + 1;
}

function currentBatch(history: MigrationHistoryRecord[]): number {
  return history.reduce((batch, record) => Math.max(batch, record.batch), 0);
}

/** Only the filename timestamp orders versions; target hashes identify instances. */
function migrationVersion(name: string): string {
  return name.split('_', 1)[0] ?? name;
}
