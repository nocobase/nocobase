import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// The occurrence history is never pruned. The administration page reads it newest first across every Schedule, and
// per Schedule; without these indexes each page sorts the whole table.
const migration: MigrationDefinition = defineMigration({
  name: '202611210001_scheduler_index_occurrences',
  async up({ builder }) {
    await builder.alterCollection('scheduleOccurrences', (collection) => {
      collection.index(['startedAt', 'id'], {
        name: 'schedule_occurrences_started_idx',
      });
      collection.index(['scheduleId', 'startedAt'], {
        name: 'schedule_occurrences_schedule_started_idx',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex(
      'scheduleOccurrences',
      'schedule_occurrences_schedule_started_idx',
    );
    await builder.dropIndex(
      'scheduleOccurrences',
      'schedule_occurrences_started_idx',
    );
  },
});

export default migration;
