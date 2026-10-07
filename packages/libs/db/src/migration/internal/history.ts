import type { Knex } from 'knex';
import type { MigrationConnection, MigrationHistoryRecord } from '../types.js';

export const DEFAULT_MIGRATION_TABLE = '__nocobase_migrations';

/**
 * A task ledger: one table recording what has run. Migrations and seeds keep
 * separate ledgers because only one of them is reversible, but the table, its
 * columns and every read and write against it are the same bookkeeping, so the
 * implementation lives here and the seed side names its own table.
 */
export interface TaskLedger {
  readonly tableName: string;
  /** Migrations record which batch a run belongs to; seeds have no batch. */
  readonly batched: boolean;
  /**
   * Seeds record whether a run executed or was skipped, which only sample
   * data can be. A row without it predates the column and executed.
   */
  readonly status?: boolean;
}

/** How a recorded task ended: it ran, or it was recorded without running. */
export type TaskHistoryStatus = 'executed' | 'skipped';

/** One recorded run, with `batch` present exactly for a batched ledger. */
export interface TaskHistoryEntry {
  readonly id: number;
  readonly packageName: string;
  readonly name: string;
  readonly batch?: number;
  readonly checksum: string;
  readonly executedAt: Date | string;
  readonly durationMs: number | null;
  /** Present exactly for a ledger that records status. */
  readonly status?: TaskHistoryStatus;
}

export interface TaskHistoryWrite {
  readonly packageName: string;
  readonly name: string;
  readonly batch?: number;
  readonly checksum: string;
  readonly durationMs: number | null;
  readonly status?: TaskHistoryStatus;
}

interface TaskHistoryRow {
  id: number;
  package_name: string;
  name: string;
  batch?: number;
  checksum: string;
  executed_at: Date | string;
  duration_ms: number | null;
  status?: string | null;
}

export async function ensureTaskHistoryTable(
  connection: MigrationConnection,
  ledger: TaskLedger,
): Promise<void> {
  const knex = await connection.client<Knex>();
  const exists = await knex.schema.hasTable(ledger.tableName);
  if (!exists) {
    try {
      await knex.schema.createTable(
        ledger.tableName,
        (table: Knex.CreateTableBuilder) => {
          table.increments('id').primary();
          table.string('package_name', 191).notNullable();
          table.string('name', 191).notNullable().unique();
          if (ledger.batched) table.integer('batch').notNullable();
          table.string('checksum', 128).notNullable();
          table.dateTime('executed_at').notNullable();
          table.integer('duration_ms').nullable();
          if (ledger.status) table.string('status', 16).nullable();
        },
      );
    } catch (error) {
      // Another run created it between the check and the create.
      if (!(await knex.schema.hasTable(ledger.tableName))) {
        throw error;
      }
    }
  }

  await ensurePackageNameColumn(knex, ledger.tableName);
  if (ledger.status) await ensureStatusColumn(knex, ledger.tableName);
}

export async function readTaskHistoryEntries(
  connection: MigrationConnection,
  ledger: TaskLedger,
): Promise<TaskHistoryEntry[]> {
  const knex = await connection.client<Knex>();
  // Read without upgrading: a ledger from before the column is read as all
  // executed, and gains the column the next time a run ensures the table.
  const withStatus =
    ledger.status === true &&
    (await knex.schema.hasColumn(ledger.tableName, 'status'));
  const rows = await knex<TaskHistoryRow>(ledger.tableName)
    .select([
      'id',
      'package_name',
      'name',
      ...(ledger.batched ? ['batch' as const] : []),
      'checksum',
      'executed_at',
      'duration_ms',
      ...(withStatus ? ['status' as const] : []),
    ])
    .orderBy('id', 'asc');

  return rows.map((row: TaskHistoryRow) => ({
    id: Number(row.id),
    packageName: String(row.package_name),
    name: String(row.name),
    ...(ledger.batched ? { batch: Number(row.batch) } : {}),
    checksum: String(row.checksum),
    executedAt: row.executed_at,
    durationMs:
      row.duration_ms === null || row.duration_ms === undefined
        ? null
        : Number(row.duration_ms),
    ...(ledger.status
      ? {
          status:
            row.status === 'skipped'
              ? ('skipped' as const)
              : ('executed' as const),
        }
      : {}),
  }));
}

