import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240010_studio_repo_reference_checks',
  async up({ builder }) {
    await builder.alterCollection('studioGitRepos', (collection) => {
      collection.json('referenceChecks').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('studioGitRepos', (collection) => {
      collection.dropField('referenceChecks');
    });
  },
});

export default migration;
