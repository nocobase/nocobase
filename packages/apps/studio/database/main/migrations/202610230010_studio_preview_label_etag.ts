import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610230010_studio_preview_label_etag',
  async up({ builder }) {
    await builder.alterCollection('studioPreviewLabels', (collection) => {
      collection.string('etag', { length: 1024 }).nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('studioPreviewLabels', (collection) => {
      collection.dropField('etag');
    });
  },
});
export default migration;
