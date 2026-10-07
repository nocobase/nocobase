import type { MigrationConnection } from '../../migration/types.js';
import type { SeedHistoryRecord, SeedHistoryStatus } from '../types.js';
import {
  ensureTaskHistoryTable,
  readTaskHistoryEntries,
  recordTaskHistoryEntry,
  updateTaskHistoryEntry,
  type TaskLedger,
} from '../../migration/internal/history.js';

export const DEFAULT_SEED_TABLE = '__nocobase_seeds';

/**
 * Seeds keep their own ledger, and it is not batched: they never roll back.
 * It records a status, because sample data may be recorded without running.
 */
function seedLedger(tableName: string): TaskLedger {
  return { tableName, batched: false, status: true };
}

export async function ensureSeedTable(
  connection: MigrationConnection,
  tableName: string = DEFAULT_SEED_TABLE,
): Promise<void> {
  await ensureTaskHistoryTable(connection, seedLedger(tableName));
}

export async function readSeedHistory(
  connection: MigrationConnection,
  tableName: string = DEFAULT_SEED_TABLE,
): Promise<SeedHistoryRecord[]> {
  const entries = await readTaskHistoryEntries(
    connection,
    seedLedger(tableName),
  );
  // A ledger that records status maps it on every entry.
  return entries.map((entry) => ({
    ...entry,
    status: entry.status ?? 'executed',
  }));
}

export async function recordSeedCompleted(
  connection: MigrationConnection,
  options: {
    tableName?: string;
    packageName: string;
    name: string;
    checksum: string;
    durationMs: number | null;
    status?: SeedHistoryStatus;
  },
): Promise<void> {
  await recordTaskHistoryEntry(
    connection,
    seedLedger(options.tableName ?? DEFAULT_SEED_TABLE),
    {
      packageName: options.packageName,
      name: options.name,
      checksum: options.checksum,
      durationMs: options.durationMs,
      status: options.status ?? 'executed',
    },
  );
}

/** Rewrites a recorded entry's outcome, such as a skipped sample seed that has now run. */
export async function updateSeedRecord(
  connection: MigrationConnection,
  options: {
    tableName?: string;
    name: string;
    checksum: string;
    durationMs: number | null;
    status: SeedHistoryStatus;
  },
): Promise<void> {
  await updateTaskHistoryEntry(
    connection,
    seedLedger(options.tableName ?? DEFAULT_SEED_TABLE),
    options.name,
    {
      checksum: options.checksum,
      durationMs: options.durationMs,
      status: options.status,
    },
  );
}
