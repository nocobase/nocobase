import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610190010_studio_git_last_received',
  async up({ builder }) {
    await builder.alterCollection('studioGitRepos', (collection) => {
      collection.datetimeTz('lastReceivedAt').nullable();
    });
    await builder.alterCollection('studioGitConnections', (collection) => {
      collection.datetimeTz('lastReceivedAt').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('studioGitConnections', (collection) => {
      collection.dropField('lastReceivedAt');
    });
    await builder.alterCollection('studioGitRepos', (collection) => {
      collection.dropField('lastReceivedAt');
    });
  },
});

export default migration;
