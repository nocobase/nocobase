import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020011_ag_create_vectors',

  async up({ builder }) {
    await builder.createCollections([
      {
        // The vector indexes of the application's vector collections (`server/vectors`): one per collection, embedding
        // model and dimension. A model or dimension change builds a new index while the ready one keeps serving; the
        // old one is then retired and dropped from the vector store. The vectors themselves live in the store.
        name: 'agVectorIndexes',
        definition: (collection) => {
          // `<collection>_<short hash>`; the store names its table after it.
          collection.string('name', { length: 64 }).primary().notNull();
          collection.string('collection', { length: 40 }).notNull();
          // The vector store it lives in: its type, such as `sqlite-vec`, and where it points (a file, or a PostgreSQL
          // server and database, with no secret). Only the indexes of the store configured now are used.
          collection.string('storeType', { length: 32 }).notNull();
          collection.string('storeTarget', { length: 255 }).notNull();
          collection.string('modelService', { length: 64 }).notNull();
          collection.string('model', { length: 200 }).notNull();
          collection.integer('dimension').notNull();
          collection.string('metric', { length: 8 }).notNull();
          // `building`, `ready` or `retired`.
          collection.string('status', { length: 16 }).notNull();
          // When every item of the collection was queued for it; it is ready once nothing is pending after that.
          collection.datetimeTz('enumeratedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('readyAt').nullable();
          collection.index(['collection', 'status']);
        },
      },
      {
        // What each index holds or is about to: one row per item, its text hash (unchanged text is never embedded
        // again), and the queue state of its embedding. The text is kept only until it is embedded.
        name: 'agVectorEntries',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('indexName', { length: 64 }).notNull();
          collection.string('itemId', { length: 200 }).notNull();
          // SHA-256 of the variant and the text.
          collection.string('hash', { length: 64 }).notNull();
          collection.text('text').nullable();
          collection.string('variant', { length: 32 }).nullable();
          collection.json('metadata').notNull().defaultTo({});
          // `pending`, `done` or `failed` (after the last attempt; queued again when the item is written again).
          collection.string('state', { length: 16 }).notNull();
          collection.integer('attempts').notNull().defaultTo(0);
          // Epoch milliseconds: not before then.
          collection.bigInt('nextAt').notNull().defaultTo(0);
          collection.text('error').nullable();
          // Which instance's worker holds it, until when (epoch milliseconds).
          collection.bigInt('leaseUntil').nullable();
          collection.string('leasedBy', { length: 64 }).nullable();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['indexName', 'itemId']);
          collection.index(['state', 'nextAt']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agVectorEntries');
    await builder.dropCollection('agVectorIndexes');
  },
});

export default migration;
