import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Contextual retrieval (`server/knowledge/vectors.ts`): the sentence a cheap model wrote to situate one section of a
// knowledge entry in its document, prepended to the section before it is embedded. Keyed by the entry and the hash of
// the section's text, so an unchanged section keeps its sentence across versions and rebuilds, and a changed one gets
// a new one; the sentences of sections an entry no longer has are deleted when its sections change.
const migration: MigrationDefinition = defineMigration({
  name: '202610050010_studio_create_knowledge_contexts',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'studioKbContexts',
        definition: (collection) => {
          // `<docId>:<chunk hash>`.
          collection.string('id', { length: 200 }).primary().notNull();
          // The knowledge plugin's entry (no foreign key: its tables are its own).
          collection.string('docId', { length: 64 }).notNull();
          collection.string('chunkHash', { length: 64 }).notNull();
          collection.text('context').notNull();
          // The model service and model that wrote it.
          collection.string('model', { length: 300 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.index(['docId']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioKbContexts');
  },
});

export default migration;
