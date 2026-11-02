import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// An application's own Collections, as an equipment borrowing application declares them: two business tables with a
// relation, and a file Collection meeting the file plugin's column contract.
const migration: MigrationDefinition = defineMigration({
  name: '202610200001_foundation_fixture_equipment',

  async up({ builder }) {
    await builder.createCollection('equipment', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('name', { length: 255 }).notNull();
      collection.datetimeTz('createdAt').notNull();
    });
    await builder.createCollection('borrowings', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('equipmentId', { length: 64 }).notNull();
      collection.string('status', { length: 32 }).notNull();
      collection.datetimeTz('createdAt').notNull();
      collection
        .belongsTo('equipment', 'equipment')
        .targetKey('id')
        .foreignKey('equipmentId')
        .constraints(false);
    });
    await builder.createCollection('repairPhotos', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('disk', { length: 255 }).notNull();
      collection.text('key').notNull();
      collection.text('filename').notNull();
      collection.string('ext', { length: 32 }).notNull();
      collection.string('mimeType', { length: 255 }).notNull();
      collection.bigInt('size').notNull();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
    });
  },

  async down({ builder }) {
    await builder.dropCollection('repairPhotos');
    await builder.dropCollection('borrowings');
    await builder.dropCollection('equipment');
  },
});

export default migration;
