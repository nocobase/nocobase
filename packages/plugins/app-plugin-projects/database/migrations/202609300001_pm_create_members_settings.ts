import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609300001_pm_create_members_settings',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A user who has used this plugin; created on their first request.
        name: 'pmMembers',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.json('preferences').nullable();
          collection.datetimeTz('joinedAt').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['userId']);
        },
      },
      {
        // One row, `default`: the issue prefix and counter, and the other workspace settings.
        name: 'pmSettings',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issuePrefix', { length: 16 }).notNull();
          collection.integer('issueCounter').notNull().defaultTo(0);
          collection.json('values').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmSettings');
    await builder.dropCollection('pmMembers');
  },
});

export default migration;
