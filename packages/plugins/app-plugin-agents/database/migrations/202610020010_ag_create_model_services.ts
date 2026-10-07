import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020010_ag_create_model_services',

  async up({ builder }) {
    await builder.createCollections([
      {
        // The model services online agents call: one provider endpoint with its key and the models it offers. A
        // provider may have any number of them. Agents and online model prices name a service by `name`.
        name: 'agModelServices',
        definition: (collection) => {
          // Made from the title when the service is added, and never changed.
          collection.string('name', { length: 64 }).primary().notNull();
          collection.string('title', { length: 100 }).notNull();
          // A provider of `MODEL_PROVIDERS` (`shared/models.ts`), such as `openai`.
          collection.string('provider', { length: 32 }).notNull();
          // Null calls the provider's default.
          collection.string('baseUrl', { length: 500 }).nullable();
          // Sealed with the application's secrets keys, bound to the service's name; never answered.
          collection.text('apiKeyEncrypted').nullable();
          collection.boolean('enabled').notNull().defaultTo(true);
          // The models it offers, in order: `{ value, label, kind, dimensions }[]`, `kind` `chat`, `embedding` or
          // `rerank` (`chat` when absent), `dimensions` an embedding model's vector size (null: the model's own).
          collection.json('models').notNull().defaultTo([]);
          collection.integer('sort').notNull().defaultTo(0);
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // What model calls outside any run used: embeddings, reranking and short utility texts the application asks
        // for (`purpose` `embedding`, `rerank` or `text`), named by the caller (`source`, such as `knowledge`).
        // Priced like online runs' calls, from the service's model prices.
        name: 'agModelUsage',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('purpose', { length: 16 }).notNull();
          collection.string('source', { length: 64 }).notNull();
          collection.string('modelService', { length: 64 }).notNull();
          collection.string('model', { length: 200 }).notNull();
          collection.bigInt('inputTokens').notNull().defaultTo(0);
          collection.bigInt('outputTokens').notNull().defaultTo(0);
          // Texts embedded, or documents reranked.
          collection.integer('units').notNull().defaultTo(0);
          collection.datetimeTz('createdAt').notNull();
          collection.index(['createdAt']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agModelUsage');
    await builder.dropCollection('agModelServices');
  },
});

export default migration;
