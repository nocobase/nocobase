import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// A repository keeps no preview variables any more: a preview App takes its environment's values and its own, as every
// App does. Their values are not carried anywhere; set what a preview needs on the Preview environment or on the
// preview App. Down makes the table again, as `202610120020_studio_previews_per_pull_request` made it, empty.
const migration: MigrationDefinition = defineMigration({
  name: '202610170050_studio_drop_repo_preview_variables',

  async up({ builder }) {
    await builder.dropCollection('studioRepoPreviewVariables');
  },

  async down({ builder }) {
    await builder.createCollection(
      'studioRepoPreviewVariables',
      (collection) => {
        collection.string('id', { length: 64 }).primary().notNull();
        collection.string('resourceId', { length: 64 }).notNull();
        collection.string('name', { length: 128 }).notNull();
        collection.text('value').notNull();
        collection.boolean('secret').notNull().defaultTo(false);
        collection.string('updatedBy', { length: 64 }).nullable();
        collection.datetimeTz('createdAt').notNull();
        collection.datetimeTz('updatedAt').notNull();
        collection.unique(['resourceId', 'name'], { mode: 'index' });
      },
    );
  },
});

export default migration;
