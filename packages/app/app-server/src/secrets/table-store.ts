import type { DatabaseConnection } from '@nocobase/db';
import { isSealedSecret } from '@nocobase/secrets';

import type {
  SecretsResealResult,
  SecretsStore,
  SecretsStoreContext,
  SecretsStoreStatus,
} from './service.js';

type Row = Record<string, unknown>;

/** A value format a column still reads for compatibility. Such values count as legacy and are resealed. */
export interface SecretsLegacyFormat {
  matches(value: string): boolean;
  open(value: string, row: Row): string;
}

export interface SecretsTableColumn {
  readonly column: string;
  readonly purpose: string;
  /** What the column's values are bound to, read from the row, such as its id. */
  readonly aad?: (row: Row) => readonly string[];
  readonly legacy?: SecretsLegacyFormat;
}

export interface SecretsTableStoreOptions {
  readonly name: string;
  readonly table: string;
  /** The column rows are paged and updated by. Defaults to `id`. */
  readonly key?: string;
  readonly columns: readonly SecretsTableColumn[];
  /** Further columns `aad` or `legacy.open` read. */
  readonly select?: readonly string[];
  readonly connection: () => DatabaseConnection;
}

/**
 * A store over columns of one table. Rows are paged by `key`, so a run reads a bounded batch at a time, and each value
 * is rewritten only if it still holds what was read, so a run racing the application or another run never overwrites
 * a newer value. Running it again picks up where an interrupted run stopped, because sealed-with-current values are
 * skipped.
 */
export function createSecretsTableStore(
  options: SecretsTableStoreOptions,
): SecretsStore {
  const key = options.key ?? 'id';
  const selection = [
    ...new Set([
      key,
      ...options.columns.map((column) => column.column),
      ...(options.select ?? []),
    ]),
  ];

  async function* batches(batchSize: number): AsyncGenerator<Row[]> {
    let last: unknown;
    for (;;) {
      let query = options
        .connection()
        .query.selectFrom(options.table)
        .select(selection);
      if (last !== undefined) query = query.where(key, '>', last);
      const rows = await query
        .orderBy(key, 'asc')
        .limit(batchSize)
        .execute<Row>();
      if (rows.length === 0) return;
      yield rows;
      if (rows.length < batchSize) return;
      last = rows[rows.length - 1][key];
    }
  }

  return {
    name: options.name,
    async status(context: SecretsStoreContext): Promise<SecretsStoreStatus> {
      const byVersion: Record<string, number> = {};
      let total = 0;
      let needsReseal = 0;
      let legacy = 0;
      for await (const rows of batches(context.batchSize)) {
        for (const row of rows) {
          for (const column of options.columns) {
            const value = row[column.column];
            if (typeof value !== 'string' || value === '') continue;
            total += 1;
            const version = classify(value, column);
            byVersion[version] = (byVersion[version] ?? 0) + 1;
            if (version === 'legacy') legacy += 1;
            if (
              version === 'legacy' ||
              (version !== 'malformed' &&
                Number(version) !== context.secrets.currentVersion)
            ) {
              needsReseal += 1;
            }
          }
        }
      }
      return { total, byVersion, needsReseal, ...(legacy ? { legacy } : {}) };
    },
    async reseal(context: SecretsStoreContext): Promise<SecretsResealResult> {
      let resealed = 0;
      let failed = 0;
      for await (const rows of batches(context.batchSize)) {
        for (const row of rows) {
          for (const column of options.columns) {
            const value = row[column.column];
            if (typeof value !== 'string' || value === '') continue;
            const version = classify(value, column);
            if (version === 'malformed') continue;
            if (
              version !== 'legacy' &&
              Number(version) === context.secrets.currentVersion
            )
              continue;
            const seal = { purpose: column.purpose, aad: column.aad?.(row) };
            let plaintext: string;
            try {
              plaintext =
                version === 'legacy'
                  ? column.legacy!.open(value, row)
                  : context.secrets.open(value, seal);
            } catch {
              failed += 1;
              continue;
            }
            if (context.dryRun) {
              resealed += 1;
              continue;
            }
            const result = await options
              .connection()
              .query.updateTable(options.table)
              .set({ [column.column]: context.secrets.seal(plaintext, seal) })
              .where(key, '=', row[key])
              .where(column.column, '=', value)
              .execute();
            if ((result.updatedCount ?? 1) > 0) resealed += 1;
          }
        }
      }
      return { resealed, failed };
    },
  };
}

function classify(value: string, column: SecretsTableColumn): string {
  if (isSealedSecret(value)) return value.split('.')[1];
  return column.legacy?.matches(value) ? 'legacy' : 'malformed';
}
