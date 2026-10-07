import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609300003_pm_create_labels',

  async up({ builder }) {
    await builder.createCollection('pmLabels', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('name', { length: 64 }).notNull();
      collection
        .enum('color', {
          values: [
            'gray',
            'red',
            'orange',
            'yellow',
            'green',
            'blue',
            'purple',
          ],
        })
        .notNull()
        .defaultTo('gray');
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.unique(['name']);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('pmLabels');
  },
});

export default migration;
