import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240011_pm_issue_progress',
  async up({ builder }) {
    await builder.alterCollection('pmIssues', (collection) => {
      collection.text('needsYou').nullable();
      collection.text('next').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('pmIssues', (collection) => {
      collection.dropField('next');
      collection.dropField('needsYou');
    });
  },
});

export default migration;
