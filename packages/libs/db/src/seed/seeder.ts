import {
  collectChecksumMismatches,
  describeChecksumMismatch,
  upgradeTaskChecksums,
  writeTaskChecksums,
  type ChecksumMismatch,
} from '../migration/checksum-history.js';
import type { Knex } from 'knex';
import { createMigrationConnection } from '../migration/internal/context.js';
import { createSeedContext } from './internal/context.js';
import {
  DEFAULT_SEED_TABLE,
  ensureSeedTable,
  readSeedHistory,
  recordSeedCompleted,
  updateSeedRecord,
} from './internal/history.js';
import { DEFAULT_SEED_LOCK_TABLE, withSeedLock } from './internal/lock.js';
import {
  readTaskLockState,
  releaseTaskLock,
} from '../migration/internal/lock.js';
import { loadSeeds } from './loader.js';
import type {
  CreateSeederOptions,
  LoadedSeed,
  SeedHistoryEntry,
  SeedHistoryRecord,
  SeedRepairOptions,
  SeedRepairResult,
  SeedRunResult,
  SeedSampleRunResult,
} from './types.js';
import type {
  MigrationConnection,
  TaskLockReleaseOptions,
  TaskLockReleaseResult,
  TaskLockState,
} from '../migration/types.js';

/** Executes pending seed definitions for one database connection. */
export interface Seeder {
  /**
   * Executes every seed that has no matching history record. A sample seed
   * runs only when `sample.enabled` is set; otherwise it is recorded as
   * skipped, and a later run leaves it alone.
   */
  run(): Promise<SeedRunResult>;
  /**
   * Executes every sample seed recorded as skipped and records it as
   * executed. Seeds that never ran at all are left to `run()`.
   */
  runSamples(): Promise<SeedSampleRunResult>;
  /**
   * Records an entry no seed file describes, such as sample data a service
   * built, or rewrites the one with the same name. Executes nothing.
   */
  record(entry: SeedHistoryEntry): Promise<void>;
  /**
   * Rewrites recorded checksums to match the current sources, clearing drift
   * reported by a run. Executes no seed and changes no data.
   */
  repair(options?: SeedRepairOptions): Promise<SeedRepairResult>;
  /**
   * Seeds already executed on the connection, oldest first. Reads only: a
   * connection without a history table yields an empty list rather than
   * getting one created, and no lock is taken.
   */
  history(): Promise<SeedHistoryRecord[]>;
  /** The seed lock as it stands, or undefined when no run holds it. */
  lock(): Promise<TaskLockState | undefined>;
  /** Releases the seed lock; an active one needs `force`. */
  unlock(options?: TaskLockReleaseOptions): Promise<TaskLockReleaseResult>;
}

/** Creates a seed runner backed by the supplied database manager. */
export function createSeeder(options: CreateSeederOptions): Seeder {
  return new DefaultSeeder(options);
}

class DefaultSeeder implements Seeder {
  constructor(private readonly options: CreateSeederOptions) {}

