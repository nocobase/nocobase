import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240050_studio_manager_idle',
  async up({ builder }) {
    await builder.createCollection('studioManagerIdle', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('epoch', { length: 64 }).notNull();
      c.datetimeTz('lastAt').notNull();
      c.string('wokenEpoch', { length: 64 }).nullable();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('studioManagerIdle');
  },
});
export default migration;
