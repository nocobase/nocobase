import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// The occurrence history is never pruned. The administration page reads it newest first by planned time
// (`scheduledAt`) across every Schedule, and per Schedule; without these indexes each page sorts the whole table.
// Occurrences recorded before planned times were kept have none; they take their start time, so every row sorts and
// filters on the same column the page shows.
const migration: MigrationDefinition = defineMigration({
  name: '202611210001_scheduler_index_occurrences',
  async up({ builder, query }: MigrationContext): Promise<void> {
    // QueryAdapter has no column-assignment expression. Bounded batches preserve connection naming and temporal
    // encoding on every supported database.
    for (;;) {
      const rows = await query
        .selectFrom('schedule_occurrences')
        .select(['id', 'startedAt'])
        .where('scheduledAt', 'is', null)
        .orderBy('id')
        .limit(500)
        .execute();
      if (rows.length === 0) break;
      for (const row of rows)
        await query
          .updateTable('schedule_occurrences')
          .set({ scheduledAt: row.startedAt })
          .where('id', '=', row.id as string)
          .execute();
    }
    await builder.alterCollection('scheduleOccurrences', (collection) => {
      collection.index(['scheduledAt', 'id'], {
        name: 'schedule_occurrences_scheduled_idx',
      });
      collection.index(['scheduleId', 'scheduledAt'], {
        name: 'schedule_occurrences_schedule_scheduled_idx',
      });
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    // The planned times filled in from start times stay: they equal what the page showed for those rows.
    await builder.dropIndex(
      'scheduleOccurrences',
      'schedule_occurrences_schedule_scheduled_idx',
    );
    await builder.dropIndex(
      'scheduleOccurrences',
      'schedule_occurrences_scheduled_idx',
    );
  },
});

export default migration;
