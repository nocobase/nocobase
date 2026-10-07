import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020006_ag_create_model_prices',

  async up({ builder }) {
    await builder.createCollections([
      {
        // What a model costs per million tokens at one source; reports work costs out from these whenever they are
        // read. The source is the usage's `tool`: `online` with the model service the run called, or a coding tool.
        name: 'agModelPrices',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('tool', { length: 16 }).notNull();
          // The model service (`agModelServices.name`) of a chat price; null for a coding tool's. Deleting a service
          // deletes its prices.
          collection.string('modelService', { length: 64 }).nullable();
          // An online model's id; a coding tool's id or glob (`claude-sonnet-4*`), the most specific match winning.
          collection.string('model', { length: 200 }).notNull();
          collection.double('inputPerM').notNull().defaultTo(0);
          collection.double('outputPerM').notNull().defaultTo(0);
          collection.double('cacheReadPerM').notNull().defaultTo(0);
          collection.double('cacheWritePerM').notNull().defaultTo(0);
          collection.string('currency', { length: 8 }).notNull();
          collection.string('note', { length: 500 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['tool', 'model']);
        },
      },
      {
        // The coding tools paid by subscription: their runs cost nothing.
        name: 'agToolSubscriptions',
        definition: (collection) => {
          collection.string('tool', { length: 16 }).primary().notNull();
          collection.datetimeTz('createdAt').notNull();
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agToolSubscriptions');
    await builder.dropCollection('agModelPrices');
  },
});

export default migration;
