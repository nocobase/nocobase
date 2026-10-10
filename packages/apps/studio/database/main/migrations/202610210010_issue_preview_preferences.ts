import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610210010_issue_preview_preferences',
  async up({ builder }) {
    await builder.createCollection(
      'studioIssuePreviewPreferences',
      (collection) => {
        collection.string('issueId', { length: 64 }).primary().notNull();
        collection.boolean('notRequired').notNull().defaultTo(false);
      },
    );
    await builder.createCollection('studioPreviewLabels', (collection) => {
      collection.string('pullRequestId', { length: 64 }).primary().notNull();
      collection.boolean('managed').notNull().defaultTo(false);
      collection.boolean('present').nullable();
      collection.boolean('failed').notNull().defaultTo(false);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('studioPreviewLabels');
    await builder.dropCollection('studioIssuePreviewPreferences');
  },
});
export default migration;
