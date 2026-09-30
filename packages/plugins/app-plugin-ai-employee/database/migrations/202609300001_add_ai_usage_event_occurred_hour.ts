import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
  type QueryAdapter,
} from '@nocobase/db';

/**
 * Adds the UTC hour bucket that usage statistics group by.
 *
 * `occurredAt` is an epoch-millisecond bigint, and the portable query builder
 * exposes no date function, so a time series cannot be grouped in SQL without
 * per-dialect expressions. Storing the bucket alongside the instant keeps every
 * aggregation to one `GROUP BY` that works the same on all supported dialects.
 */

const HOUR_IN_MS = 3_600_000n;
const BACKFILL_BATCH_SIZE = 500;
const INDEX_NAME = 'idx_ai_usage_events_hour';

type BackfillRow = {
  id: string | number | bigint;
  occurredAt: string | number | bigint | null;
};

const migration: MigrationDefinition = defineMigration({
  name: '202609300001_add_ai_usage_event_occurred_hour',
  async up({ builder, query }: MigrationContext): Promise<void> {
    await builder.alterCollection('aiUsageEvents', (collection) => {
      collection.bigInt('occurredHour').nullable();
    });
    await builder.alterCollection('aiUsageEvents', (collection) => {
      collection.index('occurredHour', { name: INDEX_NAME });
    });
    await backfillOccurredHour(query);
  },
  async down({ builder }: MigrationContext): Promise<void> {
    // Separate statements: SQL Server refuses to drop an indexed column, while
    // SQLite rebuilds the table when a column is dropped and takes the index
    // with it, so a drop of both in one alteration fails on one side or the
    // other depending on the order the adapter emits.
    await builder.alterCollection('aiUsageEvents', (collection) => {
      collection.dropIndex(INDEX_NAME);
    });
    await builder.alterCollection('aiUsageEvents', (collection) => {
      collection.dropField('occurredHour');
    });
  },
});

/**
 * Fills the new column in batches, selecting only rows that still need it.
 *
 * The set of remaining rows shrinks by one batch each pass, so no ordering or
 * cursor is involved: `id` is a bigint whose comparison semantics differ
 * between dialects once a driver hands it back as a string, and keyset
 * pagination over it silently skips rows.
 */
async function backfillOccurredHour(query: QueryAdapter): Promise<void> {
  for (;;) {
    const rows = await query
      .selectFrom<BackfillRow>('aiUsageEvents')
      .select(['id', 'occurredAt'])
      .where('occurredHour', 'is', null)
      .limit(BACKFILL_BATCH_SIZE)
      .execute<BackfillRow>();
    if (rows.length === 0) return;

    const idsByHour = new Map<number, Array<string | number | bigint>>();
    for (const row of rows) {
      const hour = toHourBucket(row.occurredAt);
      if (hour === undefined) continue;
      const ids = idsByHour.get(hour);
      if (ids) ids.push(row.id);
      else idsByHour.set(hour, [row.id]);
    }
    // Every remaining row holds an unreadable instant; stop rather than loop.
    if (idsByHour.size === 0) return;

    for (const [hour, ids] of idsByHour) {
      await query
        .updateTable('aiUsageEvents')
        .set({ occurredHour: hour })
        .where('id', 'in', ids)
        .execute();
    }
  }
}

function toHourBucket(value: unknown): number | undefined {
  if (typeof value === 'number') return hoursOf(BigInt(Math.trunc(value)));
  if (typeof value === 'bigint') return hoursOf(value);
  if (typeof value !== 'string') return undefined;
  try {
    const milliseconds = BigInt(value);
    return hoursOf(milliseconds);
  } catch {
    return undefined;
  }
}

/** Floors towards negative infinity, unlike BigInt division. */
function hoursOf(milliseconds: bigint): number {
  return Number(
    milliseconds < 0n
      ? (milliseconds - (HOUR_IN_MS - 1n)) / HOUR_IN_MS
      : milliseconds / HOUR_IN_MS,
  );
}

export default migration;
