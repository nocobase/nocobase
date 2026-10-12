import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610110001_pm_issue_graph_revision',
  async up({ builder, query }) {
    await builder.createCollection('pmIssueGraph', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.integer('revision').notNull().defaultTo(0);
    });
    await query
      .insertInto('pmIssueGraph')
      .values({ id: 'default', revision: 0 })
      .execute();
  },
  async down({ builder }) {
    await builder.dropCollection('pmIssueGraph');
  },
});

export default migration;
