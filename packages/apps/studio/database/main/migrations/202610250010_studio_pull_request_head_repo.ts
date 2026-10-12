import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610250010_studio_pull_request_head_repo',
  async up({ builder }) {
    await builder.alterCollection('studioPullRequests', (collection) => {
      collection.string('headRepo', { length: 255 }).nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('studioPullRequests', (collection) => {
      collection.dropField('headRepo');
    });
  },
});
export default migration;