export async function recordTaskHistoryEntry(
  connection: MigrationConnection,
  ledger: TaskLedger,
  entry: TaskHistoryWrite,
): Promise<void> {
  const knex = await connection.client<Knex>();
  await knex(ledger.tableName).insert({
    package_name: entry.packageName,
    name: entry.name,
    ...(ledger.batched ? { batch: entry.batch } : {}),
    checksum: entry.checksum,
    executed_at: new Date(),
    duration_ms: entry.durationMs,
    ...(ledger.status ? { status: entry.status ?? 'executed' } : {}),
  });
}

/** Rewrites how a recorded task ended, such as sample data run after it was skipped. */
export async function updateTaskHistoryEntry(
  connection: MigrationConnection,
  ledger: TaskLedger,
  name: string,
  entry: Pick<TaskHistoryWrite, 'checksum' | 'durationMs' | 'status'>,
): Promise<void> {
  const knex = await connection.client<Knex>();
  await knex(ledger.tableName)
    .where({ name })
    .update({
      checksum: entry.checksum,
      executed_at: new Date(),
      duration_ms: entry.durationMs,
      ...(ledger.status ? { status: entry.status ?? 'executed' } : {}),
    });
}

export async function deleteTaskHistoryEntry(
  connection: MigrationConnection,
  ledger: TaskLedger,
  name: string,
): Promise<void> {
  const knex = await connection.client<Knex>();
  await knex(ledger.tableName).where({ name }).delete();
}

function migrationLedger(tableName: string): TaskLedger {
  return { tableName, batched: true };
}

export async function ensureMigrationTable(
  connection: MigrationConnection,
  tableName: string = DEFAULT_MIGRATION_TABLE,
): Promise<void> {
  await ensureTaskHistoryTable(connection, migrationLedger(tableName));
}

export async function readMigrationHistory(
  connection: MigrationConnection,
  tableName: string = DEFAULT_MIGRATION_TABLE,
): Promise<MigrationHistoryRecord[]> {
  const entries = await readTaskHistoryEntries(
    connection,
    migrationLedger(tableName),
  );
  // A batched ledger selects and maps `batch`, so it is present on every entry.
  return entries.map((entry) => ({ ...entry, batch: Number(entry.batch) }));
}

export async function recordMigrationCompleted(
  connection: MigrationConnection,
  options: {
    tableName?: string;
    packageName?: string;
    name: string;
    batch: number;
    checksum: string;
    durationMs: number;
  },
): Promise<void> {
  await recordTaskHistoryEntry(
    connection,
    migrationLedger(options.tableName ?? DEFAULT_MIGRATION_TABLE),
    {
      packageName: options.packageName ?? 'app',
      name: options.name,
      batch: options.batch,
      checksum: options.checksum,
      durationMs: options.durationMs,
    },
  );
}

export async function deleteMigrationHistoryRecord(
  connection: MigrationConnection,
  options: {
    tableName?: string;
    name: string;
  },
): Promise<void> {
  await deleteTaskHistoryEntry(
    connection,
    migrationLedger(options.tableName ?? DEFAULT_MIGRATION_TABLE),
    options.name,
  );
}

/**
 * A seed ledger created before `status` existed is upgraded in place; its rows
 * keep a null status, which reads as executed.
 */
async function ensureStatusColumn(
  knex: Knex,
  tableName: string,
): Promise<void> {
  if (await knex.schema.hasColumn(tableName, 'status')) return;
  try {
    await knex.schema.alterTable(tableName, (table: Knex.AlterTableBuilder) => {
      table.string('status', 16).nullable();
    });
  } catch (error) {
    // Another run added it between the check and the change.
    if (!(await knex.schema.hasColumn(tableName, 'status'))) throw error;
  }
}

/**
 * A ledger created before `package_name` existed is upgraded in place. A task
 * ledger cannot be maintained by a migration: migrations are what it records.
 */
async function ensurePackageNameColumn(
  knex: Knex,
  tableName: string,
): Promise<void> {
  if (await knex.schema.hasColumn(tableName, 'package_name')) {
    return;
  }

  await knex.schema.alterTable(tableName, (table: Knex.AlterTableBuilder) => {
    table.string('package_name', 191).notNullable().defaultTo('app');
  });
}
