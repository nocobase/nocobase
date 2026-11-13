import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611130001_rel_apps_environment_created_index',
  async up({ builder }) {
    await builder.alterCollection('relApps', (collection) => {
      collection.index(['environmentId', 'createdAt', 'id'], {
        name: 'rel_apps_environment_created_id',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex('relApps', 'rel_apps_environment_created_id');
  },
});

export default migration;
