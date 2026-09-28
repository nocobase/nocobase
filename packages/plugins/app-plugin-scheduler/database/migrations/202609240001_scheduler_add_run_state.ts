import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

// Scheduling moved from the queue's schedule projection to @nocobase/jobs,
// which keeps only rules. The run state an administrator sees now lives on the
// definition, and each occurrence records the firing time it was planned for.
const migration: MigrationDefinition = defineMigration({
  name: '202609240001_scheduler_add_run_state',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('scheduleDefinitions', (collection) => {
      collection.datetimeTz('nextRunAt');
      collection.datetimeTz('lastRunAt');
      collection.integer('runCount', { nullable: false, defaultValue: 0 });
      collection.integer('appliedLimit');
      collection.string('lastOccurrenceId');
    });
    await builder.alterCollection('scheduleOccurrences', (collection) => {
      collection.datetimeTz('scheduledAt');
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('scheduleOccurrences', (collection) => {
      collection.dropField('scheduledAt');
    });
    await builder.alterCollection('scheduleDefinitions', (collection) => {
      collection.dropField('lastOccurrenceId');
      collection.dropField('appliedLimit');
      collection.dropField('runCount');
      collection.dropField('lastRunAt');
      collection.dropField('nextRunAt');
    });
  },
});

export default migration;
