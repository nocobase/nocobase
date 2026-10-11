import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610110002_ag_add_work_controls',
  async up({ builder }): Promise<void> {
    // tool already stores the claimed entry. Keep the enqueue choice separately so old callers still fall back.
    await builder.alterCollection('agRuns', (collection) => {
      collection.string('requestedTool', { length: 32 }).nullable();
    });
    await builder.alterCollection('agRunRequests', (collection) => {
      collection.string('tool', { length: 32 }).nullable();
    });
    await builder.createCollection('agSubjectControls', (collection) => {
      collection.string('id', { length: 255 }).primary().notNull();
      collection.string('subjectKind', { length: 64 }).notNull();
      collection.string('subjectId', { length: 64 }).notNull();
      collection.string('pausedByUserId', { length: 64 }).nullable();
      collection.datetimeTz('pausedAt').nullable();
      collection.datetimeTz('lockAt').notNull();
      collection.unique(['subjectKind', 'subjectId']);
    });
  },
  async down({ builder }): Promise<void> {
    await builder.dropCollection('agSubjectControls');
    await builder.alterCollection('agRunRequests', (collection) => {
      collection.dropField('tool');
    });
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('requestedTool');
    });
  },
});

export default migration;
