import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

// Pending reports commit with the run ending, and are delivered with the comment and wakeup guard.
const migration: MigrationDefinition = defineMigration({
  name: '202610240040_studio_run_reports',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.createCollection('studioRunReports', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('status', { length: 16 }).notNull();
      c.json('payload').notNull();
      c.integer('attempts').notNull();
      c.datetimeTz('nextAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.text('lastError').nullable();
      c.index(['status', 'nextAt']);
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.dropCollection('studioRunReports');
  },
});
export default migration;
