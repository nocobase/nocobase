import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// A connection the demo data made (`server/demo/deploy-build.ts`): Studio never calls its code host, so its repositories,
// pull requests and CI are shown as recorded and every call that would reach the host is refused (`GIT_CONNECTION_DEMO`).
const migration: MigrationDefinition = defineMigration({
  name: '202610150010_studio_git_connection_demo',

  async up({ builder }) {
    await builder.alterCollection('studioGitConnections', (collection) => {
      collection.boolean('demo').notNull().defaultTo(false);
    });
  },

  async down({ builder }) {
    await builder.alterCollection('studioGitConnections', (collection) => {
      collection.dropField('demo');
    });
  },
});

export default migration;