  async history(): Promise<SeedHistoryRecord[]> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    return this.readHistoryIfPresent(createMigrationConnection(connection));
  }

  /**
   * The history as it stands, without creating its table: a database no
   * seed has run on has none, and its history is empty. What reads history
   * without changing anything — `history()` and a dry run — goes through here.
   */
  private async readHistoryIfPresent(
    seedConnection: MigrationConnection,
  ): Promise<SeedHistoryRecord[]> {
    const tableName = this.options.tableName ?? DEFAULT_SEED_TABLE;
    const knex = await seedConnection.client<Knex>();
    if (!(await knex.schema.hasTable(tableName))) return [];
    return readSeedHistory(seedConnection, tableName);
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
    return this.options.lockTableName ?? DEFAULT_SEED_LOCK_TABLE;
  }

  async run(): Promise<SeedRunResult> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    const seeds = await loadSeeds(this.options);
    const seedConnection = createSeedContext(
      connection,
      this.options.config,
      this.options.container,
    ).connection;

    return withSeedLock(
      seedConnection,
      {
        tableName: this.options.lockTableName ?? DEFAULT_SEED_LOCK_TABLE,
        acquireTimeoutMs: this.options.lockAcquireTimeoutMs,
        onStaleLock: this.options.onStaleLock,
      },
      async () => {
        await ensureSeedTable(
          seedConnection,
          this.options.tableName ?? DEFAULT_SEED_TABLE,
        );

        const history = await readSeedHistory(
          seedConnection,
          this.options.tableName,
        );
        const warnings = this.validateAppliedHistory(seeds, history);
        await upgradeTaskChecksums(
          seedConnection,
          this.options.tableName ?? DEFAULT_SEED_TABLE,
          seeds,
          history,
        );

        const appliedNames = new Set(history.map((record) => record.name));
        const pending = seeds.filter((seed) => !appliedNames.has(seed.name));
        const skipped = seeds
          .filter((seed) => appliedNames.has(seed.name))
          .map((seed) => seed.name);
        const executed: string[] = [];
        const skippedSamples: string[] = [];
        const samplesEnabled = this.options.sample?.enabled === true;

        for (const seed of pending) {
          if (seed.seed.sample === true && !samplesEnabled) {
            await recordSeedCompleted(seedConnection, {
              tableName: this.options.tableName,
              packageName: seed.packageName,
              name: seed.name,
              checksum: seed.checksum,
              durationMs: null,
              status: 'skipped',
            });
            skippedSamples.push(seed.name);
            continue;
          }
          await this.runSeed(connection, seed);
          executed.push(seed.name);
        }

        return { executed, skipped, skippedSamples, warnings };
      },
    );
  }

  async runSamples(): Promise<SeedSampleRunResult> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    const seeds = await loadSeeds(this.options);
    const seedConnection = createMigrationConnection(connection);
    return withSeedLock(
      seedConnection,
      {
        tableName: this.options.lockTableName ?? DEFAULT_SEED_LOCK_TABLE,
        acquireTimeoutMs: this.options.lockAcquireTimeoutMs,
        onStaleLock: this.options.onStaleLock,
      },
      async () => {
        await ensureSeedTable(
          seedConnection,
          this.options.tableName ?? DEFAULT_SEED_TABLE,
        );
        const history = await readSeedHistory(
          seedConnection,
          this.options.tableName,
        );
        const skippedNames = new Set(
          history
            .filter((record) => record.status === 'skipped')
            .map((record) => record.name),
        );
        const executed: string[] = [];
        for (const seed of seeds) {
          if (seed.seed.sample !== true || !skippedNames.has(seed.name))
            continue;
          await this.runSeed(connection, seed, 'update');
          executed.push(seed.name);
        }
        return { executed };
      },
    );
  }

  async record(entry: SeedHistoryEntry): Promise<void> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    const seedConnection = createMigrationConnection(connection);
    const tableName = this.options.tableName ?? DEFAULT_SEED_TABLE;
    await ensureSeedTable(seedConnection, tableName);
    const history = await readSeedHistory(seedConnection, tableName);
    const durationMs = entry.durationMs ?? null;
    // Not a seed file, so there is no source to hash: the name stands in.
    const checksum = `entry:${entry.name}`.slice(0, 128);
    if (history.some((record) => record.name === entry.name)) {
      await updateSeedRecord(seedConnection, {
        tableName,
        name: entry.name,
        checksum,
        durationMs,
        status: entry.status,
      });
      return;
    }
    await recordSeedCompleted(seedConnection, {
      tableName,
      packageName: entry.packageName,
      name: entry.name,
      checksum,
      durationMs,
      status: entry.status,
    });
  }

  async repair(options: SeedRepairOptions = {}): Promise<SeedRepairResult> {
    const connection = this.options.database.connection(
      this.options.connection,
    );
    const tableName = this.options.tableName ?? DEFAULT_SEED_TABLE;
    const seeds = await loadSeeds(this.options);
    const seedConnection = createMigrationConnection(connection);

    // A dry run only reads: taking the lock or ensuring the history table
    // would create both on a database no seed has run on.
    if (options.dryRun) {
      const history = await this.readHistoryIfPresent(seedConnection);
      return {
        repaired: collectChecksumMismatches(seeds, history),
        dryRun: true,
      };
    }
    return withSeedLock(
      seedConnection,
      {
        tableName: this.options.lockTableName ?? DEFAULT_SEED_LOCK_TABLE,
        acquireTimeoutMs: this.options.lockAcquireTimeoutMs,
        onStaleLock: this.options.onStaleLock,
      },
      async () => {
        await ensureSeedTable(seedConnection, tableName);
        const history = await readSeedHistory(
          seedConnection,
          this.options.tableName,
        );
        const repaired = collectChecksumMismatches(seeds, history);
        await writeTaskChecksums(seedConnection, tableName, repaired);
        return { repaired, dryRun: false };
      },
    );
  }

  /** Applies the configured policy to executed seeds whose source has changed. */
  private validateAppliedHistory(
    seeds: LoadedSeed[],
    history: SeedHistoryRecord[],
  ): ChecksumMismatch[] {
    const mismatches = collectChecksumMismatches(seeds, history);
    if (this.options.onChecksumMismatch === 'error' && mismatches.length) {
      throw new Error(describeChecksumMismatch(mismatches[0], 'seed'));
    }
    return mismatches;
  }

  /** Runs one seed and records it; `update` rewrites the record a skipped sample left. */
  private async runSeed(
    connection: ReturnType<CreateSeederOptions['database']['connection']>,
    loaded: LoadedSeed,
    write: 'insert' | 'update' = 'insert',
  ): Promise<void> {
    const recordRun = async (
      seedConnection: MigrationConnection,
      durationMs: number,
    ): Promise<void> => {
      if (write === 'update') {
        await updateSeedRecord(seedConnection, {
          tableName: this.options.tableName,
          name: loaded.name,
          checksum: loaded.checksum,
          durationMs,
          status: 'executed',
        });
        return;
      }
      await recordSeedCompleted(seedConnection, {
        tableName: this.options.tableName,
        packageName: loaded.packageName,
        name: loaded.name,
        checksum: loaded.checksum,
        durationMs,
      });
    };
    const mode = loaded.seed.transaction ?? 'auto';
    if (mode === false) {
      const context = createSeedContext(
        connection,
        this.options.config,
        this.options.container,
      );
      const startedAt = Date.now();
      await loaded.seed.run(context);
      await recordRun(context.connection, Date.now() - startedAt);
      return;
    }

    await connection.transaction(async (trxConnection) => {
      const context = createSeedContext(
        trxConnection,
        this.options.config,
        this.options.container,
      );
      const startedAt = Date.now();
      await loaded.seed.run(context);
      await recordRun(context.connection, Date.now() - startedAt);
    });
  }
}
